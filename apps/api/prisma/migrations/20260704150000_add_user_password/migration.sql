-- AlterTable
ALTER TABLE "users" ADD COLUMN "passwordHash" TEXT;

-- Backfill existing users with a placeholder; seed will set the real demo password.
UPDATE "users" SET "passwordHash" = '$2b$10$IGSMkqtDy7AanCZBdgxpx.byb3nHKp8LjipuzQNgjHM4omAglHluO' WHERE "passwordHash" IS NULL;

-- Make required
ALTER TABLE "users" ALTER COLUMN "passwordHash" SET NOT NULL;
