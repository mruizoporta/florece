#!/usr/bin/env bash
# Move Laravel runtime into legacy/laravel (idempotent).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/legacy/laravel"
mkdir -p "$DEST"

items=(
  app artisan bootstrap composer.json composer.lock config database
  phpunit.xml public resources routes tests vendor storage
  vite.config.js postcss.config.js .php-version
)

for item in "${items[@]}"; do
  if [[ -e "$ROOT/$item" && ! -e "$DEST/$item" ]]; then
    echo "Moving $item → legacy/laravel/"
    mv "$ROOT/$item" "$DEST/"
  elif [[ -e "$DEST/$item" ]]; then
    echo "Already archived: $item"
  else
    echo "Skip missing: $item"
  fi
done

# Keep Laravel frontend package lock aside if present at root from old vite app
if [[ -f "$ROOT/package-lock.json" ]] && grep -q 'laravel-vite-plugin' "$ROOT/package-lock.json" 2>/dev/null; then
  if [[ ! -f "$DEST/package-lock.laravel.json" ]]; then
    cp "$ROOT/package-lock.json" "$DEST/package-lock.laravel.json" || true
  fi
fi

cat > "$ROOT/legacy/README.md" <<'EOF'
# Legacy Laravel (archived)

Florece runtime is now NestJS (`apps/api`) + Next.js (`apps/web`).

This folder holds the previous Laravel 10 + Livewire application for domain reference only.
Do not deploy it. Prefer reading domain rules here when porting remaining edge cases.

See `docs/CUTOVER.md` for DNS, env, and go-live checklist.
EOF

echo "Done. Laravel archived under legacy/laravel/"
