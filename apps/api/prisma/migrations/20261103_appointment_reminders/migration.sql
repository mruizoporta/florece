-- Recordatorios automáticos de citas por correo (24 h y 2 h antes).
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "reminder_24h_sent_at" TIMESTAMP(3);
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "reminder_2h_sent_at" TIMESTAMP(3);
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "appointment_reminders" BOOLEAN NOT NULL DEFAULT true;
