-- Service recipes: products consumed when a service is sold (Pro+)
CREATE TABLE IF NOT EXISTS service_consumables (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (service_id, product_id)
);

CREATE INDEX IF NOT EXISTS service_consumables_tenant_id_idx
  ON service_consumables (tenant_id);
