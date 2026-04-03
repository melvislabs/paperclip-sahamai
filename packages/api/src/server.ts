import Fastify from 'fastify';
import { CACHE_TTL_MS, TtlCache, ObservabilityHub, SignalStore } from '@sahamai/shared';
import type { LatestSignal, SignalWithFreshness } from '@sahamai/shared';

function buildSeedSignals(nowMs: number): LatestSignal[] {
  return [
    {
      symbol: 'BBCA',
      action: 'buy',
      confidence: 0.81,
      generatedAt: new Date(nowMs - 30_000).toISOString(),
      expiresAt: new Date(nowMs + 4 * 60_000).toISOString(),
      version: 'signal-registry-v1',
      reasonCodes: ['trend_up', 'volume_confirmation']
    },
    {
      symbol: 'TLKM',
      action: 'hold',
      confidence: 0.64,
      generatedAt: new Date(nowMs - 10 * 60_000).toISOString(),
      expiresAt: new Date(nowMs - 5_000).toISOString(),
      version: 'signal-registry-v1',
      reasonCodes: ['range_bound']
    }
  ];
}

export function buildServer(nowProvider: () => number = () => Date.now()) {
  const app = Fastify({ logger: false });
  const store = new SignalStore();
  const cache = new TtlCache<SignalWithFreshness | null>(CACHE_TTL_MS);
  const observability = new ObservabilityHub(nowProvider);

  store.seed(buildSeedSignals(nowProvider()));

  const refreshFreshness = () => {
    const allSignals = store.all(nowProvider());
    const staleCount = allSignals.filter((item) => item.stale).length;
    observability.recordSignalFreshness(allSignals.length, staleCount);
    return allSignals;
  };

  const withRequestMetrics = async <T>(
    route: string,
    execute: () => Promise<T>,
    statusCode: () => number = () => 200
  ): Promise<T> => {
    const startedAt = nowProvider();
    try {
      const result = await execute();
      observability.recordHttpRequest(route, statusCode(), Math.max(0, nowProvider() - startedAt));
      return result;
    } catch (error) {
      observability.recordHttpRequest(route, 500, Math.max(0, nowProvider() - startedAt));
      throw error;
    }
  };

  app.get('/health', async () => {
    return withRequestMetrics('/health', async () => ({
      status: 'ok',
      service: 'paperclip-sahamai',
      now: new Date(nowProvider()).toISOString()
    }));
  });

  app.get('/v1/signals/latest/:symbol', async (request, reply) => {
    return withRequestMetrics('/v1/signals/latest/:symbol', async () => {
      const params = request.params as { symbol: string };
      const symbol = params.symbol.toUpperCase();
      const key = `signal_registry_head:${symbol}`;

      refreshFreshness();
      const result = cache.getOrLoad(
        key,
        () => store.get(symbol, nowProvider()),
        nowProvider()
      );

      if (!result) {
        return reply.code(404).send({
          symbol,
          stale: true,
          status: 'missing',
          message: 'Signal not found'
        });
      }

      if (result.stale) {
        return reply.code(503).send({
          symbol,
          stale: true,
          status: 'stale',
          signal: result.signal
        });
      }

      return reply.send({
        symbol,
        stale: false,
        status: 'fresh',
        signal: result.signal
      });
    }, () => reply.statusCode);
  });

  app.get('/v1/signals/latest', async (request) => {
    return withRequestMetrics('/v1/signals/latest', async () => {
      const query = request.query as { symbols?: string };
      const symbols = (query.symbols ?? '')
        .split(',')
        .map((part) => part.trim().toUpperCase())
        .filter(Boolean);

      const source = symbols.length > 0 ? symbols : refreshFreshness().map((x) => x.signal.symbol);

      const data = source.map((symbol) => {
        const key = `signal_registry_head:${symbol}`;
        const item = cache.getOrLoad(
          key,
          () => store.get(symbol, nowProvider()),
          nowProvider()
        );

        if (!item) {
          return {
            symbol,
            stale: true,
            status: 'missing'
          };
        }

        return {
          symbol,
          stale: item.stale,
          status: item.stale ? 'stale' : 'fresh',
          signal: item.signal
        };
      });

      return {
        count: data.length,
        staleCount: data.filter((x) => x.stale).length,
        data
      };
    });
  });

  app.get('/v1/signals/summary/latest', async (_request, reply) => {
    return withRequestMetrics('/v1/signals/summary/latest', async () => {
      const allSignals = refreshFreshness();
      const fresh = allSignals.filter((item) => !item.stale);
      const stale = allSignals.filter((item) => item.stale);

      const payload = {
        total: allSignals.length,
        freshCount: fresh.length,
        staleCount: stale.length,
        generatedAt: new Date(nowProvider()).toISOString(),
        staleSymbols: stale.map((item) => item.signal.symbol)
      };

      if (fresh.length === 0) {
        return reply.code(503).send({ stale: true, status: 'all_stale', ...payload });
      }

      return { stale: stale.length > 0, status: 'ok', ...payload };
    }, () => reply.statusCode);
  });

  app.get('/v1/ops/metrics', async () => {
    return withRequestMetrics('/v1/ops/metrics', async () => {
      refreshFreshness();
      return observability.getMetrics();
    });
  });

  app.get('/v1/ops/dashboard/latest', async () => {
    return withRequestMetrics('/v1/ops/dashboard/latest', async () => {
      refreshFreshness();
      const metrics = observability.getMetrics();
      return {
        generatedAt: metrics.generatedAt,
        slo: {
          apiErrorRate: metrics.http.errorRate,
          apiLatencyAvgMs: metrics.http.avgLatencyMs,
          staleRate: metrics.freshness?.staleRate ?? 0
        },
        channels: metrics.delivery.channels,
        costs: metrics.modelUsage
      };
    });
  });

  app.get('/v1/ops/alerts/latest', async () => {
    return withRequestMetrics('/v1/ops/alerts/latest', async () => {
      refreshFreshness();
      const alerts = observability.evaluateAlerts();
      return {
        generatedAt: new Date(nowProvider()).toISOString(),
        count: alerts.length,
        alerts
      };
    });
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const server = buildServer();
  const port = Number(process.env.PORT ?? 3000);
  server.listen({ port, host: '0.0.0.0' }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
