-- Costo de productos: promedio por producto, costo y proveedor en ingresos, costo congelado en cada venta.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cost" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "inventory_movements" ADD COLUMN IF NOT EXISTS "unit_cost" DECIMAL(12,2);
ALTER TABLE "inventory_movements" ADD COLUMN IF NOT EXISTS "supplier" VARCHAR(120);
ALTER TABLE "item_order" ADD COLUMN IF NOT EXISTS "unit_cost_snapshot" DECIMAL(12,2);
