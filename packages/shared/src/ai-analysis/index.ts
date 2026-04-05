import type {
  AIAnalysisResult,
  PriceDataPoint,
  NewsItem,
  LLMAnalysisRequest,
  SentimentFusionInput
} from './types.js';
import {
  calculateTechnicalIndicators,
  analyzeTechnicals,
  calculateTechnicalScore
} from './technical.js';
import type { LLMProvider } from './llm-analyzer.js';
import { fuseSentiment } from './sentiment-fusion.js';
import { createLLMProvider, getProviderInfo } from './llm-provider-factory.js';

export interface AIAnalysisServiceOptions {
  llmProvider?: LLMProvider;
  now?: () => number;
}

export class AIAnalysisService {
  private readonly llmProvider: LLMProvider;
  private readonly now: () => number;

  constructor(options: AIAnalysisServiceOptions = {}) {
    this.llmProvider = options.llmProvider ?? createLLMProvider();
    this.now = options.now ?? (() => Date.now());
  }

  async analyze(
    symbol: string,
    priceHistory: PriceDataPoint[],
    news: NewsItem[] = []
  ): Promise<AIAnalysisResult> {
    const startTime = this.now();

    if (priceHistory.length === 0) {
      throw new Error('Price history cannot be empty');
    }

    const indicators = calculateTechnicalIndicators(priceHistory);
    const currentPrice = priceHistory[priceHistory.length - 1].close;
    const technicalAnalysis = analyzeTechnicals(indicators, currentPrice);
    const technicalScore = calculateTechnicalScore(technicalAnalysis);

    const sentimentScore = this.calculateSentimentScore(news);

    let llmAnalysis: AIAnalysisResult['llmAnalysis'];
    try {
      const llmRequest: LLMAnalysisRequest = {
        symbol,
        technicalAnalysis,
        sentimentScore,
        recentNews: news.map(n => ({
          headline: n.headline,
          sentiment: n.sentiment,
          score: n.score,
          publishedAt: n.publishedAt
        })),
        priceHistory: priceHistory.slice(-30).map(p => ({
          date: p.date,
          open: p.open,
          high: p.high,
          low: p.low,
          close: p.close,
          volume: p.volume
        }))
      };
      llmAnalysis = await this.llmProvider.analyze(llmRequest);
    } catch (error) {
      llmAnalysis = undefined;
    }

    const fusionInput: SentimentFusionInput = {
      technicalScore,
      sentimentScore
    };
    const sentimentFusion = fuseSentiment(fusionInput);

    const processingTimeMs = this.now() - startTime;

    const summary = llmAnalysis?.summary ??
      `Technical analysis for ${symbol} shows ${technicalAnalysis.summary.overallBias.toLowerCase()} bias with ${technicalAnalysis.summary.bullishSignals} bullish and ${technicalAnalysis.summary.bearishSignals} bearish signals.`;

    const keyPoints = llmAnalysis?.keyInsights ?? [
      `RSI: ${technicalAnalysis.signals.rsi.value.toFixed(1)} (${technicalAnalysis.signals.rsi.interpretation})`,
      `MACD: ${technicalAnalysis.signals.macd.interpretation.toLowerCase().replace('_', ' ')}`,
      `Trend: ${technicalAnalysis.signals.trend.shortTerm.toLowerCase()} short-term, ${technicalAnalysis.signals.trend.mediumTerm.toLowerCase()} medium-term`
    ];

    const riskLevel = sentimentFusion.confidence > 0.7
      ? 'LOW'
      : sentimentFusion.confidence > 0.4
        ? 'MEDIUM'
        : sentimentFusion.confidence > 0.2
          ? 'HIGH'
          : 'CRITICAL';

    return {
      symbol,
      analysisType: 'TECHNICAL',
      timestamp: new Date(this.now()).toISOString(),
      technicalAnalysis,
      llmAnalysis,
      sentimentFusion,
      recommendation: sentimentFusion.recommendation,
      confidence: sentimentFusion.confidence,
      riskLevel,
      priceTarget: llmAnalysis?.priceTarget.target,
      summary,
      keyPoints,
      metadata: {
        modelUsed: getProviderInfo().primaryProvider,
        dataPoints: priceHistory.length,
        processingTimeMs,
        version: 'ai-analysis-v1'
      }
    };
  }

  private calculateSentimentScore(news: NewsItem[]): number {
    if (news.length === 0) return 0;

    const now = this.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const weightedScores = news.map(item => {
      const age = now - new Date(item.publishedAt).getTime();
      const recencyWeight = Math.max(0.1, 1 - age / (7 * oneDayMs));
      return item.score * recencyWeight;
    });

    const totalWeight = news.reduce((sum, item) => {
      const age = now - new Date(item.publishedAt).getTime();
      return sum + Math.max(0.1, 1 - age / (7 * oneDayMs));
    }, 0);

    return totalWeight > 0
      ? weightedScores.reduce((a, b) => a + b, 0) / totalWeight
      : 0;
  }
}
