-- Employee base salary + commission; line-level stylist attribution

ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "base_salary" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "commission_rate" DECIMAL(5, 2);

UPDATE "employees" SET "base_salary" = 0 WHERE "base_salary" IS NULL;
UPDATE "employees" SET "commission_rate" = 0 WHERE "commission_rate" IS NULL;

ALTER TABLE "employees"
  ALTER COLUMN "base_salary" SET DEFAULT 0,
  ALTER COLUMN "base_salary" SET NOT NULL,
  ALTER COLUMN "commission_rate" SET DEFAULT 0,
  ALTER COLUMN "commission_rate" SET NOT NULL;

ALTER TABLE "item_order"
  ADD COLUMN IF NOT EXISTS "employee_id" BIGINT,
  ADD COLUMN IF NOT EXISTS "commission_rate_snapshot" DECIMAL(5, 2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'item_order_employee_id_fkey'
  ) THEN
    ALTER TABLE "item_order"
      ADD CONSTRAINT "item_order_employee_id_fkey"
      FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "item_order_employee_id_idx" ON "item_order"("employee_id");
