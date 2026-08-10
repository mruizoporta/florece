# Florece cutover — NestJS + Next.js

Laravel is retired as the runtime stack. Domain reference (if kept) lives under `legacy/`.

## Topology

| Service | Prod host | Local |
|---------|-----------|--------|
| Next.js web | `dominio` + `*.dominio` | `http://localhost:3000` |
| NestJS API | `api.dominio` | `http://localhost:3001` |
| Postgres | existing `salon_saas` | same DB (Prisma) |

## DNS / TLS

1. Point apex + www to the web app (Vercel / Node host).
2. Wildcard `*.dominio` → same web app (tenant subdomains).
3. `api.dominio` → NestJS (Fly / Railway / Droplet).
4. Issue TLS for apex, `api`, and wildcard.

## Env checklist

### API (`apps/api/.env`)

- `DATABASE_URL` — Postgres connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — strong secrets
- `CORS_ORIGIN` — web origin(s), comma-separated
- `STRIPE_SECRET` / `STRIPE_WEBHOOK_SECRET` — when billing goes live
- `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL`

### Web (`apps/web/.env.local` / host env)

- `NEXT_PUBLIC_API_URL` — `https://api.dominio`
- `NEXT_PUBLIC_APP_URL` — `https://dominio`

## Pre-cutover SQL

```bash
cd apps/api
npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20260731_refresh_tokens/migration.sql
npm run prisma:seed
```

## Functional checklist

- [ ] `POST /auth/login` with `tenantSlug` + email + password (demo: `demo` / `admin@demo.florece.app` / `demo1234`)
- [ ] `GET /auth/me` with Bearer access token
- [ ] Refresh via httpOnly cookie `refresh_token`
- [ ] Public catalog / employees / settings with `X-Tenant-Slug`
- [ ] Booking wizard `/s/{slug}/agendar` creates appointment (public slots + create)
- [ ] Public salon page sections: about, services, products, team, Instagram, sponsors, WhatsApp, map
- [ ] Customer `/s/{slug}/mi-cuenta` list + cancel (≥6h)
- [ ] Admin: dashboard widgets, board actions, calendar, appointments create, employees CRUD+schedule, catalog writable, orders POS, users, customers, sections, settings/images, sponsors, Instagram, billing
- [ ] Billing: checkout, upgrade, downgrade, portal (mock without Stripe)
- [ ] Stripe webhook signature verification
- [ ] Demo tenant bypasses subscription gate
- [ ] New salon register → `pending_payment` + Admin user
- [ ] Swagger at `https://api.dominio/docs`
- [ ] Laravel PHP-FPM / `artisan serve` stopped; no traffic to Blade/Livewire

## Known thin spots (not blockers for cutover)

- Password reset / email verify: API stubs (no mailer yet)
- Image uploads: filename stubs (no S3/local storage disk yet)
- Prod wildcard subdomain `{slug}.dominio` still needs DNS + Next middleware host parsing

## Local monorepo

```bash
npm install
npm run build -w @florece/shared
npm run db:generate
npm run dev:api   # :3001
npm run dev:web   # :3000
```

## Archive Laravel

```bash
./scripts/archive-laravel.sh
```

Moves PHP app trees into `legacy/laravel/` and leaves a pointer README.
