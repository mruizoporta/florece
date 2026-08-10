-- Florece SaaS: additive columns for platform billing / entitlements
-- Run as table owner if prisma db push cannot alter legacy schemas.

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_overrides JSONB;

ALTER TABLE plans ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS entitlements JSONB DEFAULT '{}';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 14;

ALTER TABLE users ADD COLUMN IF NOT EXISTS platform_role VARCHAR(32);

CREATE TABLE IF NOT EXISTS saas_payments (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount DECIMAL(14,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'NIO',
  method VARCHAR(20) NOT NULL,
  reference TEXT,
  paid_at TIMESTAMPTZ NOT NULL,
  months INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  recorded_by_id BIGINT NOT NULL REFERENCES users(id),
  plan_id BIGINT REFERENCES plans(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS saas_payments_tenant_id_idx ON saas_payments(tenant_id);
CREATE INDEX IF NOT EXISTS saas_payments_paid_at_idx ON saas_payments(paid_at);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens(user_id);
