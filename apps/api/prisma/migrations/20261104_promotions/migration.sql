-- Descuentos y promociones (idempotente: se puede volver a correr)
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "manual_discounts" VARCHAR(10) NOT NULL DEFAULT 'admin';
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "manual_discount_max_pct" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "stack_promotions" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "item_order" ADD COLUMN IF NOT EXISTS "promo_discount" DECIMAL(10,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "promotions" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" BIGINT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "kind" VARCHAR(10) NOT NULL,
    "code" VARCHAR(30),
    "discount_type" VARCHAR(10) NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "applies_to" VARCHAR(10) NOT NULL DEFAULT 'all',
    "item_ids" JSONB,
    "weekdays" JSONB,
    "from_time" VARCHAR(5),
    "to_time" VARCHAR(5),
    "first_visit_only" BOOLEAN NOT NULL DEFAULT false,
    "min_total" DECIMAL(10,2),
    "starts_on" VARCHAR(10),
    "ends_on" VARCHAR(10),
    "max_uses" INTEGER,
    "uses_count" INTEGER NOT NULL DEFAULT 0,
    "show_on_booking" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "promotions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "promotions_tenant_id_code_key" ON "promotions"("tenant_id", "code");
CREATE INDEX IF NOT EXISTS "promotions_tenant_id_kind_active_idx" ON "promotions"("tenant_id", "kind", "active");

CREATE TABLE IF NOT EXISTS "order_discounts" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" BIGINT NOT NULL,
    "order_id" BIGINT NOT NULL,
    "promotion_id" BIGINT,
    "source" VARCHAR(10) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "discount_type" VARCHAR(10) NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "note" VARCHAR(160),
    "reason" VARCHAR(200),
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_discounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "order_discounts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_discounts_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "order_discounts_order_id_idx" ON "order_discounts"("order_id");
CREATE INDEX IF NOT EXISTS "order_discounts_tenant_id_created_at_idx" ON "order_discounts"("tenant_id", "created_at");
