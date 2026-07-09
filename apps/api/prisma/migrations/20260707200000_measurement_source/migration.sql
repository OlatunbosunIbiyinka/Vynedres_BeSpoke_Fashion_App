-- Track whether measurements were entered in studio or client portal
CREATE TYPE "MeasurementSource" AS ENUM ('STUDIO', 'PORTAL');

ALTER TABLE "measurement_profiles" ADD COLUMN "source" "MeasurementSource" NOT NULL DEFAULT 'STUDIO';
