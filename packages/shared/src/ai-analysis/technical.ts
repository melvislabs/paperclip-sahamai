import type {
  PriceDataPoint,
  TechnicalIndicators,
  TechnicalAnalysisResult
} from './types.js';

function calculateSMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((sum, val) => sum + val, 0) / period;
}

function calculateEMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
  }
  return ema;
}

export function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;

  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  const gains = changes.map((c) => (c > 0 ? c : 0));
  const losses = changes.map((c) => (c < 0 ? -c : 0));

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macd: number; signal: number; histogram: number } {
  const emaFast = calculateEMA(closes, fastPeriod) ?? 0;
  const emaSlow = calculateEMA(closes, slowPeriod) ?? 0;
  const macdLine = emaFast - emaSlow;

  const macdValues: number[] = [];
  for (let i = slowPeriod; i <= closes.length; i++) {
    const slice = closes.slice(0, i);
    const fast = calculateEMA(slice, fastPeriod) ?? 0;
    const slow = calculateEMA(slice, slowPeriod) ?? 0;
    macdValues.push(fast - slow);
  }

  const signalLine =
    macdValues.length >= signalPeriod
      ? calculateEMA(macdValues, signalPeriod) ?? 0
      : 0;

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: macdLine - signalLine
  };
}

export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2
): { upper: number | null; middle: number | null; lower: number | null } {
  if (closes.length < period) {
    return { upper: null, middle: null, lower: null };
  }

  const slice = closes.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;

  const squaredDiffs = slice.map((price) => Math.pow(price - middle, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: middle + stdDevMultiplier * stdDev,
    middle,
    lower: middle - stdDevMultiplier * stdDev
  };
}

export function calculateTechnicalIndicators(
  priceHistory: PriceDataPoint[]
): TechnicalIndicators {
  if (priceHistory.length === 0) {
    throw new Error('Price history cannot be empty');
  }

  const closes = priceHistory.map((p) => p.close);
  const volumes = priceHistory.map((p) => p.volume);

  const currentVolume = volumes[volumes.length - 1];
  const avgVolume =
    volumes.length >= 20
      ? volumes.slice(-20).reduce((a, b) => a + b, 0) / 20
      : volumes.reduce((a, b) => a + b, 0) / volumes.length;

  return {
    rsi: calculateRSI(closes),
    macd: calculateMACD(closes),
    sma: {
      sma20: calculateSMA(closes, 20),
      sma50: calculateSMA(closes, 50),
      sma200: calculateSMA(closes, 200)
    },
    ema: {
      ema12: calculateEMA(closes, 12),
      ema26: calculateEMA(closes, 26)
    },
    bollingerBands: calculateBollingerBands(closes),
    volume: {
      current: currentVolume,
      average: avgVolume,
      ratio: avgVolume > 0 ? currentVolume / avgVolume : 1
    }
  };
}

export function analyzeTechnicals(
  indicators: TechnicalIndicators,
  currentPrice: number
): TechnicalAnalysisResult {
  const rsiValue = indicators.rsi;
  const rsiInterpretation =
    rsiValue > 70 ? 'OVERBOUGHT' : rsiValue < 30 ? 'OVERSOLD' : 'NEUTRAL';

  const macdInterpretation =
    indicators.macd.histogram > 0 ? 'BULLISH_CROSSOVER' : 'BEARISH_CROSSOVER';

  const shortTermTrend =
    indicators.sma.sma20 !== null
      ? currentPrice > indicators.sma.sma20
        ? 'UP'
        : 'DOWN'
      : 'NEUTRAL';

  const mediumTermTrend =
    indicators.sma.sma50 !== null
      ? currentPrice > indicators.sma.sma50
        ? 'UP'
        : 'DOWN'
      : 'NEUTRAL';

  const longTermTrend =
    indicators.sma.sma200 !== null
      ? currentPrice > indicators.sma.sma200
        ? 'UP'
        : 'DOWN'
      : 'NEUTRAL';

  let volatilityInterpretation: 'HIGH' | 'NORMAL' | 'LOW' = 'NORMAL';
  let percentB: number | null = null;
  if (
    indicators.bollingerBands.upper !== null &&
    indicators.bollingerBands.lower !== null
  ) {
    const bandwidth =
      (indicators.bollingerBands.upper - indicators.bollingerBands.lower) /
      (indicators.bollingerBands.middle ?? currentPrice);
    volatilityInterpretation = bandwidth > 0.1 ? 'HIGH' : bandwidth < 0.04 ? 'LOW' : 'NORMAL';
    percentB =
      (currentPrice - indicators.bollingerBands.lower) /
      (indicators.bollingerBands.upper - indicators.bollingerBands.lower);
  }

  const bullishSignals: number = [
    rsiInterpretation === 'OVERSOLD',
    macdInterpretation === 'BULLISH_CROSSOVER',
    shortTermTrend === 'UP',
    mediumTermTrend === 'UP',
    longTermTrend === 'UP',
    indicators.volume.ratio > 1.2,
    (percentB !== null && percentB < 0.2)
  ].filter(Boolean).length;

  const bearishSignals: number = [
    rsiInterpretation === 'OVERBOUGHT',
    macdInterpretation === 'BEARISH_CROSSOVER',
    shortTermTrend === 'DOWN',
    mediumTermTrend === 'DOWN',
    longTermTrend === 'DOWN',
    indicators.volume.ratio > 1.2 && currentPrice < (indicators.sma.sma20 ?? currentPrice),
    (percentB !== null && percentB > 0.8)
  ].filter(Boolean).length;

  const totalSignals = 7;
  const neutralSignals = totalSignals - bullishSignals - bearishSignals;

  const overallBias =
    bullishSignals > bearishSignals
      ? 'BULLISH'
      : bearishSignals > bullishSignals
        ? 'BEARISH'
        : 'NEUTRAL';

  return {
    indicators,
    signals: {
      rsi: {
        value: rsiValue,
        interpretation: rsiInterpretation
      },
      macd: {
        value: indicators.macd.histogram,
        interpretation: macdInterpretation
      },
      trend: {
        shortTerm: shortTermTrend,
        mediumTerm: mediumTermTrend,
        longTerm: longTermTrend
      },
      volatility: {
        interpretation: volatilityInterpretation,
        percentB
      }
    },
    summary: {
      bullishSignals,
      bearishSignals,
      neutralSignals,
      overallBias
    }
  };
}

export function calculateTechnicalScore(analysis: TechnicalAnalysisResult): number {
  const { signals, summary } = analysis;

  let score = 0;

  if (signals.rsi.interpretation === 'OVERSOLD') score += 15;
  else if (signals.rsi.interpretation === 'OVERBOUGHT') score -= 15;
  else score += 5;

  if (signals.macd.interpretation === 'BULLISH_CROSSOVER') score += 20;
  else if (signals.macd.interpretation === 'BEARISH_CROSSOVER') score -= 20;

  const trendScores = { UP: 10, DOWN: -10, NEUTRAL: 0 };
  score += trendScores[signals.trend.shortTerm] ?? 0;
  score += trendScores[signals.trend.mediumTerm] ?? 0;
  score += trendScores[signals.trend.longTerm] ?? 0;

  if (signals.volatility.interpretation === 'LOW') score += 5;
  else if (signals.volatility.interpretation === 'HIGH') score -= 5;

  if (signals.volatility.percentB !== null) {
    if (signals.volatility.percentB < 0.2) score += 10;
    else if (signals.volatility.percentB > 0.8) score -= 10;
  }

  return Math.max(-100, Math.min(100, score));
}
