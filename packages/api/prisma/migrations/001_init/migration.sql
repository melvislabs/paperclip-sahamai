-- CreateEnum
CREATE TYPE "AnalysisType" AS ENUM ('TECHNICAL', 'FUNDAMENTAL', 'SENTIMENT', 'PORTFOLIO_RISK', 'DAILY_DIGEST');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('BULLISH', 'BEARISH', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertCondition" AS ENUM ('ABOVE', 'BELOW', 'PERCENT_CHANGE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cashBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "riskScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holding" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "avgCostPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "exchange" TEXT,
    "sector" TEXT,
    "industry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockPrice" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "open" DECIMAL(10,2) NOT NULL,
    "high" DECIMAL(10,2) NOT NULL,
    "low" DECIMAL(10,2) NOT NULL,
    "volume" BIGINT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "userId" TEXT,
    "analysisType" "AnalysisType" NOT NULL,
    "summary" TEXT NOT NULL,
    "sentiment" "Sentiment" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "priceTarget" DECIMAL(10,2),
    "reasoning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "targetPrice" DECIMAL(10,2) NOT NULL,
    "condition" "AlertCondition" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT,
    "sentiment" "Sentiment" NOT NULL DEFAULT 'NEUTRAL',
    "sentimentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "symbols" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigestPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "deliveryTime" TEXT NOT NULL DEFAULT '08:00',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "includeAlerts" BOOLEAN NOT NULL DEFAULT true,
    "includeAnalysis" BOOLEAN NOT NULL DEFAULT true,
    "includeMarketSummary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigestPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_googleId_idx" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_userId_key" ON "Portfolio"("userId");

-- CreateIndex
CREATE INDEX "Portfolio_userId_idx" ON "Portfolio"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Holding_portfolioId_symbol_key" ON "Holding"("portfolioId", "symbol");

-- CreateIndex
CREATE INDEX "Holding_portfolioId_idx" ON "Holding"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_symbol_key" ON "Stock"("symbol");

-- CreateIndex
CREATE INDEX "Stock_symbol_idx" ON "Stock"("symbol");

-- CreateIndex
CREATE INDEX "Stock_sector_idx" ON "Stock"("sector");

-- CreateIndex
CREATE INDEX "StockPrice_stockId_timestamp_idx" ON "StockPrice"("stockId", "timestamp");

-- CreateIndex
CREATE INDEX "StockPrice_timestamp_idx" ON "StockPrice"("timestamp");

-- CreateIndex
CREATE INDEX "AIAnalysis_stockId_idx" ON "AIAnalysis"("stockId");

-- CreateIndex
CREATE INDEX "AIAnalysis_userId_idx" ON "AIAnalysis"("userId");

-- CreateIndex
CREATE INDEX "AIAnalysis_analysisType_idx" ON "AIAnalysis"("analysisType");

-- CreateIndex
CREATE INDEX "AIAnalysis_sentiment_idx" ON "AIAnalysis"("sentiment");

-- CreateIndex
CREATE INDEX "AIAnalysis_createdAt_idx" ON "AIAnalysis"("createdAt");

-- CreateIndex
CREATE INDEX "PriceAlert_userId_isActive_idx" ON "PriceAlert"("userId", "isActive");

-- CreateIndex
CREATE INDEX "PriceAlert_stockId_idx" ON "PriceAlert"("stockId");

-- CreateIndex
CREATE INDEX "NewsArticle_publishedAt_idx" ON "NewsArticle"("publishedAt");

-- CreateIndex
CREATE INDEX "NewsArticle_sentiment_idx" ON "NewsArticle"("sentiment");

-- CreateIndex
CREATE INDEX "NewsArticle_symbols_idx" ON "NewsArticle"("symbols");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_url_key" ON "NewsArticle"("url");

-- CreateIndex
CREATE UNIQUE INDEX "DigestPreference_userId_key" ON "DigestPreference"("userId");

-- CreateIndex
CREATE INDEX "DigestPreference_userId_idx" ON "DigestPreference"("userId");

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockPrice" ADD CONSTRAINT "StockPrice_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigestPreference" ADD CONSTRAINT "DigestPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
