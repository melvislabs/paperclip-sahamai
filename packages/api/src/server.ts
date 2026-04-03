import Fastify from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { CACHE_TTL_MS, TtlCache, ObservabilityHub, SignalStore, AIAnalysisService, MockLLMProvider, buildStockApiConfig, StockApiClient } from '@sahamai/shared';
import type { LatestSignal, SignalWithFreshness, PriceDataPoint, NewsItem, AIAnalysisResult } from '@sahamai/shared';
import { registerAuthRoutes, protectRoutes } from './auth/middleware.js';
import {
  SymbolParamSchema,
  SymbolsQuerySchema,
  AnalysisBodySchema,
  SearchQuerySchema,
  HistoryQuerySchema,
  RegisterBodySchema,
  LoginBodySchema,
  RefreshBodySchema,
  CreateApiKeyBodySchema,
  ValidationErrorSchema
} from './auth/schemas.js';

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
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      serializers: {
        req(request) {
          return {
            method: request.method,
            url: request.url,
            path: request.url,
            parameters: request.params,
            remoteAddress: request.ip,
            remotePort: request.socket?.remotePort
          };
        },
        res(reply) {
          return {
            statusCode: reply.statusCode
          };
        }
      }
    }
  });
  const store = new SignalStore();
  const cache = new TtlCache<SignalWithFreshness | null>(CACHE_TTL_MS);
  const observability = new ObservabilityHub(nowProvider);

  app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: true,
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
  });

  app.register(fastifyCors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
    credentials: true,
    maxAge: 600
  });

  app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip,
    allowList: (request) => process.env.NODE_ENV === 'test',
    errorResponseBuilder: (request, context) => ({
      code: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil((Number(context.after) - Date.now()) / 1000)} seconds`,
      retryAfter: Math.ceil((Number(context.after) - Date.now()) / 1000)
    }),
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true
    }
  });

  store.seed(buildSeedSignals(nowProvider()));

  registerAuthRoutes(app);

  const protectedRoutes = [
    '/v1/signals',
    '/v1/analysis',
    '/v1/stocks',
    '/v1/ops'
  ];

  protectRoutes(app, protectedRoutes, {
    skipAuth: ['/health', '/v1/auth/register', '/v1/auth/login', '/v1/auth/refresh']
  });

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

  app.get('/v1/signals/latest/:symbol', {
    schema: {
      params: SymbolParamSchema
    }
  }, async (request, reply) => {
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

  app.get('/v1/signals/latest', {
    schema: {
      querystring: SymbolsQuerySchema
    }
  }, async (request) => {
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

  const analysisCache = new TtlCache<AIAnalysisResult | null>(3600000);
  const llmProvider = process.env.OPENAI_API_KEY
    ? undefined
    : new MockLLMProvider();
  const analysisService = new AIAnalysisService({
    llmProvider: llmProvider!,
    now: nowProvider
  });

  app.post('/v1/analysis/:symbol', {
    schema: {
      params: SymbolParamSchema,
      body: AnalysisBodySchema,
      response: {
        400: ValidationErrorSchema,
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    bodyLimit: 1048576 // 1MB limit for analysis payloads
  }, async (request, reply) => {
    return withRequestMetrics('/v1/analysis/:symbol', async () => {
      const params = request.params as { symbol: string };
      const body = request.body as {
        priceHistory: PriceDataPoint[];
        news?: NewsItem[];
      };
      const symbol = params.symbol.toUpperCase();

      const key = `analysis:${symbol}:${body.priceHistory.length}`;
      const cached = analysisCache.getOrLoad(key, () => null as AIAnalysisResult | null, nowProvider());
      if (cached) return cached;

      try {
        const result = await analysisService.analyze(
          symbol,
          body.priceHistory,
          body.news ?? []
        );
        return result;
      } catch (error) {
        return reply.code(500).send({
          error: 'Analysis Failed',
          message: 'An error occurred during analysis'
        });
      }
    }, () => reply.statusCode);
  });

  app.get('/v1/analysis/:symbol/latest', {
    schema: {
      params: SymbolParamSchema
    }
  }, async (request, reply) => {
    return withRequestMetrics('/v1/analysis/:symbol/latest', async () => {
      const params = request.params as { symbol: string };
      const symbol = params.symbol.toUpperCase();
      const key = `analysis_latest:${symbol}`;

      const cached = analysisCache.getOrLoad(key, () => null as AIAnalysisResult | null, nowProvider());
      if (!cached) {
        return reply.code(404).send({
          symbol,
          message: 'No analysis available'
        });
      }

      return cached;
    }, () => reply.statusCode);
  });

  const stockApiConfig = buildStockApiConfig({
    provider: (process.env.STOCK_API_PROVIDER as any) || 'finnhub',
    apiKey: process.env.STOCK_API_KEY || '',
    cacheTtlMs: 5 * 60 * 1000
  });

  const stockApiClient = process.env.STOCK_API_KEY
    ? new StockApiClient(stockApiConfig)
    : null;

  app.get('/v1/stocks/:symbol/quote', {
    schema: {
      params: SymbolParamSchema
    }
  }, async (request, reply) => {
    return withRequestMetrics('/v1/stocks/:symbol/quote', async () => {
      if (!stockApiClient) {
        return reply.code(503).send({
          error: 'Service Unavailable',
          message: 'Stock data API not configured. Set STOCK_API_KEY environment variable.'
        });
      }

      const params = request.params as { symbol: string };
      const symbol = params.symbol.toUpperCase();

      try {
        const result = await stockApiClient.getQuote(symbol);
        return result;
      } catch (error) {
        return reply.code(502).send({
          error: 'Bad Gateway',
          message: error instanceof Error ? error.message : 'Failed to fetch quote'
        });
      }
    }, () => reply.statusCode);
  });

  app.get('/v1/stocks/:symbol/history', {
    schema: {
      params: SymbolParamSchema,
      querystring: HistoryQuerySchema
    }
  }, async (request, reply) => {
    return withRequestMetrics('/v1/stocks/:symbol/history', async () => {
      if (!stockApiClient) {
        return reply.code(503).send({
          error: 'Service Unavailable',
          message: 'Stock data API not configured. Set STOCK_API_KEY environment variable.'
        });
      }

      const params = request.params as { symbol: string };
      const query = request.query as { interval?: string; from?: string; to?: string };
      const symbol = params.symbol.toUpperCase();

      try {
        const result = await stockApiClient.getHistory(
          symbol,
          query.interval || '1day',
          query.from,
          query.to
        );
        return result;
      } catch (error) {
        return reply.code(502).send({
          error: 'Bad Gateway',
          message: error instanceof Error ? error.message : 'Failed to fetch history'
        });
      }
    }, () => reply.statusCode);
  });

  app.get('/v1/stocks/:symbol/news', {
    schema: {
      params: SymbolParamSchema
    }
  }, async (request, reply) => {
    return withRequestMetrics('/v1/stocks/:symbol/news', async () => {
      if (!stockApiClient) {
        return reply.code(503).send({
          error: 'Service Unavailable',
          message: 'Stock data API not configured. Set STOCK_API_KEY environment variable.'
        });
      }

      const params = request.params as { symbol: string };
      const symbol = params.symbol.toUpperCase();

      try {
        const result = await stockApiClient.getNews(symbol);
        return result;
      } catch (error) {
        return reply.code(502).send({
          error: 'Bad Gateway',
          message: error instanceof Error ? error.message : 'Failed to fetch news'
        });
      }
    }, () => reply.statusCode);
  });

  app.get('/v1/stocks/search', async (request, reply) => {
    return withRequestMetrics('/v1/stocks/search', async () => {
      if (!stockApiClient) {
        return reply.code(503).send({
          error: 'Service Unavailable',
          message: 'Stock data API not configured. Set STOCK_API_KEY environment variable.'
        });
      }

      const query = request.query as { q: string };
      if (!query.q) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'q parameter is required'
        });
      }

      try {
        const result = await stockApiClient.search(query.q);
        return result;
      } catch (error) {
        return reply.code(502).send({
          error: 'Bad Gateway',
          message: error instanceof Error ? error.message : 'Failed to search stocks'
        });
      }
    }, () => reply.statusCode);
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
