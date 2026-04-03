import type { SentimentFusionInput, SentimentFusionResult, Recommendation } from './types.js';

export function fuseSentiment(input: SentimentFusionInput): SentimentFusionResult {
  const technicalWeight = input.technicalWeight ?? 0.6;
  const sentimentWeight = input.sentimentWeight ?? 0.4;

  const normalizedTechnical = Math.max(-100, Math.min(100, input.technicalScore)) / 100;
  const normalizedSentiment = Math.max(-1, Math.min(1, input.sentimentScore));

  const technicalContribution = normalizedTechnical * technicalWeight;
  const sentimentContribution = normalizedSentiment * sentimentWeight;

  const compositeScore = technicalContribution + sentimentContribution;

  const recommendation: Recommendation =
    compositeScore > 0.2 ? 'BUY' : compositeScore < -0.2 ? 'SELL' : 'HOLD';

  const confidence = Math.min(1, Math.abs(compositeScore) * 1.5 + 0.2);

  return {
    compositeScore: Math.round(compositeScore * 10000) / 10000,
    recommendation,
    confidence: Math.round(confidence * 100) / 100,
    breakdown: {
      technicalContribution: Math.round(technicalContribution * 10000) / 10000,
      sentimentContribution: Math.round(sentimentContribution * 10000) / 10000
    }
  };
}
