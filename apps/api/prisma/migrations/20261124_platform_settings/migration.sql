-- Ajustes de toda la plataforma (por ejemplo, versiones mínimas de la app móvil).
CREATE TABLE IF NOT EXISTS "platform_settings" (
    "key" VARCHAR(80) NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);
