import { Type } from '@sinclair/typebox';

export const SymbolParamSchema = Type.Object({
  symbol: Type.String({ minLength: 1, maxLength: 10, pattern: '^[a-zA-Z0-9]+$' })
});

export const SymbolsQuerySchema = Type.Object({
  symbols: Type.Optional(Type.String())
});

export const PriceDataPointSchema = Type.Object({
  timestamp: Type.String(),
  open: Type.Number(),
  high: Type.Number(),
  low: Type.Number(),
  close: Type.Number(),
  volume: Type.Number()
});

export const NewsItemSchema = Type.Object({
  title: Type.String(),
  url: Type.String({ format: 'uri' }),
  source: Type.String(),
  publishedAt: Type.String(),
  symbols: Type.Array(Type.String()),
  summary: Type.Optional(Type.String())
});

export const AnalysisBodySchema = Type.Object({
  priceHistory: Type.Array(PriceDataPointSchema, { minItems: 1 }),
  news: Type.Optional(Type.Array(NewsItemSchema))
});

export const SearchQuerySchema = Type.Object({
  q: Type.String({ minLength: 1, maxLength: 100 })
});

export const HistoryQuerySchema = Type.Object({
  interval: Type.Optional(Type.String({ default: '1day' })),
  from: Type.Optional(Type.String({ format: 'date-time' })),
  to: Type.Optional(Type.String({ format: 'date-time' }))
});

export const RegisterBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8, maxLength: 128 }),
  role: Type.Optional(Type.Enum({ admin: 'admin', user: 'user', service: 'service' }))
});

export const LoginBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String()
});

export const RefreshBodySchema = Type.Object({
  refreshToken: Type.String({ minLength: 1 })
});

export const CreateApiKeyBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  role: Type.Optional(Type.Enum({ admin: 'admin', user: 'user', service: 'service' })),
  expiresAt: Type.Optional(Type.String({ format: 'date-time' }))
});

export const ErrorSchema = Type.Object({
  error: Type.String(),
  message: Type.String()
});

export const ValidationErrorSchema = Type.Object({
  statusCode: Type.Number(),
  code: Type.String(),
  error: Type.String(),
  message: Type.String()
});

export const SignalSchema = Type.Object({
  symbol: Type.String(),
  action: Type.Enum({ buy: 'buy', sell: 'sell', hold: 'hold' }),
  confidence: Type.Number(),
  generatedAt: Type.String(),
  expiresAt: Type.String(),
  version: Type.String(),
  reasonCodes: Type.Array(Type.String())
});

export const SignalWithFreshnessSchema = Type.Object({
  symbol: Type.String(),
  stale: Type.Boolean(),
  status: Type.Enum({ fresh: 'fresh', stale: 'stale', missing: 'missing' }),
  signal: Type.Optional(SignalSchema)
});

export const SignalListResponseSchema = Type.Object({
  count: Type.Number(),
  staleCount: Type.Number(),
  data: Type.Array(SignalWithFreshnessSchema)
});

export const SignalSummaryResponseSchema = Type.Object({
  stale: Type.Boolean(),
  status: Type.String(),
  total: Type.Number(),
  freshCount: Type.Number(),
  staleCount: Type.Number(),
  generatedAt: Type.String(),
  staleSymbols: Type.Array(Type.String())
});

export const HealthResponseSchema = Type.Object({
  status: Type.String(),
  service: Type.String(),
  now: Type.String()
});

export const TechnicalAnalysisResultSchema = Type.Object({
  rsi: Type.Optional(Type.Number()),
  macd: Type.Optional(Type.Object({
    macd: Type.Optional(Type.Number()),
    signal: Type.Optional(Type.Number()),
    histogram: Type.Optional(Type.Number())
  })),
  bollingerBands: Type.Optional(Type.Object({
    upper: Type.Optional(Type.Number()),
    middle: Type.Optional(Type.Number()),
    lower: Type.Optional(Type.Number())
  })),
  sma: Type.Optional(Type.Array(Type.Number())),
  ema: Type.Optional(Type.Array(Type.Number())),
  trend: Type.Optional(Type.String()),
  volatility: Type.Optional(Type.Number()),
  volumeAnalysis: Type.Optional(Type.Object({
    averageVolume: Type.Optional(Type.Number()),
    currentVolume: Type.Optional(Type.Number()),
    volumeRatio: Type.Optional(Type.Number())
  }))
});

export const LLMAnalysisResultSchema = Type.Object({
  reasoning: Type.String(),
  marketContext: Type.Optional(Type.String()),
  risks: Type.Optional(Type.Array(Type.String())),
  opportunities: Type.Optional(Type.Array(Type.String()))
});

export const SentimentFusionResultSchema = Type.Object({
  overallSentiment: Type.Optional(Type.String()),
  sentimentScore: Type.Optional(Type.Number()),
  newsImpact: Type.Optional(Type.String()),
  keyThemes: Type.Optional(Type.Array(Type.String()))
});

export const AIAnalysisResultSchema = Type.Object({
  symbol: Type.String(),
  analysisType: Type.Enum({
    TECHNICAL: 'TECHNICAL',
    FUNDAMENTAL: 'FUNDAMENTAL',
    SENTIMENT: 'SENTIMENT',
    PORTFOLIO_RISK: 'PORTFOLIO_RISK',
    DAILY_DIGEST: 'DAILY_DIGEST'
  }),
  recommendation: Type.Enum({ BUY: 'BUY', HOLD: 'HOLD', SELL: 'SELL' }),
  confidence: Type.Number(),
  riskLevel: Type.Enum({ LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', CRITICAL: 'CRITICAL' }),
  technicalAnalysis: Type.Optional(TechnicalAnalysisResultSchema),
  llmAnalysis: Type.Optional(LLMAnalysisResultSchema),
  sentimentFusion: Type.Optional(SentimentFusionResultSchema),
  summary: Type.String(),
  keyPoints: Type.Array(Type.String()),
  metadata: Type.Object({
    modelUsed: Type.Optional(Type.String()),
    dataPoints: Type.Number(),
    processingTimeMs: Type.Number(),
    version: Type.String()
  })
});

export const QuoteResponseSchema = Type.Object({
  symbol: Type.String(),
  price: Type.Number(),
  change: Type.Optional(Type.Number()),
  changePercent: Type.Optional(Type.Number()),
  volume: Type.Optional(Type.Number()),
  timestamp: Type.String()
});

export const HistoryResponseSchema = Type.Object({
  symbol: Type.String(),
  interval: Type.String(),
  data: Type.Array(PriceDataPointSchema)
});

export const NewsResponseSchema = Type.Array(NewsItemSchema);

export const SearchResponseSchema = Type.Array(Type.Object({
  symbol: Type.String(),
  name: Type.String(),
  exchange: Type.Optional(Type.String())
}));

export const MetricsResponseSchema = Type.Object({
  generatedAt: Type.String(),
  http: Type.Object({
    windowMinutes: Type.Number(),
    requests: Type.Number(),
    errors5xx: Type.Number(),
    errorRate: Type.Number(),
    avgLatencyMs: Type.Number()
  }),
  freshness: Type.Union([
    Type.Null(),
    Type.Object({
      total: Type.Number(),
      stale: Type.Number(),
      staleRate: Type.Number(),
      observedAt: Type.String()
    })
  ]),
  delivery: Type.Object({
    windowMinutes: Type.Number(),
    channels: Type.Array(Type.Object({
      channel: Type.String(),
      attempts: Type.Number(),
      successRate: Type.Number(),
      p95LatencyMs: Type.Number()
    }))
  }),
  modelUsage: Type.Object({
    windowMinutes: Type.Number(),
    promptTokens: Type.Number(),
    completionTokens: Type.Number(),
    costUsd: Type.Number()
  })
});

export const AlertSchema = Type.Object({
  code: Type.String(),
  severity: Type.Enum({ info: 'info', warning: 'warning', critical: 'critical' }),
  message: Type.String(),
  runbook: Type.String(),
  triggeredAt: Type.String()
});

export const AlertsResponseSchema = Type.Object({
  generatedAt: Type.String(),
  count: Type.Number(),
  alerts: Type.Array(AlertSchema)
});

export const SLODashboardResponseSchema = Type.Object({
  generatedAt: Type.String(),
  slo: Type.Object({
    apiErrorRate: Type.Number(),
    apiLatencyAvgMs: Type.Number(),
    staleRate: Type.Number()
  }),
  channels: Type.Array(Type.Object({
    channel: Type.String(),
    attempts: Type.Number(),
    successRate: Type.Number(),
    p95LatencyMs: Type.Number()
  })),
  costs: Type.Object({
    windowMinutes: Type.Number(),
    promptTokens: Type.Number(),
    completionTokens: Type.Number(),
    costUsd: Type.Number()
  })
});

export const AuthResponseSchema = Type.Object({
  user: Type.Object({
    id: Type.String(),
    email: Type.String(),
    role: Type.String()
  }),
  token: Type.String(),
  refreshToken: Type.String()
});

export const ApiKeyResponseSchema = Type.Object({
  apiKey: Type.Object({
    id: Type.String(),
    keyHash: Type.String(),
    userId: Type.String(),
    name: Type.String(),
    role: Type.String(),
    createdAt: Type.String(),
    expiresAt: Type.Optional(Type.String())
  }),
  rawKey: Type.String()
});

export const PriceAlertSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  symbol: Type.String(),
  condition: Type.Enum({ ABOVE: 'ABOVE', BELOW: 'BELOW', PERCENT_CHANGE: 'PERCENT_CHANGE' }),
  targetPrice: Type.Number(),
  isActive: Type.Boolean(),
  alertType: Type.Enum({ ONE_TIME: 'ONE_TIME', RECURRING: 'RECURRING', EXPIRING: 'EXPIRING' }),
  expiresAt: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  triggeredAt: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  notificationChannels: Type.Array(Type.String()),
  cooldownUntil: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  createdAt: Type.String(),
  updatedAt: Type.String()
});

export const CreateAlertBodySchema = Type.Object({
  symbol: Type.String({ minLength: 1, maxLength: 10, pattern: '^[a-zA-Z0-9]+$' }),
  condition: Type.Enum({ ABOVE: 'ABOVE', BELOW: 'BELOW', PERCENT_CHANGE: 'PERCENT_CHANGE' }),
  targetPrice: Type.Number(),
  alertType: Type.Optional(Type.Enum({ ONE_TIME: 'ONE_TIME', RECURRING: 'RECURRING', EXPIRING: 'EXPIRING' })),
  expiresAt: Type.Optional(Type.String({ format: 'date-time' })),
  notificationChannels: Type.Optional(Type.Array(Type.Enum({ in_app: 'in_app', email: 'email', push: 'push' })))
});

export const UpdateAlertBodySchema = Type.Object({
  targetPrice: Type.Optional(Type.Number()),
  isActive: Type.Optional(Type.Boolean()),
  notificationChannels: Type.Optional(Type.Array(Type.Enum({ in_app: 'in_app', email: 'email', push: 'push' }))),
  expiresAt: Type.Optional(Type.String({ format: 'date-time' }))
});

export const AlertListResponseSchema = Type.Object({
  count: Type.Number(),
  data: Type.Array(PriceAlertSchema)
});

export const AlertHistoryResponseSchema = Type.Object({
  count: Type.Number(),
  data: Type.Array(PriceAlertSchema)
});

export const UserProfileSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  name: Type.Optional(Type.String()),
  role: Type.String(),
  avatarUrl: Type.Optional(Type.String()),
  createdAt: Type.String(),
  updatedAt: Type.String()
});

export const UpdateProfileBodySchema = Type.Object({
  name: Type.Optional(Type.String({ maxLength: 100 })),
  avatarUrl: Type.Optional(Type.String({ format: 'uri', maxLength: 500 }))
});

export const PortfolioSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  totalValue: Type.Number(),
  cashBalance: Type.Number(),
  riskScore: Type.Optional(Type.Number()),
  createdAt: Type.String(),
  updatedAt: Type.String()
});

export const HoldingSchema = Type.Object({
  id: Type.String(),
  portfolioId: Type.String(),
  symbol: Type.String(),
  quantity: Type.Number(),
  avgCostPrice: Type.Number(),
  createdAt: Type.String(),
  updatedAt: Type.String()
});

export const PortfolioWithHoldingsSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  totalValue: Type.Number(),
  cashBalance: Type.Number(),
  riskScore: Type.Optional(Type.Number()),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  holdings: Type.Array(HoldingSchema)
});

export const CreatePortfolioBodySchema = Type.Object({
  name: Type.Optional(Type.String({ maxLength: 100 })),
  cashBalance: Type.Optional(Type.Number({ minimum: 0 }))
});

export const UpdatePortfolioBodySchema = Type.Object({
  cashBalance: Type.Optional(Type.Number()),
  riskScore: Type.Optional(Type.Number())
});

export const AddHoldingBodySchema = Type.Object({
  symbol: Type.String({ minLength: 1, maxLength: 10, pattern: '^[a-zA-Z0-9]+$' }),
  quantity: Type.Number({ minimum: 1 }),
  avgCostPrice: Type.Number({ minimum: 0 })
});

export const PortfolioListResponseSchema = Type.Object({
  count: Type.Number(),
  data: Type.Array(PortfolioSchema)
});
