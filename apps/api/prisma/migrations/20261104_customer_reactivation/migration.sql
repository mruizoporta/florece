-- Recuperar clientas inactivas: cuándo se les escribió por última vez.
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "last_contacted_at" TIMESTAMP(3);
