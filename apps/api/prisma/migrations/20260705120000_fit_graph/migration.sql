-- Fit Graph: fitting rounds + delivery outcomes
ALTER TABLE "measurement_profiles" ADD COLUMN "orderId" TEXT;

CREATE TABLE "fitting_rounds" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Fitting',
    "measurements" JSONB NOT NULL,
    "alterations" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fitting_rounds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_outcomes" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fitSuccess" BOOLEAN NOT NULL,
    "remakeRequired" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_outcomes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fitting_rounds_orderId_roundNumber_key" ON "fitting_rounds"("orderId", "roundNumber");
CREATE INDEX "fitting_rounds_tenantId_idx" ON "fitting_rounds"("tenantId");
CREATE INDEX "fitting_rounds_orderId_idx" ON "fitting_rounds"("orderId");
CREATE UNIQUE INDEX "order_outcomes_orderId_key" ON "order_outcomes"("orderId");
CREATE INDEX "measurement_profiles_orderId_idx" ON "measurement_profiles"("orderId");

ALTER TABLE "measurement_profiles" ADD CONSTRAINT "measurement_profiles_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fitting_rounds" ADD CONSTRAINT "fitting_rounds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_outcomes" ADD CONSTRAINT "order_outcomes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
