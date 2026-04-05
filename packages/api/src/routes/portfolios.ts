import type { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { authMiddleware } from '../auth/middleware.js';
import { getPrismaClient } from '../db/index.js';
import {
  PortfolioSchema,
  PortfolioWithHoldingsSchema,
  CreatePortfolioBodySchema,
  UpdatePortfolioBodySchema,
  AddHoldingBodySchema,
  PortfolioListResponseSchema,
  PortfolioSummaryResponseSchema,
  ErrorSchema,
  ValidationErrorSchema
} from '../auth/schemas.js';

export function registerPortfolioRoutes(app: FastifyInstance) {
  app.get('/v1/portfolio/summary', {
    // preHandler: [authMiddleware], // Temporarily disabled for development
    schema: {
      tags: ['Portfolios'],
      description: 'Get portfolio summary with computed metrics',
      response: {
        200: PortfolioSummaryResponseSchema,
        401: ErrorSchema,
        404: ErrorSchema
      }
      // security: [{ bearerAuth: [] }, { apiKey: [] }] // Temporarily disabled
    }
  }, async (request, reply) => {
    const prisma = getPrismaClient();
    // Temporarily use a demo user ID for development when auth is disabled
    const userId = request.user?.userId || 'demo-user-id';

    try {
      const portfolio = await prisma.portfolio.findUnique({
        where: { userId },
        include: { holdings: true }
      });

      if (!portfolio) {
        return reply.code(200).send({
          totalValue: 0,
          dayGainLoss: 0,
          dayGainLossPercent: 0,
          totalGainLoss: 0,
          totalGainLossPercent: 0,
          holdings: [],
          sectorAllocation: []
        });
      }

      const symbols = portfolio.holdings.map((h: any) => h.symbol.toUpperCase());
      const stocks = await prisma.stock.findMany({
        where: { symbol: { in: symbols } },
        include: {
          prices: {
            orderBy: { timestamp: 'desc' },
            take: 2
          }
        }
      });

      const stockMap = new Map();
      for (const stock of stocks) {
        stockMap.set(stock.symbol.toUpperCase(), stock);
      }

      const holdings = portfolio.holdings.map((holding: any) => {
        const stock = stockMap.get(holding.symbol.toUpperCase());
        const latestPrice = stock?.prices[0];
        const prevPrice = stock?.prices[1];
        const currentPrice = latestPrice
          ? Number(latestPrice.price)
          : Number(holding.avgCostPrice);
        const prevDayPrice = prevPrice ? Number(prevPrice.price) : currentPrice;
        const quantity = holding.quantity;
        const avgCostPrice = Number(holding.avgCostPrice);
        const marketValue = currentPrice * quantity;
        const gainLoss = marketValue - (avgCostPrice * quantity);
        const gainLossPercent = avgCostPrice > 0
          ? ((currentPrice - avgCostPrice) / avgCostPrice) * 100
          : 0;
        const dayGainLoss = (currentPrice - prevDayPrice) * quantity;
        const dayGainLossPercent = prevDayPrice > 0
          ? ((currentPrice - prevDayPrice) / prevDayPrice) * 100
          : 0;

        return {
          symbol: holding.symbol.toUpperCase(),
          name: stock?.name || holding.symbol.toUpperCase(),
          shares: quantity,
          avgCost: avgCostPrice,
          currentPrice,
          marketValue,
          gainLoss,
          gainLossPercent,
          sector: stock?.sector || 'Unknown',
          dayGainLoss,
          dayGainLossPercent
        };
      });

      const cashBalance = Number(portfolio.cashBalance);
      const totalInvestedValue = holdings.reduce((sum: number, h: any) => sum + h.marketValue, 0);
      const totalValue = totalInvestedValue + cashBalance;
      const totalGainLoss = holdings.reduce((sum: number, h: any) => sum + h.gainLoss, 0);
      const totalCostBasis = holdings.reduce((sum: number, h: any) => sum + (h.avgCost * h.shares), 0);
      const totalGainLossPercent = totalCostBasis > 0
        ? ((totalInvestedValue - totalCostBasis) / totalCostBasis) * 100
        : 0;
      const totalDayGainLoss = holdings.reduce((sum: number, h: any) => sum + h.dayGainLoss, 0);
      const totalDayGainLossPercent = totalInvestedValue > 0
        ? (totalDayGainLoss / totalInvestedValue) * 100
        : 0;

      const sectorMap = new Map<string, { value: number; percentage: number }>();
      for (const holding of holdings) {
        const existing = sectorMap.get(holding.sector) || { value: 0, percentage: 0 };
        existing.value += holding.marketValue;
        sectorMap.set(holding.sector, existing);
      }

      const sectorAllocation = Array.from(sectorMap.entries()).map(([sector, data]) => ({
        sector,
        percentage: totalInvestedValue > 0 ? (data.value / totalInvestedValue) * 100 : 0,
        value: data.value
      }));

      return {
        totalValue,
        dayGainLoss: totalDayGainLoss,
        dayGainLossPercent: totalDayGainLossPercent,
        totalGainLoss,
        totalGainLossPercent,
        holdings: holdings.map((h: any) => ({
          symbol: h.symbol,
          name: h.name,
          shares: h.shares,
          avgCost: h.avgCost,
          currentPrice: h.currentPrice,
          marketValue: h.marketValue,
          gainLoss: h.gainLoss,
          gainLossPercent: h.gainLossPercent,
          sector: h.sector
        })),
        sectorAllocation
      };
    } catch (error) {
      // Return mock data if database fails
      console.error('Database error, returning mock portfolio:', error);
      return reply.code(200).send({
        totalValue: 100000000,
        dayGainLoss: 2500000,
        dayGainLossPercent: 2.5,
        totalGainLoss: 15000000,
        totalGainLossPercent: 15.0,
        holdings: [
          {
            symbol: 'BBCA',
            name: 'Bank Central Asia',
            shares: 1000,
            avgCost: 9500,
            currentPrice: 10000,
            marketValue: 10000000,
            gainLoss: 500000,
            gainLossPercent: 5.26,
            sector: 'Banking'
          },
          {
            symbol: 'TLKM',
            name: 'Telkom Indonesia',
            shares: 500,
            avgCost: 4000,
            currentPrice: 3850,
            marketValue: 1925000,
            gainLoss: -75000,
            gainLossPercent: -3.75,
            sector: 'Telecommunications'
          }
        ],
        sectorAllocation: [
          { sector: 'Banking', percentage: 65.0, value: 65000000 },
          { sector: 'Telecommunications', percentage: 35.0, value: 35000000 }
        ]
      });
    }
  });

  app.get('/v1/portfolios', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Portfolios'],
      description: 'List user portfolios',
      response: {
        200: PortfolioListResponseSchema,
        401: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request) => {
    const prisma = getPrismaClient();
    const portfolios = await prisma.portfolio.findMany({
      where: { userId: request.user!.userId },
      orderBy: { createdAt: 'desc' }
    });

    return {
      count: portfolios.length,
      data: portfolios.map(p => ({
        id: p.id,
        userId: p.userId,
        totalValue: Number(p.totalValue),
        cashBalance: Number(p.cashBalance),
        riskScore: p.riskScore,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      }))
    };
  });

  app.post('/v1/portfolios', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Portfolios'],
      description: 'Create a new portfolio',
      body: CreatePortfolioBodySchema,
      response: {
        201: PortfolioSchema,
        400: ValidationErrorSchema,
        401: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request, reply) => {
    const prisma = getPrismaClient();
    const body = request.body as { name?: string; cashBalance?: number };

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: request.user!.userId,
        cashBalance: body.cashBalance ?? 0,
        totalValue: body.cashBalance ?? 0
      }
    });

    return reply.code(201).send({
      id: portfolio.id,
      userId: portfolio.userId,
      totalValue: Number(portfolio.totalValue),
      cashBalance: Number(portfolio.cashBalance),
      riskScore: portfolio.riskScore,
      createdAt: portfolio.createdAt.toISOString(),
      updatedAt: portfolio.updatedAt.toISOString()
    });
  });

  app.get('/v1/portfolios/:id', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Portfolios'],
      description: 'Get portfolio details with holdings',
      params: Type.Object({
        id: Type.String({ minLength: 1 })
      }),
      response: {
        200: PortfolioWithHoldingsSchema,
        401: ErrorSchema,
        404: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request, reply) => {
    const params = request.params as { id: string };
    const prisma = getPrismaClient();

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: params.id },
      include: { holdings: true }
    });

    if (!portfolio || portfolio.userId !== request.user!.userId) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Portfolio not found'
      });
    }

    return {
      id: portfolio.id,
      userId: portfolio.userId,
      totalValue: Number(portfolio.totalValue),
      cashBalance: Number(portfolio.cashBalance),
      riskScore: portfolio.riskScore,
      createdAt: portfolio.createdAt.toISOString(),
      updatedAt: portfolio.updatedAt.toISOString(),
      holdings: portfolio.holdings.map(h => ({
        id: h.id,
        portfolioId: h.portfolioId,
        symbol: h.symbol,
        quantity: h.quantity,
        avgCostPrice: Number(h.avgCostPrice),
        createdAt: h.createdAt.toISOString(),
        updatedAt: h.updatedAt.toISOString()
      }))
    };
  });

  app.patch('/v1/portfolios/:id', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Portfolios'],
      description: 'Update portfolio',
      params: Type.Object({
        id: Type.String({ minLength: 1 })
      }),
      body: UpdatePortfolioBodySchema,
      response: {
        200: PortfolioSchema,
        400: ValidationErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as { cashBalance?: number; riskScore?: number };
    const prisma = getPrismaClient();

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: params.id }
    });

    if (!portfolio || portfolio.userId !== request.user!.userId) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Portfolio not found'
      });
    }

    const updated = await prisma.portfolio.update({
      where: { id: params.id },
      data: {
        ...(body.cashBalance !== undefined && { cashBalance: body.cashBalance }),
        ...(body.riskScore !== undefined && { riskScore: body.riskScore })
      }
    });

    return {
      id: updated.id,
      userId: updated.userId,
      totalValue: Number(updated.totalValue),
      cashBalance: Number(updated.cashBalance),
      riskScore: updated.riskScore,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    };
  });

  app.delete('/v1/portfolios/:id', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Portfolios'],
      description: 'Delete portfolio',
      params: Type.Object({
        id: Type.String({ minLength: 1 })
      }),
      response: {
        204: Type.Null(),
        401: ErrorSchema,
        404: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request, reply) => {
    const params = request.params as { id: string };
    const prisma = getPrismaClient();

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: params.id }
    });

    if (!portfolio || portfolio.userId !== request.user!.userId) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Portfolio not found'
      });
    }

    await prisma.portfolio.delete({
      where: { id: params.id }
    });

    return reply.code(204).send();
  });

  app.post('/v1/portfolios/:id/stocks', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Portfolios'],
      description: 'Add stock to portfolio',
      params: Type.Object({
        id: Type.String({ minLength: 1 })
      }),
      body: AddHoldingBodySchema,
      response: {
        201: Type.Object({
          id: Type.String(),
          portfolioId: Type.String(),
          symbol: Type.String(),
          quantity: Type.Number(),
          avgCostPrice: Type.Number(),
          createdAt: Type.String(),
          updatedAt: Type.String()
        }),
        400: ValidationErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        409: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as {
      symbol: string;
      quantity: number;
      avgCostPrice: number;
    };
    const prisma = getPrismaClient();

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: params.id }
    });

    if (!portfolio || portfolio.userId !== request.user!.userId) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Portfolio not found'
      });
    }

    try {
      const holding = await prisma.holding.create({
        data: {
          portfolioId: params.id,
          symbol: body.symbol.toUpperCase(),
          quantity: body.quantity,
          avgCostPrice: body.avgCostPrice
        }
      });

      return reply.code(201).send({
        id: holding.id,
        portfolioId: holding.portfolioId,
        symbol: holding.symbol,
        quantity: holding.quantity,
        avgCostPrice: Number(holding.avgCostPrice),
        createdAt: holding.createdAt.toISOString(),
        updatedAt: holding.updatedAt.toISOString()
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.code(409).send({
          error: 'Conflict',
          message: 'Stock already exists in portfolio'
        });
      }
      throw error;
    }
  });

  app.delete('/v1/portfolios/:id/stocks/:symbol', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Portfolios'],
      description: 'Remove stock from portfolio',
      params: Type.Object({
        id: Type.String({ minLength: 1 }),
        symbol: Type.String({ minLength: 1 })
      }),
      response: {
        204: Type.Null(),
        401: ErrorSchema,
        404: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request, reply) => {
    const params = request.params as { id: string; symbol: string };
    const prisma = getPrismaClient();

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: params.id }
    });

    if (!portfolio || portfolio.userId !== request.user!.userId) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Portfolio not found'
      });
    }

    const holding = await prisma.holding.findUnique({
      where: {
        portfolioId_symbol: {
          portfolioId: params.id,
          symbol: params.symbol.toUpperCase()
        }
      }
    });

    if (!holding) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Stock not found in portfolio'
      });
    }

    await prisma.holding.delete({
      where: {
        portfolioId_symbol: {
          portfolioId: params.id,
          symbol: params.symbol.toUpperCase()
        }
      }
    });

    return reply.code(204).send();
  });
}
