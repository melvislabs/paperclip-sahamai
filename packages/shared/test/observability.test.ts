import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ObservabilityHub } from '../src/observability.js';
import type { DeliveryChannel } from '../src/fanout.js';

describe('ObservabilityHub', () => {
  let now: number;
  let nowFn: () => number;

  beforeEach(() => {
    now = Date.now();
    nowFn = () => now;
  });

  describe('recordHttpRequest', () => {
    it('records and returns metrics', () => {
      const hub = new ObservabilityHub(nowFn);
      hub.recordHttpRequest('/api/test', 200, 50);
      hub.recordHttpRequest('/api/test', 500, 100);
      const metrics = hub.getMetrics();
      expect(metrics.http.requests).toBe(2);
      expect(metrics.http.errors5xx).toBe(1);
      expect(metrics.http.errorRate).toBe(0.5);
      expect(metrics.http.avgLatencyMs).toBe(75);
    });

    it('returns zero metrics when no data', () => {
      const hub = new ObservabilityHub(nowFn);
      const metrics = hub.getMetrics();
      expect(metrics.http.requests).toBe(0);
      expect(metrics.http.errors5xx).toBe(0);
    });

    it('filters out old metrics outside window', () => {
      const hub = new ObservabilityHub(nowFn);
      hub.recordHttpRequest('/api/test', 200, 50);
      now += 6 * 60 * 1000;
      hub.recordHttpRequest('/api/test', 200, 30);
      const metrics = hub.getMetrics();
      expect(metrics.http.requests).toBe(1);
    });

    it('calculates p50, p95, p99 latency percentiles', () => {
      const hub = new ObservabilityHub(nowFn);
      for (let i = 1; i <= 100; i++) {
        hub.recordHttpRequest('/api/test', 200, i);
      }
      const metrics = hub.getMetrics();
      expect(metrics.http.p50LatencyMs).toBe(51);
      expect(metrics.http.p95LatencyMs).toBe(95);
      expect(metrics.http.p99LatencyMs).toBe(99);
    });
  });

  describe('recordSignalFreshness', () => {
    it('tracks latest freshness snapshot', () => {
      const hub = new ObservabilityHub(nowFn);
      hub.recordSignalFreshness(10, 2);
      hub.recordSignalFreshness(10, 1);
      const metrics = hub.getMetrics();
      expect(metrics.freshness).not.toBeNull();
      expect(metrics.freshness!.total).toBe(10);
      expect(metrics.freshness!.stale).toBe(1);
      expect(metrics.freshness!.staleRate).toBe(0.1);
    });

    it('returns null freshness when no data', () => {
      const hub = new ObservabilityHub(nowFn);
      expect(hub.getMetrics().freshness).toBeNull();
    });
  });

  describe('recordDelivery', () => {
    it('tracks delivery metrics by channel', () => {
      const hub = new ObservabilityHub(nowFn);
      hub.recordDelivery('telegram' as DeliveryChannel, 'delivered', 100);
      hub.recordDelivery('telegram' as DeliveryChannel, 'delivered', 150);
      hub.recordDelivery('telegram' as DeliveryChannel, 'dead_lettered', 200);
      const metrics = hub.getMetrics();
      const telegram = metrics.delivery.channels.find((c) => c.channel === 'telegram');
      expect(telegram).toBeDefined();
      expect(telegram!.attempts).toBe(3);
      expect(telegram!.successRate).toBe(2 / 3);
    });

    it('calculates p95 latency', () => {
      const hub = new ObservabilityHub(nowFn);
      for (let i = 1; i <= 20; i++) {
        hub.recordDelivery('slack' as DeliveryChannel, 'delivered', i * 10);
      }
      const metrics = hub.getMetrics();
      const slack = metrics.delivery.channels.find((c) => c.channel === 'slack');
      expect(slack!.p95LatencyMs).toBe(190);
    });
  });

  describe('recordModelUsage', () => {
    it('aggregates token usage and cost', () => {
      const hub = new ObservabilityHub(nowFn);
      hub.recordModelUsage('openai', 'gpt-4', 100, 200, 0.5);
      hub.recordModelUsage('openai', 'gpt-4', 150, 250, 0.75);
      const metrics = hub.getMetrics();
      expect(metrics.modelUsage.promptTokens).toBe(250);
      expect(metrics.modelUsage.completionTokens).toBe(450);
      expect(metrics.modelUsage.costUsd).toBe(1.25);
    });

    it('filters out old usage data outside window', () => {
      const hub = new ObservabilityHub(nowFn);
      hub.recordModelUsage('openai', 'gpt-4', 100, 200, 0.5);
      now += 61 * 60 * 1000;
      hub.recordModelUsage('openai', 'gpt-4', 50, 100, 0.25);
      const metrics = hub.getMetrics();
      expect(metrics.modelUsage.promptTokens).toBe(50);
    });
  });

  describe('evaluateAlerts', () => {
    it('alerts on high error rate', () => {
      const hub = new ObservabilityHub(nowFn);
      for (let i = 0; i < 20; i++) {
        hub.recordHttpRequest('/api/test', i < 2 ? 500 : 200, 50);
      }
      const alerts = hub.evaluateAlerts();
      const errorAlert = alerts.find((a) => a.code === 'api_error_rate_high');
      expect(errorAlert).toBeDefined();
      expect(errorAlert!.severity).toBe('critical');
    });

    it('alerts on stale signals', () => {
      const hub = new ObservabilityHub(nowFn);
      hub.recordSignalFreshness(10, 3);
      const alerts = hub.evaluateAlerts();
      const freshnessAlert = alerts.find((a) => a.code === 'signal_freshness_degraded');
      expect(freshnessAlert).toBeDefined();
      expect(freshnessAlert!.severity).toBe('warning');
    });

    it('alerts on channel health degradation', () => {
      const hub = new ObservabilityHub(nowFn);
      for (let i = 0; i < 10; i++) {
        hub.recordDelivery('email' as DeliveryChannel, i < 2 ? 'dead_lettered' : 'delivered', 100);
      }
      const alerts = hub.evaluateAlerts();
      const channelAlert = alerts.find((a) => a.code === 'channel_health_email');
      expect(channelAlert).toBeDefined();
    });

    it('alerts on cost spike', () => {
      const hub = new ObservabilityHub(nowFn, 1);
      hub.recordModelUsage('openai', 'gpt-4', 1000, 2000, 2);
      const alerts = hub.evaluateAlerts();
      const costAlert = alerts.find((a) => a.code === 'api_cost_spike');
      expect(costAlert).toBeDefined();
      expect(costAlert!.message).toContain('$2.00');
    });

    it('returns empty alerts when healthy', () => {
      const hub = new ObservabilityHub(nowFn);
      hub.recordHttpRequest('/api/test', 200, 50);
      const alerts = hub.evaluateAlerts();
      expect(alerts).toHaveLength(0);
    });
  });
});
