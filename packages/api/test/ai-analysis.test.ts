import { describe, expect, it } from 'vitest';
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateTechnicalIndicators,
  analyzeTechnicals,
  calculateTechnicalScore,
  fuseSentiment
} from '@sahamai/shared';
import type { PriceDataPoint } from '@sahamai/shared';

function generatePriceData(
  days: number,
  startPrice: number,
  trend: 'up' | 'down' | 'flat' = 'flat'
): PriceDataPoint[] {
  const data: PriceDataPoint[] = [];
  let price = startPrice;
  const trendDelta = trend === 'up' ? 5 : trend === 'down' ? -5 : 0;

  for (let i = 0; i < days; i++) {
    const change = trendDelta + (Math.random() - 0.5) * 10;
    const open = price;
    price = Math.max(100, price + change);
    const high = Math.max(open, price) + Math.random() * 5;
    const low = Math.min(open, price) - Math.random() * 5;

    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString(),
      open,
      high,
      low,
      close: price,
      volume: 1000000 + Math.random() * 500000
    });
  }

  return data;
}

describe('Technical Indicators', () => {
  describe('calculateRSI', () => {
    it('returns 50 for insufficient data', () => {
      const closes = [100, 101, 102];
      expect(calculateRSI(closes)).toBe(50);
    });

    it('returns 100 when all gains', () => {
      const closes = Array.from({ length: 20 }, (_, i) => 100 + i * 2);
      const rsi = calculateRSI(closes);
      expect(rsi).toBeGreaterThan(90);
    });

    it('returns low value when all losses', () => {
      const closes = Array.from({ length: 20 }, (_, i) => 200 - i * 2);
      const rsi = calculateRSI(closes);
      expect(rsi).toBeLessThan(10);
    });

    it('returns value between 0 and 100', () => {
      const closes = generatePriceData(30, 1000).map(p => p.close);
      const rsi = calculateRSI(closes);
      expect(rsi).toBeGreaterThanOrEqual(0);
      expect(rsi).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateMACD', () => {
    it('returns macd, signal, and histogram', () => {
      const closes = generatePriceData(50, 1000).map(p => p.close);
      const result = calculateMACD(closes);
      expect(result).toHaveProperty('macd');
      expect(result).toHaveProperty('signal');
      expect(result).toHaveProperty('histogram');
      expect(result.histogram).toBe(result.macd - result.signal);
    });

    it('returns zeros for insufficient data', () => {
      const closes = [100, 101, 102];
      const result = calculateMACD(closes);
      expect(result.macd).toBe(0);
      expect(result.signal).toBe(0);
      expect(result.histogram).toBe(0);
    });
  });

  describe('calculateBollingerBands', () => {
    it('returns null for insufficient data', () => {
      const closes = [100, 101, 102];
      const result = calculateBollingerBands(closes);
      expect(result.upper).toBeNull();
      expect(result.middle).toBeNull();
      expect(result.lower).toBeNull();
    });

    it('returns valid bands for sufficient data', () => {
      const closes = generatePriceData(30, 1000).map(p => p.close);
      const result = calculateBollingerBands(closes);
      expect(result.upper).not.toBeNull();
      expect(result.middle).not.toBeNull();
      expect(result.lower).not.toBeNull();
      expect(result.upper!).toBeGreaterThan(result.middle!);
      expect(result.middle!).toBeGreaterThan(result.lower!);
    });
  });

  describe('calculateTechnicalIndicators', () => {
    it('throws for empty price history', () => {
      expect(() => calculateTechnicalIndicators([])).toThrow('Price history cannot be empty');
    });

    it('calculates all indicators for valid price data', () => {
      const priceHistory = generatePriceData(50, 1000);
      const indicators = calculateTechnicalIndicators(priceHistory);

      expect(indicators.rsi).toBeGreaterThanOrEqual(0);
      expect(indicators.rsi).toBeLessThanOrEqual(100);
      expect(indicators.macd).toHaveProperty('macd');
      expect(indicators.macd).toHaveProperty('signal');
      expect(indicators.macd).toHaveProperty('histogram');
      expect(indicators.sma).toHaveProperty('sma20');
      expect(indicators.sma).toHaveProperty('sma50');
      expect(indicators.sma).toHaveProperty('sma200');
      expect(indicators.ema).toHaveProperty('ema12');
      expect(indicators.ema).toHaveProperty('ema26');
      expect(indicators.bollingerBands).toHaveProperty('upper');
      expect(indicators.bollingerBands).toHaveProperty('middle');
      expect(indicators.bollingerBands).toHaveProperty('lower');
      expect(indicators.volume).toHaveProperty('current');
      expect(indicators.volume).toHaveProperty('average');
      expect(indicators.volume).toHaveProperty('ratio');
    });
  });

  describe('analyzeTechnicals', () => {
    it('identifies uptrend correctly', () => {
      const priceHistory = generatePriceData(210, 1000, 'up');
      const indicators = calculateTechnicalIndicators(priceHistory);
      const currentPrice = priceHistory[priceHistory.length - 1].close;
      const analysis = analyzeTechnicals(indicators, currentPrice);

      expect(analysis.signals.trend.shortTerm).toBe('UP');
      expect(analysis.signals.trend.mediumTerm).toBe('UP');
      expect(analysis.signals.trend.longTerm).toBe('UP');
    });

    it('identifies downtrend correctly', () => {
      const priceHistory = generatePriceData(210, 2000, 'down');
      const indicators = calculateTechnicalIndicators(priceHistory);
      const currentPrice = priceHistory[priceHistory.length - 1].close;
      const analysis = analyzeTechnicals(indicators, currentPrice);

      expect(analysis.signals.trend.shortTerm).toBe('DOWN');
      expect(analysis.signals.trend.mediumTerm).toBe('DOWN');
      expect(analysis.signals.trend.longTerm).toBe('DOWN');
    });

    it('returns summary with signal counts', () => {
      const priceHistory = generatePriceData(50, 1000);
      const indicators = calculateTechnicalIndicators(priceHistory);
      const currentPrice = priceHistory[priceHistory.length - 1].close;
      const analysis = analyzeTechnicals(indicators, currentPrice);

      expect(analysis.summary).toHaveProperty('bullishSignals');
      expect(analysis.summary).toHaveProperty('bearishSignals');
      expect(analysis.summary).toHaveProperty('neutralSignals');
      expect(analysis.summary).toHaveProperty('overallBias');
      expect(['BULLISH', 'BEARISH', 'NEUTRAL']).toContain(analysis.summary.overallBias);
    });
  });

  describe('calculateTechnicalScore', () => {
    it('returns score between -100 and 100', () => {
      const priceHistory = generatePriceData(50, 1000);
      const indicators = calculateTechnicalIndicators(priceHistory);
      const currentPrice = priceHistory[priceHistory.length - 1].close;
      const analysis = analyzeTechnicals(indicators, currentPrice);
      const score = calculateTechnicalScore(analysis);

      expect(score).toBeGreaterThanOrEqual(-100);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('gives higher score for uptrend', () => {
      const upCloses = Array.from({ length: 210 }, (_, i) => 1000 + i * 2);
      const upData: PriceDataPoint[] = upCloses.map((close, i) => ({
        date: new Date(Date.now() - (210 - i) * 24 * 60 * 60 * 1000).toISOString(),
        open: close - 1,
        high: close + 2,
        low: close - 2,
        close,
        volume: 1000000
      }));
      const upIndicators = calculateTechnicalIndicators(upData);
      const upAnalysis = analyzeTechnicals(upIndicators, upData[upData.length - 1].close);
      const upScore = calculateTechnicalScore(upAnalysis);

      const downCloses = Array.from({ length: 210 }, (_, i) => 2000 - i * 2);
      const downData: PriceDataPoint[] = downCloses.map((close, i) => ({
        date: new Date(Date.now() - (210 - i) * 24 * 60 * 60 * 1000).toISOString(),
        open: close + 1,
        high: close + 2,
        low: close - 2,
        close,
        volume: 1000000
      }));
      const downIndicators = calculateTechnicalIndicators(downData);
      const downAnalysis = analyzeTechnicals(downIndicators, downData[downData.length - 1].close);
      const downScore = calculateTechnicalScore(downAnalysis);

      expect(upScore).toBeGreaterThan(downScore);
    });
  });
});

describe('Sentiment Fusion', () => {
  it('returns BUY recommendation for strong positive signals', () => {
    const result = fuseSentiment({
      technicalScore: 80,
      sentimentScore: 0.7
    });

    expect(result.recommendation).toBe('BUY');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('returns SELL recommendation for strong negative signals', () => {
    const result = fuseSentiment({
      technicalScore: -80,
      sentimentScore: -0.7
    });

    expect(result.recommendation).toBe('SELL');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('returns HOLD recommendation for neutral signals', () => {
    const result = fuseSentiment({
      technicalScore: 10,
      sentimentScore: 0.1
    });

    expect(result.recommendation).toBe('HOLD');
  });

  it('respects custom weights', () => {
    const result = fuseSentiment({
      technicalScore: 50,
      sentimentScore: -0.5,
      technicalWeight: 0.8,
      sentimentWeight: 0.2
    });

    expect(result.breakdown.technicalContribution).toBeGreaterThan(
      result.breakdown.sentimentContribution
    );
  });

  it('clamps composite score to valid range', () => {
    const result = fuseSentiment({
      technicalScore: 100,
      sentimentScore: 1
    });

    expect(result.compositeScore).toBeLessThanOrEqual(1);
    expect(result.compositeScore).toBeGreaterThanOrEqual(-1);
  });
});
