import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StockApiClient, buildStockApiConfig, RateLimiter, ResponseCache } from '../src/stock-api/index.js';
import type { StockApiConfig } from '../src/stock-api/index.js';

function createMockConfig(overrides: Partial<StockApiConfig> = {}): StockApiConfig {
  return buildStockApiConfig({
    provider: 'finnhub',
    apiKey: 'test-key',
    ...overrides
  });
}

describe('buildStockApiConfig', () => {
  it('should create config with defaults', () => {
    const config = createMockConfig();

    expect(config.provider).toBe('finnhub');
    expect(config.apiKey).toBe('test-key');
    expect(config.baseUrl).toBe('https://finnhub.io/api/v1');
    expect(config.timeoutMs).toBe(10000);
    expect(config.maxRetries).toBe(3);
    expect(config.rateLimitPerMin).toBe(60);
    expect(config.cacheTtlMs).toBe(5 * 60 * 1000);
  });

  it('should allow overrides', () => {
    const config = createMockConfig({
      timeoutMs: 5000,
      maxRetries: 5,
      cacheTtlMs: 60000
    });

    expect(config.timeoutMs).toBe(5000);
    expect(config.maxRetries).toBe(5);
    expect(config.cacheTtlMs).toBe(60000);
  });
});

describe('RateLimiter', () => {
  let now: number;
  let sleepCalls: number[];

  beforeEach(() => {
    now = 0;
    sleepCalls = [];
  });

  const createLimiter = (rpm: number) => {
    return new RateLimiter(rpm, {
      now: () => now,
      sleep: async (ms: number) => {
        sleepCalls.push(ms);
        now += ms;
      }
    });
  };

  it('should allow requests within limit', async () => {
    const limiter = createLimiter(60);

    for (let i = 0; i < 60; i++) {
      await limiter.acquire();
    }

    expect(limiter.getRemaining()).toBe(0);
  });

  it('should refill tokens over time', async () => {
    const limiter = createLimiter(60);

    for (let i = 0; i < 60; i++) {
      await limiter.acquire();
    }

    expect(limiter.getRemaining()).toBe(0);

    now += 1000;
    expect(limiter.getRemaining()).toBeGreaterThan(0);
  });

  it('should wait when rate limited', async () => {
    const limiter = createLimiter(1);

    await limiter.acquire();
    await limiter.acquire();

    expect(sleepCalls.length).toBeGreaterThan(0);
  });
});

describe('ResponseCache', () => {
  let now: number;

  beforeEach(() => {
    now = 0;
  });

  const createCache = (ttlMs: number) => {
    return new ResponseCache<string>(ttlMs, { now: () => now });
  };

  it('should store and retrieve values', () => {
    const cache = createCache(1000);

    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return null for missing keys', () => {
    const cache = createCache(1000);

    expect(cache.get('missing')).toBeNull();
  });

  it('should expire values after TTL', () => {
    const cache = createCache(1000);

    cache.set('key1', 'value1');
    now = 1001;

    expect(cache.get('key1')).toBeNull();
  });

  it('should invalidate specific keys', () => {
    const cache = createCache(1000);

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    cache.invalidate('key1');

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
  });

  it('should clear all entries', () => {
    const cache = createCache(1000);

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    cache.clear();

    expect(cache.size()).toBe(0);
  });
});

describe('StockApiClient', () => {
  describe('with mock fetch', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('should fetch quote from finnhub', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          c: 150.00,
          o: 148.00,
          h: 151.00,
          l: 147.50,
          pc: 149.00
        })
      }) as any;

      const config = createMockConfig();
      const client = new StockApiClient(config);

      const result = await client.getQuote('AAPL');

      expect(result.success).toBe(true);
      expect(result.data.symbol).toBe('AAPL');
      expect(result.data.price).toBe(150.00);
      expect(result.data.open).toBe(148.00);
      expect(result.data.high).toBe(151.00);
      expect(result.data.low).toBe(147.50);
    });

    it('should search for stocks', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: [
            { symbol: 'AAPL', description: 'Apple Inc', exchange: 'US' }
          ]
        })
      }) as any;

      const config = createMockConfig();
      const client = new StockApiClient(config);

      const result = await client.search('Apple');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].symbol).toBe('AAPL');
      expect(result.data[0].name).toBe('Apple Inc');
    });

    it('should handle rate limit errors with retry', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return { ok: false, status: 429, statusText: 'Too Many Requests' };
        }
        return {
          ok: true,
          json: async () => ({
            c: 150.00,
            o: 148.00,
            h: 151.00,
            l: 147.50,
            pc: 149.00
          })
        };
      }) as any;

      const config = createMockConfig({ maxRetries: 3 });
      const client = new StockApiClient(config);

      const result = await client.getQuote('AAPL');

      expect(result.success).toBe(true);
      expect(callCount).toBe(2);
    });

    it('should use cached quotes', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          c: 150.00,
          o: 148.00,
          h: 151.00,
          l: 147.50,
          pc: 149.00
        })
      }) as any;

      globalThis.fetch = fetchMock;

      const config = createMockConfig();
      const client = new StockApiClient(config);

      await client.getQuote('AAPL');
      await client.getQuote('AAPL');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
