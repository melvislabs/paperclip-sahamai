export type AnalysisType = 'TECHNICAL' | 'FUNDAMENTAL' | 'SENTIMENT' | 'PORTFOLIO_RISK' | 'DAILY_DIGEST';

export type Sentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type Recommendation = 'BUY' | 'HOLD' | 'SELL';

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  sma: {
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
  };
  ema: {
    ema12: number | null;
    ema26: number | null;
  };
  bollingerBands: {
    upper: number | null;
    middle: number | null;
    lower: number | null;
  };
  volume: {
    current: number;
    average: number;
    ratio: number;
  };
}

export interface TechnicalAnalysisResult {
  indicators: TechnicalIndicators;
  signals: {
    rsi: {
      value: number;
      interpretation: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
    };
    macd: {
      value: number;
      interpretation: 'BULLISH_CROSSOVER' | 'BEARISH_CROSSOVER' | 'NEUTRAL';
    };
    trend: {
      shortTerm: 'UP' | 'DOWN' | 'NEUTRAL';
      mediumTerm: 'UP' | 'DOWN' | 'NEUTRAL';
      longTerm: 'UP' | 'DOWN' | 'NEUTRAL';
    };
    volatility: {
      interpretation: 'HIGH' | 'NORMAL' | 'LOW';
      percentB: number | null;
    };
  };
  summary: {
    bullishSignals: number;
    bearishSignals: number;
    neutralSignals: number;
    overallBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
}

export interface LLMAnalysisRequest {
  symbol: string;
  technicalAnalysis: TechnicalAnalysisResult;
  sentimentScore: number;
  recentNews: Array<{
    headline: string;
    sentiment: Sentiment;
    score: number;
    publishedAt: string;
  }>;
  priceHistory: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

export interface LLMAnalysisResult {
  summary: string;
  keyInsights: string[];
  risks: string[];
  catalysts: string[];
  priceTarget: {
    target: number;
    timeframe: string;
    confidence: number;
  };
  reasoning: string;
}

export interface SentimentFusionInput {
  technicalScore: number;
  sentimentScore: number;
  technicalWeight?: number;
  sentimentWeight?: number;
}

export interface SentimentFusionResult {
  compositeScore: number;
  recommendation: Recommendation;
  confidence: number;
  breakdown: {
    technicalContribution: number;
    sentimentContribution: number;
  };
}

export interface AIAnalysisResult {
  symbol: string;
  analysisType: AnalysisType;
  timestamp: string;
  technicalAnalysis?: TechnicalAnalysisResult;
  llmAnalysis?: LLMAnalysisResult;
  sentimentFusion?: SentimentFusionResult;
  recommendation: Recommendation;
  confidence: number;
  riskLevel: RiskLevel;
  priceTarget?: number;
  summary: string;
  keyPoints: string[];
  metadata: {
    modelUsed?: string;
    dataPoints: number;
    processingTimeMs: number;
    version: string;
  };
}

export interface PriceDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  headline: string;
  sentiment: Sentiment;
  score: number;
  publishedAt: string;
  source?: string;
}
