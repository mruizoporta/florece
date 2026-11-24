-- Comisión propia por servicio y comisión por venta de productos
ALTER TABLE "employees" ADD COLUMN "product_commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "services" ADD COLUMN "commission_rate" DECIMAL(5,2);
