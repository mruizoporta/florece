-- Multi-sucursal: Organization (SaaS billing) → Tenant (branch)

CREATE TABLE IF NOT EXISTS "organizations" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "billing_region" VARCHAR(2),
  "billing_email" TEXT,
  "plan_id" BIGINT,
  "scheduled_plan_id" BIGINT,
  "subscription_status" VARCHAR(20) NOT NULL DEFAULT 'trial',
  "subscription_ends_at" TIMESTAMP(3),
  "trial_ends_at" TIMESTAMP(3),
  "past_due_since" TIMESTAMP(3),
  "admin_note" TEXT,
  "feature_overrides" JSONB,
  "stripe_id" TEXT,
  "pm_type" TEXT,
  "pm_last_four" TEXT,
  "created_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "organization_members" (
  "id" BIGSERIAL PRIMARY KEY,
  "organization_id" BIGINT NOT NULL,
  "user_id" BIGINT NOT NULL,
  "org_role" VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_members_organization_id_user_id_key" UNIQUE ("organization_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "branch_memberships" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT NOT NULL,
  "tenant_id" BIGINT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "branch_memberships_user_id_tenant_id_key" UNIQUE ("user_id", "tenant_id")
);

DO $$
DECLARE
  r RECORD;
  new_org_id BIGINT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE "tenants" ADD COLUMN "organization_id" BIGINT;

    FOR r IN SELECT * FROM "tenants" LOOP
      INSERT INTO "organizations" (
        "name", "billing_region", "billing_email", "plan_id", "scheduled_plan_id",
        "subscription_status", "subscription_ends_at", "trial_ends_at", "past_due_since",
        "admin_note", "feature_overrides", "stripe_id", "pm_type", "pm_last_four",
        "created_at", "updated_at"
      ) VALUES (
        r."name", r."billing_region", r."billing_email", r."plan_id", r."scheduled_plan_id",
        COALESCE(r."subscription_status", 'trial'), r."subscription_ends_at", r."trial_ends_at", r."past_due_since",
        r."admin_note", r."feature_overrides", r."stripe_id", r."pm_type", r."pm_last_four",
        COALESCE(r."created_at", CURRENT_TIMESTAMP), COALESCE(r."updated_at", CURRENT_TIMESTAMP)
      ) RETURNING "id" INTO new_org_id;

      UPDATE "tenants" SET "organization_id" = new_org_id WHERE "id" = r."id";
    END LOOP;

    ALTER TABLE "tenants" ALTER COLUMN "organization_id" SET NOT NULL;
  END IF;
END $$;

INSERT INTO "organization_members" ("organization_id", "user_id", "org_role")
SELECT t."organization_id", u."id", 'OWNER'
FROM "users" u
JOIN "tenants" t ON t."id" = u."tenant_id"
WHERE t."organization_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "organization_members" m
    WHERE m."organization_id" = t."organization_id" AND m."user_id" = u."id"
  );

INSERT INTO "branch_memberships" ("user_id", "tenant_id")
SELECT u."id", u."tenant_id"
FROM "users" u
WHERE NOT EXISTS (
  SELECT 1 FROM "branch_memberships" b
  WHERE b."user_id" = u."id" AND b."tenant_id" = u."tenant_id"
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saas_payments' AND column_name = 'tenant_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saas_payments' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE "saas_payments" ADD COLUMN "organization_id" BIGINT;

    UPDATE "saas_payments" sp
    SET "organization_id" = t."organization_id"
    FROM "tenants" t
    WHERE t."id" = sp."tenant_id";

    DELETE FROM "saas_payments" WHERE "organization_id" IS NULL;
    ALTER TABLE "saas_payments" ALTER COLUMN "organization_id" SET NOT NULL;
    ALTER TABLE "saas_payments" DROP CONSTRAINT IF EXISTS "saas_payments_tenant_id_fkey";
    DROP INDEX IF EXISTS "saas_payments_tenant_id_idx";
    ALTER TABLE "saas_payments" DROP COLUMN "tenant_id";
  END IF;
END $$;

ALTER TABLE "tenants" DROP COLUMN IF EXISTS "billing_region";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "billing_email";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "plan_id";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "scheduled_plan_id";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "subscription_status";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "subscription_ends_at";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "trial_ends_at";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "past_due_since";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "admin_note";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "feature_overrides";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "stripe_id";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "pm_type";
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "pm_last_four";

CREATE INDEX IF NOT EXISTS "tenants_organization_id_idx" ON "tenants"("organization_id");
CREATE INDEX IF NOT EXISTS "organization_members_user_id_idx" ON "organization_members"("user_id");
CREATE INDEX IF NOT EXISTS "branch_memberships_tenant_id_idx" ON "branch_memberships"("tenant_id");
CREATE INDEX IF NOT EXISTS "saas_payments_organization_id_idx" ON "saas_payments"("organization_id");
CREATE INDEX IF NOT EXISTS "saas_payments_paid_at_idx" ON "saas_payments"("paid_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenants_organization_id_fkey') THEN
    ALTER TABLE "tenants"
      ADD CONSTRAINT "tenants_organization_id_fkey"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organization_members_organization_id_fkey') THEN
    ALTER TABLE "organization_members"
      ADD CONSTRAINT "organization_members_organization_id_fkey"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organization_members_user_id_fkey') THEN
    ALTER TABLE "organization_members"
      ADD CONSTRAINT "organization_members_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branch_memberships_user_id_fkey') THEN
    ALTER TABLE "branch_memberships"
      ADD CONSTRAINT "branch_memberships_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branch_memberships_tenant_id_fkey') THEN
    ALTER TABLE "branch_memberships"
      ADD CONSTRAINT "branch_memberships_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saas_payments_organization_id_fkey') THEN
    ALTER TABLE "saas_payments"
      ADD CONSTRAINT "saas_payments_organization_id_fkey"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_plan_id_fkey') THEN
    ALTER TABLE "organizations"
      ADD CONSTRAINT "organizations_plan_id_fkey"
      FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_scheduled_plan_id_fkey') THEN
    ALTER TABLE "organizations"
      ADD CONSTRAINT "organizations_scheduled_plan_id_fkey"
      FOREIGN KEY ("scheduled_plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
