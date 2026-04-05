-- Create AlertType enum
CREATE TYPE "AlertType" AS ENUM ('ONE_TIME', 'RECURRING', 'EXPIRING');

-- Add missing columns to User table
ALTER TABLE "User" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lockedUntil" TIMESTAMP(3);

-- Add missing columns to PriceAlert table
ALTER TABLE "PriceAlert" ADD COLUMN "alertType" "AlertType" NOT NULL DEFAULT 'ONE_TIME';
ALTER TABLE "PriceAlert" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "PriceAlert" ADD COLUMN "cooldownUntil" TIMESTAMP(3);
ALTER TABLE "PriceAlert" ADD COLUMN "notificationChannels" TEXT[] DEFAULT ARRAY['in_app']::TEXT[];

-- Add index for PriceAlert isActive + expiresAt
CREATE INDEX "PriceAlert_isActive_expiresAt_idx" ON "PriceAlert"("isActive", "expiresAt");
