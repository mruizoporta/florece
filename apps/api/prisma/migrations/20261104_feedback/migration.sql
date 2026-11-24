-- Encuesta después de la visita y link de reseñas en Google
ALTER TABLE "settings" ADD COLUMN "feedback_requests" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "settings" ADD COLUMN "google_review_url" TEXT;

CREATE TABLE "feedback" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" BIGINT NOT NULL,
    "token" VARCHAR(48) NOT NULL,
    "appointment_id" BIGINT,
    "order_id" BIGINT,
    "customer_name" VARCHAR(120),
    "employee_id" BIGINT,
    "employee_name" VARCHAR(120),
    "service_names" VARCHAR(400),
    "rating" INTEGER,
    "comment" TEXT,
    "review_clicked" BOOLEAN NOT NULL DEFAULT false,
    "channel" VARCHAR(10) NOT NULL DEFAULT 'link',
    "answered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "feedback_rating_check" CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5)
);
CREATE UNIQUE INDEX "feedback_token_key" ON "feedback"("token");
CREATE UNIQUE INDEX "feedback_appointment_id_key" ON "feedback"("appointment_id");
CREATE UNIQUE INDEX "feedback_order_id_key" ON "feedback"("order_id");
CREATE INDEX "feedback_tenant_id_answered_at_idx" ON "feedback"("tenant_id", "answered_at");
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
