-- Lista de espera
CREATE TABLE "waitlist" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" BIGINT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(40) NOT NULL,
    "email" VARCHAR(160),
    "date" VARCHAR(10) NOT NULL,
    "employee_id" BIGINT,
    "service_names" VARCHAR(400),
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "note" VARCHAR(400),
    "status" VARCHAR(12) NOT NULL DEFAULT 'waiting',
    "source" VARCHAR(8) NOT NULL DEFAULT 'web',
    "slot_freed_at" TIMESTAMP(3),
    "notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "waitlist_tenant_id_date_status_idx" ON "waitlist"("tenant_id", "date", "status");
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
