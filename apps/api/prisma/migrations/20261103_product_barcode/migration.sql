-- Lector de código de barras opcional en Venta rápida.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "barcode" VARCHAR(64);
CREATE INDEX IF NOT EXISTS "products_barcode_idx" ON "products"("barcode");
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "barcode_scanner" BOOLEAN NOT NULL DEFAULT false;
