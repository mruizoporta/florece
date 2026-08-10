-- Operational accounting: expenses + cash sessions

CREATE TABLE IF NOT EXISTS "expense_categories" (
  "id" BIGSERIAL PRIMARY KEY,
  "tenant_id" BIGINT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3),
  CONSTRAINT "expense_categories_tenant_id_slug_key" UNIQUE ("tenant_id", "slug")
);

CREATE TABLE IF NOT EXISTS "expenses" (
  "id" BIGSERIAL PRIMARY KEY,
  "tenant_id" BIGINT NOT NULL,
  "category_id" BIGINT NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'NIO',
  "method" VARCHAR(20) NOT NULL,
  "spent_at" TIMESTAMP(3) NOT NULL,
  "note" TEXT,
  "receipt_url" TEXT,
  "recorded_by_id" BIGINT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "cash_sessions" (
  "id" BIGSERIAL PRIMARY KEY,
  "tenant_id" BIGINT NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'open',
  "opened_at" TIMESTAMP(3) NOT NULL,
  "closed_at" TIMESTAMP(3),
  "opened_by_id" BIGINT NOT NULL,
  "closed_by_id" BIGINT,
  "opening_float" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "expected_cash" DECIMAL(12, 2),
  "counted_cash" DECIMAL(12, 2),
  "difference" DECIMAL(12, 2),
  "snapshot" JSONB,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "expense_categories_tenant_id_idx" ON "expense_categories"("tenant_id");
CREATE INDEX IF NOT EXISTS "expenses_tenant_id_spent_at_idx" ON "expenses"("tenant_id", "spent_at");
CREATE INDEX IF NOT EXISTS "expenses_category_id_idx" ON "expenses"("category_id");
CREATE INDEX IF NOT EXISTS "cash_sessions_tenant_id_status_idx" ON "cash_sessions"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "cash_sessions_tenant_id_opened_at_idx" ON "cash_sessions"("tenant_id", "opened_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expense_categories_tenant_id_fkey') THEN
    ALTER TABLE "expense_categories"
      ADD CONSTRAINT "expense_categories_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expenses_tenant_id_fkey') THEN
    ALTER TABLE "expenses"
      ADD CONSTRAINT "expenses_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expenses_category_id_fkey') THEN
    ALTER TABLE "expenses"
      ADD CONSTRAINT "expenses_category_id_fkey"
      FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expenses_recorded_by_id_fkey') THEN
    ALTER TABLE "expenses"
      ADD CONSTRAINT "expenses_recorded_by_id_fkey"
      FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cash_sessions_tenant_id_fkey') THEN
    ALTER TABLE "cash_sessions"
      ADD CONSTRAINT "cash_sessions_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cash_sessions_opened_by_id_fkey') THEN
    ALTER TABLE "cash_sessions"
      ADD CONSTRAINT "cash_sessions_opened_by_id_fkey"
      FOREIGN KEY ("opened_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cash_sessions_closed_by_id_fkey') THEN
    ALTER TABLE "cash_sessions"
      ADD CONSTRAINT "cash_sessions_closed_by_id_fkey"
      FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill default expense categories for existing tenants
INSERT INTO "expense_categories" ("tenant_id", "name", "slug", "active", "created_at", "updated_at")
SELECT t."id", c."name", c."slug", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "tenants" t
CROSS JOIN (
  VALUES
    ('Alquiler', 'alquiler'),
    ('Insumos', 'insumos'),
    ('Servicios', 'servicios'),
    ('Marketing', 'marketing'),
    ('Sueldos', 'sueldos'),
    ('Otros', 'otros')
) AS c("name", "slug")
WHERE NOT EXISTS (
  SELECT 1 FROM "expense_categories" ec
  WHERE ec."tenant_id" = t."id" AND ec."slug" = c."slug"
);
