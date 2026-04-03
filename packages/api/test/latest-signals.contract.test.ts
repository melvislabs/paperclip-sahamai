import { describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';

describe('latest signals contract', () => {
  const now = 1_700_000_000_000;
  const server = buildServer(() => now);

  it('returns single symbol signal with freshness', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/signals/latest/BBCA'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Record<string, unknown>;
    expect(body).toMatchObject({
      symbol: 'BBCA',
      stale: false,
      status: 'fresh',
      signal: {
        action: 'buy',
        confidence: 0.81,
        symbol: 'BBCA'
      }
    });
  });

  it('returns 404 for unknown symbol', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/signals/latest/UNKNOWN'
    });

    expect(response.statusCode).toBe(404);
    const body = response.json() as Record<string, unknown>;
    expect(body).toMatchObject({
      symbol: 'UNKNOWN',
      stale: true,
      status: 'missing'
    });
  });

  it('returns multiple signals when no symbols specified', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/signals/latest'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Record<string, unknown>;
    expect(body).toMatchObject({
      count: 2,
      data: expect.arrayContaining([
        expect.objectContaining({ symbol: 'BBCA' }),
        expect.objectContaining({ symbol: 'TLKM' })
      ])
    });
  });

  it('filters by symbols query parameter', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/signals/latest?symbols=BBCA'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Record<string, unknown>;
    expect(body).toMatchObject({
      count: 1,
      data: [{ symbol: 'BBCA' }]
    });
  });
});
