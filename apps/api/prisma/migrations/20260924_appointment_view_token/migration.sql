-- Token opaco para que la clienta consulte su cita sin ver el resto del salón.

ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "view_token" VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS "appointments_view_token_key"
  ON "appointments" ("view_token");
