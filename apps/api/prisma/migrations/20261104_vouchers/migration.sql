-- Bonos: gift cards y paquetes de sesiones
CREATE TABLE "vouchers" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" BIGINT NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "kind" VARCHAR(10) NOT NULL,
    "holder_name" VARCHAR(120) NOT NULL,
    "holder_phone" VARCHAR(40),
    "price" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "service_item_id" BIGINT,
    "service_name" VARCHAR(120),
    "sessions_total" INTEGER NOT NULL DEFAULT 0,
    "sessions_used" INTEGER NOT NULL DEFAULT 0,
    "sale_order_id" BIGINT,
    "expires_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_by_id" BIGINT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vouchers_sessions_check" CHECK ("sessions_used" >= 0 AND "sessions_used" <= "sessions_total"),
    CONSTRAINT "vouchers_balance_check" CHECK ("balance" >= 0)
);
CREATE UNIQUE INDEX "vouchers_tenant_id_code_key" ON "vouchers"("tenant_id", "code");
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
