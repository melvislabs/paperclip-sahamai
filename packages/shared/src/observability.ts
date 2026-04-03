import type { DeliveryChannel } from './fanout.js';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface OperationalAlert {
  code: string;
  severity: AlertSeverity;
  message: string;
  runbook: string;
  triggeredAt: string;
}

interface HttpMetric {
  route: string;
  statusCode: number;
  latencyMs: number;
  timestamp: number;
}

interface DeliveryMetric {
  channel: DeliveryChannel;
  status: 'delivered' | 'dead_lettered';
  latencyMs: number;
  timestamp: number;
}

interface FreshnessSnapshot {
  total: number;
  stale: number;
  timestamp: number;
}

interface ModelUsageMetric {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  timestamp: number;
}

function windowed<T extends { timestamp: number }>(items: T[], nowMs: number, windowMs: number): T[] {
  const start = nowMs - windowMs;
  return items.filter((item) => item.timestamp >= start);
}

export class ObservabilityHub {
  private readonly http: HttpMetric[] = [];

  private readonly delivery: DeliveryMetric[] = [];

  private readonly freshness: FreshnessSnapshot[] = [];

  private readonly modelUsage: ModelUsageMetric[] = [];

  constructor(
    private readonly now: () => number = () => Date.now(),
    private readonly costSpikeThresholdUsd = Number(process.env.API_COST_SPIKE_THRESHOLD_USD ?? 5)
  ) {}

  recordHttpRequest(route: string, statusCode: number, latencyMs: number): void {
    this.http.push({
      route,
      statusCode,
      latencyMs,
      timestamp: this.now()
    });
  }

  recordSignalFreshness(total: number, stale: number): void {
    this.freshness.push({
      total,
      stale,
      timestamp: this.now()
    });
  }

  recordDelivery(channel: DeliveryChannel, status: 'delivered' | 'dead_lettered', latencyMs: number): void {
    this.delivery.push({
      channel,
      status,
      latencyMs,
      timestamp: this.now()
    });
  }

  recordModelUsage(
    provider: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
    costUsd: number
  ): void {
    this.modelUsage.push({
      provider,
      model,
      promptTokens,
      completionTokens,
      costUsd,
      timestamp: this.now()
    });
  }

  getMetrics() {
    const now = this.now();
    const http5m = windowed(this.http, now, 5 * 60_000);
    const delivery15m = windowed(this.delivery, now, 15 * 60_000);
    const cost1h = windowed(this.modelUsage, now, 60 * 60_000);
    const latestFreshness = this.freshness[this.freshness.length - 1] ?? null;

    const errorCount = http5m.filter((item) => item.statusCode >= 500).length;
    const avgLatencyMs =
      http5m.length === 0 ? 0 : http5m.reduce((sum, item) => sum + item.latencyMs, 0) / http5m.length;

    const byChannel = new Map<DeliveryChannel, { total: number; ok: number; p95Candidates: number[] }>();
    for (const metric of delivery15m) {
      const current = byChannel.get(metric.channel) ?? { total: 0, ok: 0, p95Candidates: [] };
      current.total += 1;
      if (metric.status === 'delivered') {
        current.ok += 1;
      }
      current.p95Candidates.push(metric.latencyMs);
      byChannel.set(metric.channel, current);
    }

    const channels = [...byChannel.entries()].map(([channel, item]) => {
      const sorted = [...item.p95Candidates].sort((a, b) => a - b);
      const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
      const p95LatencyMs = sorted[index] ?? 0;
      return {
        channel,
        attempts: item.total,
        successRate: item.total === 0 ? 1 : item.ok / item.total,
        p95LatencyMs
      };
    });

    const tokenTotals = cost1h.reduce(
      (acc, item) => {
        acc.promptTokens += item.promptTokens;
        acc.completionTokens += item.completionTokens;
        acc.costUsd += item.costUsd;
        return acc;
      },
      { promptTokens: 0, completionTokens: 0, costUsd: 0 }
    );

    return {
      generatedAt: new Date(now).toISOString(),
      http: {
        windowMinutes: 5,
        requests: http5m.length,
        errors5xx: errorCount,
        errorRate: http5m.length === 0 ? 0 : errorCount / http5m.length,
        avgLatencyMs
      },
      freshness: latestFreshness
        ? {
            total: latestFreshness.total,
            stale: latestFreshness.stale,
            staleRate: latestFreshness.total === 0 ? 0 : latestFreshness.stale / latestFreshness.total,
            observedAt: new Date(latestFreshness.timestamp).toISOString()
          }
        : null,
      delivery: {
        windowMinutes: 15,
        channels
      },
      modelUsage: {
        windowMinutes: 60,
        ...tokenTotals
      }
    };
  }

  evaluateAlerts(): OperationalAlert[] {
    const now = this.now();
    const metrics = this.getMetrics();
    const alerts: OperationalAlert[] = [];

    if (metrics.http.requests >= 20 && metrics.http.errorRate > 0.05) {
      alerts.push({
        code: 'api_error_rate_high',
        severity: 'critical',
        message: `HTTP 5xx error rate is ${(metrics.http.errorRate * 100).toFixed(1)}% in last 5m.`,
        runbook: 'runbook://ops/api-error-rate',
        triggeredAt: new Date(now).toISOString()
      });
    }

    if (metrics.freshness && metrics.freshness.stale > 0) {
      alerts.push({
        code: 'signal_freshness_degraded',
        severity: 'warning',
        message: `${metrics.freshness.stale}/${metrics.freshness.total} latest signals are stale.`,
        runbook: 'runbook://signals/freshness',
        triggeredAt: new Date(now).toISOString()
      });
    }

    for (const channel of metrics.delivery.channels) {
      if (channel.attempts >= 10 && channel.successRate < 0.95) {
        alerts.push({
          code: `channel_health_${channel.channel}`,
          severity: 'warning',
          message: `${channel.channel} success rate dropped to ${(channel.successRate * 100).toFixed(1)}%.`,
          runbook: `runbook://delivery/${channel.channel}`,
          triggeredAt: new Date(now).toISOString()
        });
      }
    }

    if (metrics.modelUsage.costUsd > this.costSpikeThresholdUsd) {
      alerts.push({
        code: 'api_cost_spike',
        severity: 'warning',
        message: `Model/API cost reached $${metrics.modelUsage.costUsd.toFixed(2)} in the last hour.`,
        runbook: 'runbook://cost/model-usage',
        triggeredAt: new Date(now).toISOString()
      });
    }

    return alerts;
  }
}
