-- Tokens de un solo uso para "¿Olvidaste tu contraseña?" (se guarda solo el hash).
CREATE TABLE IF NOT EXISTS "password_reset_links" (
    "id" BIGSERIAL NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_links_token_hash_key" ON "password_reset_links"("token_hash");
CREATE INDEX IF NOT EXISTS "password_reset_links_user_id_idx" ON "password_reset_links"("user_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'password_reset_links_user_id_fkey'
    ) THEN
        ALTER TABLE "password_reset_links"
            ADD CONSTRAINT "password_reset_links_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
