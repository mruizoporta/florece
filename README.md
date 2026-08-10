# Florece

Multi-tenant salon SaaS — **NestJS API** + **Next.js** monorepo (Postgres via Prisma). Mercado principal: **Nicaragua**, cobro manual (transferencia / depósito / efectivo).

## Structure

```
apps/api          NestJS + Prisma + JWT + /platform
apps/web          Next.js App Router + Tailwind
packages/shared   Zod schemas, planes, entitlements
docs/CUTOVER.md   DNS, env, go-live checklist
legacy/           Archived Laravel
```

## Quick start

```bash
npm install
npm run build -w @florece/shared
npm run db:generate
# Apply additive SQL if db push hits legacy column conflicts (see below)
npm run db:seed
npm run dev       # API :3001 + web :3000 (or use dev:api / dev:web)
```

### Credenciales demo

| Rol | Código salón | Email | Password | Plan |
|-----|--------------|-------|----------|------|
| Admin salón | `demo` | `admin@demo.florece.app` | `demo1234` | **Premium** |
| **Owner plataforma** | `ops` | `owner@florece.app` | `florece-owner-2026` | — |

El demo incluye **Patrocinadores** (Presencia → Patrocinadores) y multi-sucursal. Son marcas/aliados que se muestran en el sitio público.

**Usuarios del salón (staff):** el dueño (Admin) crea usuarios con permisos:
- **Agenda / recepción** — citas y calendario
- **Caja / facturación** — órdenes POS
- **Administrador** — todo (catálogo, usuarios, ajustes)
- Se pueden combinar (ej. Agenda + Caja)

- Panel salón: `/s/demo/admin`
- **Admin plataforma Florece:** `/admin` (login con salón `ops`)
- Sitio público demo: `/s/demo`

### Cobro NI (flujo principal)

1. El salón se registra (`/registrar-salon`) → estado `trial`.
2. El owner Florece entra a `/admin` → salón → **Registrar pago manual**.
3. Se crea `SaasPayment`, se extiende `subscriptionEndsAt` y el estado pasa a `active`.
4. El banner en `/s/{slug}/admin` refleja trial / past_due / suspended.

Stripe permanece opcional (legacy / US); no es requisito para activar un tenant NI.

### Migración schema (aditiva)

Si `prisma db push` falla por columnas legacy (p.ej. `schedules.weekday`), aplicá SQL aditivo como dueño de la DB:

```sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_overrides JSONB;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS entitlements JSONB DEFAULT '{}';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 14;
ALTER TABLE users ADD COLUMN IF NOT EXISTS platform_role VARCHAR(32);
-- + tabla saas_payments (ver prisma/schema.prisma)
```

Luego: `npm run db:seed`.

## Env

Ver `.env.example` y `apps/api/.env.example`.

Marketing (web):

```
NEXT_PUBLIC_MARKETING_WHATSAPP_URL=https://wa.me/505XXXXXXXX
NEXT_PUBLIC_MARKETING_INSTAGRAM_URL=https://www.instagram.com/florece.app
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | API + web |
| `npm run dev:api` | Nest watch on :3001 |
| `npm run dev:web` | Next on :3000 |
| `npm run test:api` | Jest |
| `npm run db:seed` | Planes + demo + platform owner |

Cutover / DNS: [docs/CUTOVER.md](docs/CUTOVER.md).
