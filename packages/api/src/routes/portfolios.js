import { Type } from '@sinclair/typebox';
import { authMiddleware } from '../auth/middleware.js';
import { getPrismaClient } from '../db/index.js';
import { PortfolioSchema, PortfolioWithHoldingsSchema, CreatePortfolioBodySchema, UpdatePortfolioBodySchema, AddHoldingBodySchema, PortfolioListResponseSchema, ErrorSchema, ValidationErrorSchema } from '../auth/schemas.js';
export function registerPortfolioRoutes(app) {
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
            where: { userId: request.user.userId },
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
        const body = request.body;
        const portfolio = await prisma.portfolio.create({
            data: {
                userId: request.user.userId,
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
        const params = request.params;
        const prisma = getPrismaClient();
        const portfolio = await prisma.portfolio.findUnique({
            where: { id: params.id },
            include: { holdings: true }
        });
        if (!portfolio || portfolio.userId !== request.user.userId) {
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
        const params = request.params;
        const body = request.body;
        const prisma = getPrismaClient();
        const portfolio = await prisma.portfolio.findUnique({
            where: { id: params.id }
        });
        if (!portfolio || portfolio.userId !== request.user.userId) {
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
        const params = request.params;
        const prisma = getPrismaClient();
        const portfolio = await prisma.portfolio.findUnique({
            where: { id: params.id }
        });
        if (!portfolio || portfolio.userId !== request.user.userId) {
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
        const params = request.params;
        const body = request.body;
        const prisma = getPrismaClient();
        const portfolio = await prisma.portfolio.findUnique({
            where: { id: params.id }
        });
        if (!portfolio || portfolio.userId !== request.user.userId) {
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
        }
        catch (error) {
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
        const params = request.params;
        const prisma = getPrismaClient();
        const portfolio = await prisma.portfolio.findUnique({
            where: { id: params.id }
        });
        if (!portfolio || portfolio.userId !== request.user.userId) {
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
