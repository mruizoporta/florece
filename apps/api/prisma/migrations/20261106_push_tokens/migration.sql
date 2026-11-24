-- Tokens de notificaciones push (Expo): de una cita (clienta) o de un usuario del salón.
CREATE TABLE IF NOT EXISTS "push_tokens" (
    "id" BIGSERIAL NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "tenant_id" BIGINT NOT NULL,
    "user_id" BIGINT,
    "appointment_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "push_tokens_token_idx" ON "push_tokens"("token");
CREATE INDEX IF NOT EXISTS "push_tokens_user_id_idx" ON "push_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "push_tokens_appointment_id_idx" ON "push_tokens"("appointment_id");
ALTER TABLE "push_tokens" DROP CONSTRAINT IF EXISTS "push_tokens_tenant_id_fkey";
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "push_tokens" DROP CONSTRAINT IF EXISTS "push_tokens_user_id_fkey";
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "push_tokens" DROP CONSTRAINT IF EXISTS "push_tokens_appointment_id_fkey";
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
