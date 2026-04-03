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
