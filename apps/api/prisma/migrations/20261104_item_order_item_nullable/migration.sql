-- La tabla viene de Laravel con item_id obligatorio; el esquema lo tiene opcional
-- (la venta de un bono no es un ítem del catálogo).
ALTER TABLE "item_order" ALTER COLUMN "item_id" DROP NOT NULL;
