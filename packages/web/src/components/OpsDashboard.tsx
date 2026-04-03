import { MetricCard } from './MetricCard';
import { AlertItem } from './AlertItem';
import type { OpsMetrics, OpsAlert, DashboardSLO } from '../types';

interface OpsDashboardProps {
  metrics: OpsMetrics | null;
  alerts: OpsAlert[];
  slo: DashboardSLO | null;
}

export function OpsDashboard({ metrics, alerts, slo }: OpsDashboardProps) {
  if (!metrics) {
    return <div className="empty-state"><p>No metrics available</p></div>;
  }

  return (
    <div className="dashboard">
      {slo && (
        <section className="ops-section">
          <h2>Service Level Objectives</h2>
          <div className="slo-grid">
            <MetricCard
              title="API Error Rate"
              value={`${(slo.apiErrorRate * 100).toFixed(2)}%`}
              status={slo.apiErrorRate < 0.01 ? 'success' : slo.apiErrorRate < 0.05 ? 'warning' : 'danger'}
            />
            <MetricCard
              title="Avg Latency"
              value={`${slo.apiLatencyAvgMs.toFixed(0)}ms`}
              status={slo.apiLatencyAvgMs < 100 ? 'success' : slo.apiLatencyAvgMs < 500 ? 'warning' : 'danger'}
            />
            <MetricCard
              title="Stale Rate"
              value={`${(slo.staleRate * 100).toFixed(1)}%`}
              status={slo.staleRate < 0.1 ? 'success' : slo.staleRate < 0.5 ? 'warning' : 'danger'}
            />
          </div>
        </section>
      )}

      <section className="ops-section">
        <h2>HTTP Metrics</h2>
        <div className="metrics-grid">
          <MetricCard
            title="Requests (5m)"
            value={metrics.http.requests.toString()}
            status="info"
          />
          <MetricCard
            title="5xx Errors"
            value={metrics.http.errors5xx.toString()}
            status={metrics.http.errors5xx === 0 ? 'success' : 'danger'}
          />
          <MetricCard
            title="Error Rate"
            value={`${(metrics.http.errorRate * 100).toFixed(2)}%`}
            status={metrics.http.errorRate < 0.01 ? 'success' : metrics.http.errorRate < 0.05 ? 'warning' : 'danger'}
          />
          <MetricCard
            title="Avg Latency"
            value={`${metrics.http.avgLatencyMs.toFixed(0)}ms`}
            status="info"
          />
        </div>
      </section>

      {metrics.freshness && (
        <section className="ops-section">
          <h2>Signal Freshness</h2>
          <div className="metrics-grid">
            <MetricCard
              title="Total Signals"
              value={metrics.freshness.total.toString()}
              status="info"
            />
            <MetricCard
              title="Stale Signals"
              value={metrics.freshness.stale.toString()}
              status={metrics.freshness.stale === 0 ? 'success' : 'warning'}
            />
            <MetricCard
              title="Stale Rate"
              value={`${(metrics.freshness.staleRate * 100).toFixed(1)}%`}
              status={metrics.freshness.staleRate < 0.1 ? 'success' : metrics.freshness.staleRate < 0.5 ? 'warning' : 'danger'}
            />
          </div>
        </section>
      )}

      {metrics.delivery.channels.length > 0 && (
        <section className="ops-section">
          <h2>Delivery Channels</h2>
          <div className="metrics-grid">
            {metrics.delivery.channels.map((channel) => (
              <MetricCard
                key={channel.channel}
                title={`${channel.channel.charAt(0).toUpperCase() + channel.channel.slice(1)}`}
                value={`${(channel.successRate * 100).toFixed(0)}%`}
                subtitle={`${channel.attempts} attempts, p95: ${channel.p95LatencyMs}ms`}
                status={channel.successRate >= 0.95 ? 'success' : channel.successRate >= 0.9 ? 'warning' : 'danger'}
              />
            ))}
          </div>
        </section>
      )}

      <section className="ops-section">
        <h2>Model Usage (1h)</h2>
        <div className="metrics-grid">
          <MetricCard
            title="Cost"
            value={`$${metrics.modelUsage.costUsd.toFixed(2)}`}
            status="info"
          />
          <MetricCard
            title="Prompt Tokens"
            value={metrics.modelUsage.promptTokens.toLocaleString()}
            status="info"
          />
          <MetricCard
            title="Completion Tokens"
            value={metrics.modelUsage.completionTokens.toLocaleString()}
            status="info"
          />
        </div>
      </section>

      {alerts.length > 0 && (
        <section className="ops-section">
          <h2>Active Alerts ({alerts.length})</h2>
          <div className="alerts-list">
            {alerts.map((alert, index) => (
              <AlertItem key={`${alert.code}-${index}`} alert={alert} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
