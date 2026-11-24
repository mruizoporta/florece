-- Estado «No se presentó» para cada salón que todavía no lo tenga
INSERT INTO "status" ("name", "description", "bg_color", "tenant_id")
SELECT 'No se presentó', 'La clienta no vino y no avisó', 'secondary', t."id"
FROM "tenants" t
WHERE NOT EXISTS (
  SELECT 1 FROM "status" s WHERE s."tenant_id" = t."id" AND s."name" = 'No se presentó'
);
