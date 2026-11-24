-- Pagos de planilla y adelantos a empleados.
CREATE TABLE IF NOT EXISTS "payroll_payments" (
  "id" BIGSERIAL PRIMARY KEY,
  "tenant_id" BIGINT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "employee_id" BIGINT NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "kind" VARCHAR(10) NOT NULL,
  "period_from" VARCHAR(10),
  "period_to" VARCHAR(10),
  "base" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "commission" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "bonus" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "deduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "advances" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "amount" DECIMAL(12,2) NOT NULL,
  "method" VARCHAR(20) NOT NULL,
  "note" TEXT,
  "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recorded_by_id" BIGINT,
  "expense_id" BIGINT,
  "applied_to_id" BIGINT,
  "cancelled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "payroll_payments_tenant_id_employee_id_idx" ON "payroll_payments"("tenant_id", "employee_id");
