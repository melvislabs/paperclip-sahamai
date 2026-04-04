import { Type } from '@sinclair/typebox';
import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { CACHE_TTL_MS, TtlCache, ObservabilityHub, SignalStore, AIAnalysisService, MockLLMProvider, buildStockApiConfig, StockApiClient } from '@sahamai/shared';
import type { LatestSignal, SignalWithFreshness, PriceDataPoint, NewsItem, AIAnalysisResult } from '@sahamai/shared';
import { registerAuthRoutes, protectRoutes } from './auth/middleware.js';
import { registerAlertRoutes } from './routes/alerts.js';
import { registerDigestRoutes } from './routes/digest.js';
import { registerUserRoutes } from './routes/users.js';
import { registerPortfolioRoutes } from './routes/portfolios.js';
import { registerWebSocketRoutes } from './services/websocket.js';
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
  ValidationErrorSchema,
  SignalWithFreshnessSchema,
  SignalListResponseSchema,
  SignalSummaryResponseSchema,
  HealthResponseSchema,
  AIAnalysisResultSchema,
  QuoteResponseSchema,
  HistoryResponseSchema,
  NewsResponseSchema,
  SearchResponseSchema,
  MetricsResponseSchema,
  AlertsResponseSchema,
  SLODashboardResponseSchema,
  AuthResponseSchema,
  ApiKeyResponseSchema,
  ErrorSchema,
  SignalSchema
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

  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Saham AI API',
        description: 'AI-powered stock analysis platform for Indonesian equities (IHSG)',
        version: '0.1.0'
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        }
      ],
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Signals', description: 'Trading signal endpoints' },
        { name: 'Analysis', description: 'AI analysis endpoints' },
        { name: 'Stocks', description: 'Stock data endpoints' },
        { name: 'Operations', description: 'Operational metrics and alerts' },
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Alerts', description: 'Price alert management endpoints' },
        { name: 'Digest', description: 'Daily digest email settings' }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          apiKey: {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header'
          }
        }
      }
    }
  });

  app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    },
    staticCSP: true
  });

  app.register(fastifyWebsocket);

  app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
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
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-API-Key'],
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

  const wsManager = registerWebSocketRoutes(app, store, nowProvider);

  const protectedRoutes = [
    '/v1/signals',
    '/v1/analysis',
    '/v1/stocks',
    '/v1/ops',
    '/v1/alerts',
    '/v1/settings',
    '/v1/users',
    '/v1/portfolios'
  ];

  protectRoutes(app, protectedRoutes, {
    skipAuth: ['/health', '/v1/auth/register', '/v1/auth/login', '/v1/auth/refresh']
  });

  app.setErrorHandler((error, request, reply) => {
    const err = error as Error & { validation?: Array<{ message: string }> };
    if (err.validation) {
      return reply.code(400).send({
        statusCode: 400,
        code: 'FST_ERR_VALIDATION',
        error: 'Bad Request',
        message: err.validation.map((v) => v.message).join(', ')
      });
    }
    reply.send(error);
  });

  registerAlertRoutes(app);
  registerDigestRoutes(app);
  registerUserRoutes(app);
  registerPortfolioRoutes(app);

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

  app.get('/health', {
    schema: {
      tags: ['Health'],
      description: 'Health check endpoint',
      response: {
        200: HealthResponseSchema
      }
    }
  }, async () => {
    return withRequestMetrics('/health', async () => ({
      status: 'ok',
      service: 'paperclip-sahamai',
      now: new Date(nowProvider()).toISOString()
    }));
  });

  app.get('/v1/signals/latest/:symbol', {
    schema: {
      tags: ['Signals'],
      description: 'Get the latest trading signal for a single symbol',
      params: SymbolParamSchema,
      response: {
        200: SignalWithFreshnessSchema,
        404: Type.Object({
          symbol: Type.String(),
          stale: Type.Boolean(),
          status: Type.String(),
          message: Type.String()
        }),
        503: Type.Object({
          symbol: Type.String(),
          stale: Type.Boolean(),
          status: Type.String(),
          signal: SignalSchema
        })
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
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
      tags: ['Signals'],
      description: 'Get latest trading signals for multiple symbols',
      querystring: SymbolsQuerySchema,
      response: {
        200: SignalListResponseSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
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

  app.get('/v1/signals/summary/latest', {
    schema: {
      tags: ['Signals'],
      description: 'Get aggregate freshness summary of all signals',
      response: {
        200: SignalSummaryResponseSchema,
        503: Type.Object({
          stale: Type.Boolean(),
          status: Type.String(),
          total: Type.Number(),
          freshCount: Type.Number(),
          staleCount: Type.Number(),
          generatedAt: Type.String(),
          staleSymbols: Type.Array(Type.String())
        })
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (_request, reply) => {
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

  app.get('/v1/ops/metrics', {
    schema: {
      tags: ['Operations'],
      description: 'Get operational metrics',
      response: {
        200: MetricsResponseSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async () => {
    return withRequestMetrics('/v1/ops/metrics', async () => {
      refreshFreshness();
      return observability.getMetrics();
    });
  });

  app.get('/v1/ops/dashboard/latest', {
    schema: {
      tags: ['Operations'],
      description: 'Get SLO dashboard payload',
      response: {
        200: SLODashboardResponseSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async () => {
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

  app.get('/v1/ops/alerts/latest', {
    schema: {
      tags: ['Operations'],
      description: 'Get active alerts',
      response: {
        200: AlertsResponseSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async () => {
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
      tags: ['Analysis'],
      description: 'Run AI analysis for a symbol',
      params: SymbolParamSchema,
      body: AnalysisBodySchema,
      response: {
        200: AIAnalysisResultSchema,
        400: ValidationErrorSchema,
        500: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    },
    bodyLimit: 1048576
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
      tags: ['Analysis'],
      description: 'Get the latest cached AI analysis for a symbol',
      params: SymbolParamSchema,
      response: {
        200: AIAnalysisResultSchema,
        404: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
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
      tags: ['Stocks'],
      description: 'Get real-time quote for a symbol',
      params: SymbolParamSchema,
      response: {
        200: QuoteResponseSchema,
        502: ErrorSchema,
        503: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
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
      tags: ['Stocks'],
      description: 'Get historical OHLCV data for a symbol',
      params: SymbolParamSchema,
      querystring: HistoryQuerySchema,
      response: {
        200: HistoryResponseSchema,
        502: ErrorSchema,
        503: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
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
      tags: ['Stocks'],
      description: 'Get news for a symbol',
      params: SymbolParamSchema,
      response: {
        200: NewsResponseSchema,
        502: ErrorSchema,
        503: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
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

  app.get('/v1/stocks/search', {
    schema: {
      tags: ['Stocks'],
      description: 'Search for stocks by query',
      querystring: SearchQuerySchema,
      response: {
        200: SearchResponseSchema,
        400: ErrorSchema,
        502: ErrorSchema,
        503: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request, reply) => {
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
