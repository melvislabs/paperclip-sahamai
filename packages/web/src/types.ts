export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  updatedAt: string;
}

export interface SignalData {
  symbol: string;
  stale: boolean;
  status: 'fresh' | 'stale' | 'missing';
  signal?: {
    symbol: string;
    action: 'buy' | 'sell' | 'hold';
    confidence: number;
    generatedAt: string;
    expiresAt: string;
    version: string;
    reasonCodes: string[];
  };
}

export interface PortfolioHolding {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  sector: string;
}

export interface PortfolioSummary {
  totalValue: number;
  dayGainLoss: number;
  dayGainLossPercent: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdings: PortfolioHolding[];
  sectorAllocation: { sector: string; percentage: number; value: number }[];
}

export interface PricePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AIInsight {
  symbol: string;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sentiment: 'bullish' | 'neutral' | 'bearish';
  summary: string;
  keyPoints: string[];
  technicalIndicators?: {
    rsi: number;
    macd: { value: number; signal: number; histogram: number };
    bollingerBands: { upper: number; middle: number; lower: number };
    sma20: number;
    sma50: number;
    ema12: number;
    ema26: number;
  };
  generatedAt: string;
}

export interface AIAnalysisReport {
  symbol: string;
  analysisType: 'TECHNICAL' | 'FUNDAMENTAL' | 'SENTIMENT' | 'PORTFOLIO_RISK' | 'DAILY_DIGEST';
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  summary: string;
  keyPoints: string[];
  priceTarget?: number;
  technicalAnalysis?: {
    indicators: {
      rsi: number;
      macd: { macd: number; signal: number; histogram: number };
      sma: { sma20: number | null; sma50: number | null; sma200: number | null };
      ema: { ema12: number | null; ema26: number | null };
      bollingerBands: { upper: number | null; middle: number | null; lower: number | null };
      volume: { current: number; average: number; ratio: number };
    };
    signals: {
      rsi: { value: number; interpretation: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL' };
      macd: { value: number; interpretation: 'BULLISH_CROSSOVER' | 'BEARISH_CROSSOVER' | 'NEUTRAL' };
      trend: { shortTerm: 'UP' | 'DOWN' | 'NEUTRAL'; mediumTerm: 'UP' | 'DOWN' | 'NEUTRAL'; longTerm: 'UP' | 'DOWN' | 'NEUTRAL' };
      volatility: { interpretation: 'HIGH' | 'NORMAL' | 'LOW'; percentB: number | null };
    };
    summary: { bullishSignals: number; bearishSignals: number; neutralSignals: number; overallBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' };
  };
  llmAnalysis?: {
    summary: string;
    keyInsights: string[];
    risks: string[];
    catalysts: string[];
    priceTarget: { target: number; timeframe: string; confidence: number };
    reasoning: string;
  };
  sentimentFusion?: {
    compositeScore: number;
    recommendation: 'BUY' | 'HOLD' | 'SELL';
    confidence: number;
    breakdown: { technicalContribution: number; sentimentContribution: number };
  };
  metadata: {
    modelUsed?: string;
    dataPoints: number;
    processingTimeMs: number;
    version: string;
  };
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface MarketOverview {
  indices: MarketIndex[];
  topGainers: StockQuote[];
  topLosers: StockQuote[];
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
}

export interface OpsMetrics {
  generatedAt: string;
  http: {
    windowMinutes: number;
    requests: number;
    errors5xx: number;
    errorRate: number;
    avgLatencyMs: number;
  };
  freshness: {
    total: number;
    stale: number;
    staleRate: number;
    observedAt: string;
  } | null;
  delivery: {
    windowMinutes: number;
    channels: Array<{
      channel: string;
      attempts: number;
      successRate: number;
      p95LatencyMs: number;
    }>;
  };
  modelUsage: {
    windowMinutes: number;
    promptTokens: number;
    completionTokens: number;
    costUsd: number;
  };
}

export interface OpsAlert {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  runbook: string;
  triggeredAt: string;
}

export interface DashboardSLO {
  apiErrorRate: number;
  apiLatencyAvgMs: number;
  staleRate: number;
}

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y';
