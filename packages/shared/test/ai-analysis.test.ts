import { AIAnalysisService, MockLLMProvider } from '../src/index.js';
import { test, describe, expect, beforeEach } from 'vitest';

describe('AI Analysis Service', () => {
  let analysisService: AIAnalysisService;
  let mockLLMProvider: MockLLMProvider;

  beforeEach(() => {
    mockLLMProvider = new MockLLMProvider();
    analysisService = new AIAnalysisService({
      llmProvider: mockLLMProvider,
      now: () => Date.now()
    });
  });

  describe('Technical Analysis', () => {
    test('should analyze basic price history', async () => {
      const priceHistory = [
        { date: '2024-01-01', open: 1000, high: 1050, low: 980, close: 1020, volume: 1000000 },
        { date: '2024-01-02', open: 1020, high: 1080, low: 1010, close: 1070, volume: 1200000 },
        { date: '2024-01-03', open: 1070, high: 1100, low: 1050, close: 1080, volume: 900000 }
      ];

      const result = await analysisService.analyze('BBCA', priceHistory, []);

      expect(result).toHaveProperty('symbol', 'BBCA');
      expect(result).toHaveProperty('recommendation');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('technicalAnalysis');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('keyPoints');
      expect(result).toHaveProperty('metadata');
      
      expect(['BUY', 'HOLD', 'SELL']).toContain(result.recommendation);
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should handle insufficient data', async () => {
      const priceHistory = [
        { date: '2024-01-01', open: 1000, high: 1050, low: 980, close: 1020, volume: 1000000 }
      ];

      const result = await analysisService.analyze('BBCA', priceHistory, []);

      expect(result).toHaveProperty('recommendation');
      expect(result).toHaveProperty('confidence');
      // Should still return a result even with minimal data
    });

    test('should calculate technical indicators correctly', async () => {
      const priceHistory = [
        { date: '2024-01-01', open: 1000, high: 1050, low: 980, close: 1020, volume: 1000000 },
        { date: '2024-01-02', open: 1020, high: 1080, low: 1010, close: 1070, volume: 1200000 },
        { date: '2024-01-03', open: 1070, high: 1100, low: 1050, close: 1080, volume: 900000 },
        { date: '2024-01-04', open: 1080, high: 1120, low: 1070, close: 1110, volume: 1100000 },
        { date: '2024-01-05', open: 1110, high: 1150, low: 1100, close: 1130, volume: 1300000 }
      ];

      const result = await analysisService.analyze('BBCA', priceHistory, []);

      if (result.technicalAnalysis) {
        expect(result.technicalAnalysis).toHaveProperty('rsi');
        expect(result.technicalAnalysis).toHaveProperty('macd');
        expect(result.technicalAnalysis).toHaveProperty('bollingerBands');
        expect(result.technicalAnalysis).toHaveProperty('sma');
        expect(result.technicalAnalysis).toHaveProperty('ema');
      }
    });
  });

  describe('Sentiment Analysis', () => {
    test('should analyze news sentiment', async () => {
      const priceHistory = [
        { date: '2024-01-01', open: 1000, high: 1050, low: 980, close: 1020, volume: 1000000 }
      ];

      const news = [
        { headline: 'BBCA reports strong earnings', sentiment: 'BULLISH' as const, score: 0.8, publishedAt: '2024-01-01', source: 'Reuters' },
        { headline: 'Market concerns about banking sector', sentiment: 'BEARISH' as const, score: -0.6, publishedAt: '2024-01-01', source: 'Bloomberg' }
      ];

      const result = await analysisService.analyze('BBCA', priceHistory, news);

      expect(result).toHaveProperty('sentimentFusion');
      if (result.sentimentFusion) {
        expect(result.sentimentFusion).toHaveProperty('overallSentiment');
        expect(result.sentimentFusion).toHaveProperty('newsCount');
        expect(result.sentimentFusion).toHaveProperty('sentimentScore');
      }
    });

    test('should handle empty news array', async () => {
      const priceHistory = [
        { date: '2024-01-01', open: 1000, high: 1050, low: 980, close: 1020, volume: 1000000 }
      ];

      const result = await analysisService.analyze('BBCA', priceHistory, []);

      expect(result).toHaveProperty('symbol', 'BBCA');
      // Should work fine without news
    });
  });

  describe('Risk Assessment', () => {
    test('should assess risk levels', async () => {
      const priceHistory = [
        { date: '2024-01-01', open: 1000, high: 1050, low: 980, close: 1020, volume: 1000000 },
        { date: '2024-01-02', open: 1020, high: 1080, low: 1010, close: 1070, volume: 1200000 },
        { date: '2024-01-03', open: 1070, high: 1100, low: 1050, close: 1080, volume: 900000 }
      ];

      const result = await analysisService.analyze('BBCA', priceHistory, []);

      expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(result.riskLevel);
    });

    test('should calculate volatility for risk assessment', async () => {
      // Create price history with high volatility
      const priceHistory = [
        { timestamp: '2024-01-01', open: 1000, high: 1200, low: 800, close: 1100, volume: 1000000 },
        { timestamp: '2024-01-02', open: 1100, high: 1300, low: 900, close: 1200, volume: 1200000 },
        { timestamp: '2024-01-03', open: 1200, high: 1400, low: 1000, close: 1050, volume: 900000 }
      ];

      const result = await analysisService.analyze('BBCA', priceHistory, []);

      expect(result).toHaveProperty('riskLevel');
      // High volatility should result in higher risk
    });
  });

  describe('Mock LLM Provider', () => {
    test('should generate analysis with mock provider', async () => {
      const priceHistory = [
        { date: '2024-01-01', open: 1000, high: 1050, low: 980, close: 1020, volume: 1000000 }
      ];

      const result = await analysisService.analyze('BBCA', priceHistory, []);

      expect(result.metadata).toHaveProperty('modelUsed');
      expect(result.metadata).toHaveProperty('dataPoints');
      expect(result.metadata).toHaveProperty('processingTimeMs');
      expect(result.metadata).toHaveProperty('version');
    });

    test('should provide consistent results with same input', async () => {
      const priceHistory = [
        { date: '2024-01-01', open: 1000, high: 1050, low: 980, close: 1020, volume: 1000000 }
      ];

      const result1 = await analysisService.analyze('BBCA', priceHistory, []);
      const result2 = await analysisService.analyze('BBCA', priceHistory, []);

      expect(result1.symbol).toBe(result2.symbol);
      expect(result1.recommendation).toBe(result2.recommendation);
      expect(result1.riskLevel).toBe(result2.riskLevel);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed price data', async () => {
      const malformedPriceHistory = [
        { date: 'invalid-date', open: 'invalid' as any, high: null as any, low: undefined as any, close: 1020, volume: -1000 }
      ];

      const result = await analysisService.analyze('BBCA', malformedPriceHistory, []);

      // Should still return a result, possibly with default values
      expect(result).toHaveProperty('symbol');
      expect(result).toHaveProperty('recommendation');
    });

    test('should handle null inputs gracefully', async () => {
      const result = await analysisService.analyze('BBCA', [], null as any);

      expect(result).toHaveProperty('symbol');
      expect(result).toHaveProperty('recommendation');
    });
  });
});
