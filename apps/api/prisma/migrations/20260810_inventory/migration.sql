-- Product inventory: minimum stock + movement ledger
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL,
  quantity INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inventory_movements_tenant_product_created_idx
  ON inventory_movements (tenant_id, product_id, created_at);

CREATE INDEX IF NOT EXISTS inventory_movements_order_id_idx
  ON inventory_movements (order_id);
