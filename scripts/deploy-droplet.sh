#!/usr/bin/env bash
# Deploy Florece al droplet compartido (Cifra + DealerFlow + Florece).
# Uso: ./scripts/deploy-droplet.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${FLORECE_DEPLOY_HOST:-root@209.38.139.227}"
REMOTE_DIR="${FLORECE_REMOTE_DIR:-/opt/florece}"
PUBLIC_URL="${FLORECE_PUBLIC_URL:-http://209.38.139.227:8090}"

# Build DATABASE_URL for server (local Postgres on droplet)
if [[ -z "${FLORECE_DATABASE_URL:-}" && -f "${ROOT_DIR}/.env" ]]; then
  DB_USER="$(grep -E '^DB_USERNAME=' "${ROOT_DIR}/.env" | cut -d= -f2- || true)"
  DB_PASS="$(grep -E '^DB_PASSWORD=' "${ROOT_DIR}/.env" | cut -d= -f2- || true)"
  DB_NAME="$(grep -E '^DB_DATABASE=' "${ROOT_DIR}/.env" | cut -d= -f2- || true)"
  if [[ -n "${DB_USER}" && -n "${DB_PASS}" && -n "${DB_NAME}" ]]; then
    # URL-encode password minimally for @ : /
    ENC_PASS="$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "${DB_PASS}")"
    FLORECE_DATABASE_URL="postgresql://${DB_USER}:${ENC_PASS}@127.0.0.1:5432/${DB_NAME}"
  fi
fi
FLORECE_DATABASE_URL="${FLORECE_DATABASE_URL:-postgresql://shearly@127.0.0.1:5432/salon_saas}"

cd "$ROOT_DIR"
chmod +x "${ROOT_DIR}/scripts/deploy-droplet.sh"

echo "==> Syncing code to ${HOST}:${REMOTE_DIR}"
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '**/node_modules' \
  --exclude '.env' \
  --exclude 'apps/api/.env' \
  --exclude 'apps/web/.env' \
  --exclude 'apps/web/.env.local' \
  --exclude 'apps/web/.next' \
  --exclude 'apps/api/dist' \
  --exclude 'packages/shared/dist' \
  --exclude 'legacy' \
  --exclude '.venv' \
  --exclude '.DS_Store' \
  --exclude 'coverage' \
  --exclude '*.log' \
  "$ROOT_DIR/" "${HOST}:${REMOTE_DIR}/"

echo "==> Ensuring production .env on server"
ssh -o BatchMode=yes "$HOST" \
  REMOTE_DIR="$REMOTE_DIR" \
  PUBLIC_URL="$PUBLIC_URL" \
  FLORECE_DATABASE_URL="$FLORECE_DATABASE_URL" \
  bash -s <<'EOF'
set -euo pipefail
mkdir -p "${REMOTE_DIR}"
if [[ ! -f "${REMOTE_DIR}/.env" ]]; then
  ACCESS="$(openssl rand -base64 32 | tr -d '\n')"
  REFRESH="$(openssl rand -base64 32 | tr -d '\n')"
  cat > "${REMOTE_DIR}/.env" <<ENVEOF
NODE_ENV=production
PORT=3020
DATABASE_URL=${FLORECE_DATABASE_URL}
JWT_ACCESS_SECRET=${ACCESS}
JWT_REFRESH_SECRET=${REFRESH}
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
CORS_ORIGIN=${PUBLIC_URL}
APP_URL=${PUBLIC_URL}
API_URL=${PUBLIC_URL}/backend
API_PROXY_TARGET=http://127.0.0.1:3020
NEXT_PUBLIC_APP_URL=${PUBLIC_URL}
NEXT_PUBLIC_WS_URL=${PUBLIC_URL}
NEXT_PUBLIC_MARKETING_WHATSAPP_URL=https://wa.me/50500000000
NEXT_PUBLIC_MARKETING_INSTAGRAM_URL=https://www.instagram.com/florece.app
NEXT_PUBLIC_MARKETING_FACEBOOK_URL=https://www.facebook.com/floreceapp
ENVEOF
  chmod 600 "${REMOTE_DIR}/.env"
  echo "Created ${REMOTE_DIR}/.env"
else
  echo "Keeping existing ${REMOTE_DIR}/.env"
fi
EOF

echo "==> Remote install, build, seed, restart"
ssh -o BatchMode=yes "$HOST" bash -s <<EOF
set -euo pipefail
export PATH="/usr/local/bin:\$PATH"
cd ${REMOTE_DIR}

set -a
# shellcheck disable=SC1091
source ${REMOTE_DIR}/.env
set +a

ln -sfn ${REMOTE_DIR}/.env ${REMOTE_DIR}/apps/api/.env
ln -sfn ${REMOTE_DIR}/.env ${REMOTE_DIR}/apps/web/.env.local

# Install with devDeps (Nest CLI, etc.) even if .env sets NODE_ENV=production
npm install --no-fund --no-audit --include=dev

npm run build -w @florece/shared
npm run prisma:generate -w @florece/api
npm run build -w @florece/api
npm run build -w @florece/web

# Schema migrations (owner often postgres on shared droplet)
if command -v psql >/dev/null 2>&1; then
  echo "Applying SQL migrations as postgres..."
  sudo -u postgres psql -d salon_saas -v ON_ERROR_STOP=0 -f ${REMOTE_DIR}/apps/api/prisma/sql/2026_saas_platform.sql || true
  sudo -u postgres psql -d salon_saas -v ON_ERROR_STOP=0 -f ${REMOTE_DIR}/apps/api/prisma/migrations/20260731_refresh_tokens/migration.sql || true
  sudo -u postgres psql -d salon_saas -v ON_ERROR_STOP=0 -f ${REMOTE_DIR}/apps/api/prisma/migrations/20260810_organizations/migration.sql || true
  sudo -u postgres psql -d salon_saas -v ON_ERROR_STOP=0 -f ${REMOTE_DIR}/apps/api/prisma/migrations/20260810_accounting/migration.sql || true
fi

npm run prisma:seed -w @florece/api || echo "Seed warning (non-fatal)"

install -m 644 ${REMOTE_DIR}/deploy/florece-api.service /etc/systemd/system/florece-api.service
install -m 644 ${REMOTE_DIR}/deploy/florece-web.service /etc/systemd/system/florece-web.service
install -m 644 ${REMOTE_DIR}/deploy/nginx-florece.conf /etc/nginx/sites-available/florece
ln -sfn /etc/nginx/sites-available/florece /etc/nginx/sites-enabled/florece

if command -v ufw >/dev/null 2>&1; then
  ufw allow 8090/tcp || true
fi

systemctl daemon-reload
systemctl enable florece-api florece-web
systemctl restart florece-api
# Give API a moment before web
sleep 2
systemctl restart florece-web

nginx -t
systemctl reload nginx

echo "Waiting for API :3020 ..."
ok=0
for i in \$(seq 1 45); do
  if curl -fsS http://127.0.0.1:3020/docs >/dev/null 2>&1 || curl -fsS http://127.0.0.1:3020/ >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 2
done
if [[ "\$ok" != "1" ]]; then
  echo "API did not become ready"
  journalctl -u florece-api -n 60 --no-pager || true
  exit 1
fi

echo "Waiting for Web :3021 ..."
ok=0
for i in \$(seq 1 45); do
  code=\$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3021/ || true)
  if [[ "\$code" =~ ^(200|307|308)\$ ]]; then
    ok=1
    break
  fi
  sleep 2
done
if [[ "\$ok" != "1" ]]; then
  echo "Web did not become ready"
  journalctl -u florece-web -n 60 --no-pager || true
  exit 1
fi

echo "Deploy OK — ${PUBLIC_URL}"
echo "Demo admin: ${PUBLIC_URL}/login  (slug demo / admin@demo.florece.app / demo1234)"
EOF
