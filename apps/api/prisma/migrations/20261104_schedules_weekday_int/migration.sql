-- La tabla viene de Laravel con weekday como texto; Prisma lo trata como entero
-- y guardar el horario de una profesional fallaba.
ALTER TABLE "schedules" DROP CONSTRAINT IF EXISTS "schedules_weekday_check";
ALTER TABLE "schedules" ALTER COLUMN "weekday" TYPE INTEGER USING trim("weekday"::text)::integer;
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_weekday_check" CHECK ("weekday" BETWEEN 1 AND 7);
