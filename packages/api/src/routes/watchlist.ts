import type { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { authMiddleware } from '../auth/middleware.js';
import { getPrismaClient } from '../db/index.js';
import {
  WatchlistResponseSchema,
  AddWatchlistBodySchema,
  ReorderWatchlistBodySchema,
  ErrorSchema,
  ValidationErrorSchema
} from '../auth/schemas.js';

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function registerWatchlistRoutes(app: FastifyInstance) {
  app.get('/v1/watchlist', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Watchlist'],
      description: 'List watchlist symbols in user-defined order',
      response: {
        200: WatchlistResponseSchema,
        401: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request) => {
    const prisma = getPrismaClient();
    const userId = request.user!.userId;

    const items = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' }
    });

    return {
      symbols: items.map((i) => i.symbol)
    };
  });

  app.post('/v1/watchlist', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Watchlist'],
      description: 'Add a symbol to the watchlist',
      body: AddWatchlistBodySchema,
      response: {
        200: WatchlistResponseSchema,
        400: ValidationErrorSchema,
        401: ErrorSchema,
        409: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request, reply) => {
    const prisma = getPrismaClient();
    const userId = request.user!.userId;
    const body = request.body as { symbol: string };
    const symbol = normalizeSymbol(body.symbol);

    const existing = await prisma.watchlistItem.findUnique({
      where: { userId_symbol: { userId, symbol } }
    });
    if (existing) {
      return reply.code(409).send({
        error: 'Conflict',
        message: 'Symbol already in watchlist'
      });
    }

    const agg = await prisma.watchlistItem.aggregate({
      where: { userId },
      _max: { sortOrder: true }
    });
    const nextOrder = (agg._max.sortOrder ?? -1) + 1;

    await prisma.watchlistItem.create({
      data: { userId, symbol, sortOrder: nextOrder }
    });

    const items = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' }
    });

    return {
      symbols: items.map((i) => i.symbol)
    };
  });

  app.put('/v1/watchlist', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Watchlist'],
      description: 'Replace watchlist order (full list)',
      body: ReorderWatchlistBodySchema,
      response: {
        200: WatchlistResponseSchema,
        400: ValidationErrorSchema,
        401: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request) => {
    const prisma = getPrismaClient();
    const userId = request.user!.userId;
    const body = request.body as { symbols: string[] };

    const seen = new Set<string>();
    const normalized: string[] = [];
    for (const s of body.symbols) {
      const sym = normalizeSymbol(s);
      if (seen.has(sym)) continue;
      seen.add(sym);
      normalized.push(sym);
    }

    await prisma.$transaction(async (tx) => {
      await tx.watchlistItem.deleteMany({ where: { userId } });
      if (normalized.length > 0) {
        await tx.watchlistItem.createMany({
          data: normalized.map((symbol, sortOrder) => ({ userId, symbol, sortOrder }))
        });
      }
    });

    return { symbols: normalized };
  });

  app.delete('/v1/watchlist/:symbol', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Watchlist'],
      description: 'Remove a symbol from the watchlist',
      params: Type.Object({
        symbol: Type.String({ minLength: 1, maxLength: 10 })
      }),
      response: {
        200: WatchlistResponseSchema,
        401: ErrorSchema,
        404: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request, reply) => {
    const prisma = getPrismaClient();
    const userId = request.user!.userId;
    const params = request.params as { symbol: string };
    const symbol = normalizeSymbol(params.symbol);

    try {
      await prisma.watchlistItem.delete({
        where: { userId_symbol: { userId, symbol } }
      });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'P2025') {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Symbol not in watchlist'
        });
      }
      throw e;
    }

    const items = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' }
    });

    return {
      symbols: items.map((i) => i.symbol)
    };
  });
}
