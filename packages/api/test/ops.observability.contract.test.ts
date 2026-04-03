import { describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';

describe('ops observability contract', () => {
  const now = 1_700_000_000_000;
  const server = buildServer(() => now);

  it('returns metrics with expected shape', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/ops/metrics'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Record<string, unknown>;
    expect(body).toMatchObject({
      generatedAt: expect.any(String),
      http: expect.objectContaining({
        windowMinutes: 5,
        requests: expect.any(Number),
        errorRate: expect.any(Number)
      }),
      freshness: expect.objectContaining({
        total: expect.any(Number),
        stale: expect.any(Number)
      }),
      delivery: expect.objectContaining({
        windowMinutes: 15,
        channels: expect.any(Array)
      }),
      modelUsage: expect.objectContaining({
        windowMinutes: 60
      })
    });
  });

  it('returns dashboard with SLO summary', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/ops/dashboard/latest'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Record<string, unknown>;
    expect(body).toMatchObject({
      generatedAt: expect.any(String),
      slo: expect.objectContaining({
        apiErrorRate: expect.any(Number),
        apiLatencyAvgMs: expect.any(Number),
        staleRate: expect.any(Number)
      })
    });
  });

  it('returns alerts with expected shape', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/ops/alerts/latest'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Record<string, unknown>;
    expect(body).toMatchObject({
      generatedAt: expect.any(String),
      count: expect.any(Number),
      alerts: expect.any(Array)
    });
  });
});
