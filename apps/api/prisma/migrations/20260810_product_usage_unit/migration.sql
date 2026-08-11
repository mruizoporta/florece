-- Separate retail (vitrina) vs internal (insumo) stock, with unit label.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS usage VARCHAR(20) NOT NULL DEFAULT 'retail';

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS unit VARCHAR(10) NOT NULL DEFAULT 'unit';

UPDATE products SET usage = 'retail' WHERE usage IS NULL OR usage = '';
UPDATE products SET unit = 'unit' WHERE unit IS NULL OR unit = '';

CREATE INDEX IF NOT EXISTS products_usage_idx ON products (usage);
