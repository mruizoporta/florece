-- Refresh tokens table for NestJS JWT rotation
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" BIGSERIAL NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "tenant_id" BIGINT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'refresh_tokens_user_id_fkey'
    ) THEN
        ALTER TABLE "refresh_tokens"
            ADD CONSTRAINT "refresh_tokens_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'refresh_tokens_tenant_id_fkey'
    ) THEN
        ALTER TABLE "refresh_tokens"
            ADD CONSTRAINT "refresh_tokens_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
