-- Ficha técnica de la clienta
ALTER TABLE "customers" ADD COLUMN "allergies" TEXT;

CREATE TABLE "customer_records" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" BIGINT NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "employee_id" BIGINT,
    "service_name" VARCHAR(120),
    "formula" TEXT,
    "notes" TEXT,
    "before_photo" TEXT,
    "after_photo" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" BIGINT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "customer_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "customer_records_tenant_id_customer_id_recorded_at_idx" ON "customer_records"("tenant_id", "customer_id", "recorded_at");

ALTER TABLE "customer_records" ADD CONSTRAINT "customer_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_records" ADD CONSTRAINT "customer_records_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_records" ADD CONSTRAINT "customer_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
