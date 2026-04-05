-- CreateEnum
CREATE TYPE "OjkLicenseStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateTable
CREATE TABLE "Broker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "establishedYear" INTEGER NOT NULL,
    "ojkLicenseNumber" TEXT NOT NULL,
    "ojkLicenseStatus" "OjkLicenseStatus" NOT NULL,
    "website" TEXT NOT NULL,
    "logoUrl" TEXT,
    "headquarters" JSONB NOT NULL,
    "regulatoryInfo" JSONB NOT NULL,
    "contactInfo" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Broker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerFees" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "tradingFees" JSONB NOT NULL,
    "accountFees" JSONB NOT NULL,
    "otherFees" JSONB NOT NULL,
    "promotions" JSONB NOT NULL DEFAULT '[]',
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerFees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerFeatures" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "tradingPlatforms" JSONB NOT NULL,
    "researchTools" JSONB NOT NULL,
    "orderTypes" JSONB NOT NULL,
    "accountTypes" JSONB NOT NULL,
    "apiAccess" JSONB NOT NULL,
    "education" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrokerFeatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerReview" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAccountType" TEXT NOT NULL,
    "tradingExperience" TEXT NOT NULL,
    "tradingFrequency" TEXT NOT NULL,
    "overallRating" INTEGER NOT NULL DEFAULT 0,
    "criteriaRatings" JSONB NOT NULL,
    "pros" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "detailedReview" TEXT,
    "wouldRecommend" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAccount" BOOLEAN NOT NULL DEFAULT false,
    "helpfulVotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerPerformance" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "systemMetrics" JSONB NOT NULL,
    "tradingMetrics" JSONB NOT NULL,
    "customerServiceMetrics" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrokerPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Broker_name_key" ON "Broker"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Broker_ojkLicenseNumber_key" ON "Broker"("ojkLicenseNumber");

-- CreateIndex
CREATE INDEX "Broker_name_idx" ON "Broker"("name");

-- CreateIndex
CREATE INDEX "Broker_ojkLicenseStatus_idx" ON "Broker"("ojkLicenseStatus");

-- CreateIndex
CREATE UNIQUE INDEX "BrokerFees_brokerId_key" ON "BrokerFees"("brokerId");

-- CreateIndex
CREATE INDEX "BrokerFees_brokerId_idx" ON "BrokerFees"("brokerId");

-- CreateIndex
CREATE UNIQUE INDEX "BrokerFeatures_brokerId_key" ON "BrokerFeatures"("brokerId");

-- CreateIndex
CREATE INDEX "BrokerFeatures_brokerId_idx" ON "BrokerFeatures"("brokerId");

-- CreateIndex
CREATE INDEX "BrokerReview_brokerId_idx" ON "BrokerReview"("brokerId");

-- CreateIndex
CREATE INDEX "BrokerReview_userId_idx" ON "BrokerReview"("userId");

-- CreateIndex
CREATE INDEX "BrokerReview_overallRating_idx" ON "BrokerReview"("overallRating");

-- CreateIndex
CREATE INDEX "BrokerPerformance_brokerId_idx" ON "BrokerPerformance"("brokerId");

-- CreateIndex
CREATE INDEX "BrokerPerformance_date_idx" ON "BrokerPerformance"("date");

-- AddForeignKey
ALTER TABLE "BrokerFees" ADD CONSTRAINT "BrokerFees_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerFeatures" ADD CONSTRAINT "BrokerFeatures_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerReview" ADD CONSTRAINT "BrokerReview_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerReview" ADD CONSTRAINT "BrokerReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerPerformance" ADD CONSTRAINT "BrokerPerformance_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
