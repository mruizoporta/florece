-- La tabla viene de Laravel sin el índice único que usa el upsert de Prisma
-- (editar una profesional daba 500). Se deja la fila más reciente por profesional.
DELETE FROM "personal_information" a
USING "personal_information" b
WHERE a."employee_id" = b."employee_id" AND a."id" < b."id";

CREATE UNIQUE INDEX IF NOT EXISTS "personal_information_employee_id_key"
  ON "personal_information" ("employee_id");
