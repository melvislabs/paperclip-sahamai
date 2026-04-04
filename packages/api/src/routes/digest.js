import { Type } from '@sinclair/typebox';
import { getPrismaClient } from '../db/index.js';
import { authMiddleware } from '../auth/middleware.js';
import { ErrorSchema, ValidationErrorSchema } from '../auth/schemas.js';
const DigestPrefSchema = Type.Object({
    id: Type.String(),
    userId: Type.String(),
    enabled: Type.Boolean(),
    deliveryTime: Type.String(),
    timezone: Type.String(),
    includeAlerts: Type.Boolean(),
    includeAnalysis: Type.Boolean(),
    includeMarketSummary: Type.Boolean(),
    createdAt: Type.String(),
    updatedAt: Type.String()
});
const DigestPrefResponseSchema = Type.Object({
    data: DigestPrefSchema
});
const UpdateDigestPrefBodySchema = Type.Object({
    enabled: Type.Optional(Type.Boolean()),
    deliveryTime: Type.Optional(Type.String({ pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' })),
    timezone: Type.Optional(Type.String()),
    includeAlerts: Type.Optional(Type.Boolean()),
    includeAnalysis: Type.Optional(Type.Boolean()),
    includeMarketSummary: Type.Optional(Type.Boolean())
});
export function registerDigestRoutes(app) {
    app.get('/v1/settings/digest', {
        preHandler: [authMiddleware],
        schema: {
            tags: ['Digest'],
            description: 'Get digest email preferences',
            response: {
                200: DigestPrefResponseSchema,
                401: ErrorSchema
            },
            security: [{ bearerAuth: [] }, { apiKey: [] }]
        }
    }, async (request) => {
        const userId = request.user.userId;
        const prisma = getPrismaClient();
        let prefs = await prisma.digestPreference.findUnique({ where: { userId } });
        if (!prefs) {
            prefs = await prisma.digestPreference.create({
                data: {
                    userId,
                    enabled: false,
                    deliveryTime: '08:00',
                    timezone: 'Asia/Jakarta',
                    includeAlerts: true,
                    includeAnalysis: true,
                    includeMarketSummary: true,
                }
            });
        }
        return {
            data: {
                ...prefs,
                createdAt: prefs.createdAt.toISOString(),
                updatedAt: prefs.updatedAt.toISOString(),
            }
        };
    });
    app.patch('/v1/settings/digest', {
        preHandler: [authMiddleware],
        schema: {
            tags: ['Digest'],
            description: 'Update digest email preferences',
            body: UpdateDigestPrefBodySchema,
            response: {
                200: DigestPrefResponseSchema,
                400: ValidationErrorSchema,
                401: ErrorSchema
            },
            security: [{ bearerAuth: [] }, { apiKey: [] }]
        }
    }, async (request) => {
        const userId = request.user.userId;
        const body = request.body;
        const prisma = getPrismaClient();
        let prefs = await prisma.digestPreference.findUnique({ where: { userId } });
        if (!prefs) {
            prefs = await prisma.digestPreference.create({
                data: {
                    userId,
                    enabled: body.enabled ?? false,
                    deliveryTime: body.deliveryTime ?? '08:00',
                    timezone: body.timezone ?? 'Asia/Jakarta',
                    includeAlerts: body.includeAlerts ?? true,
                    includeAnalysis: body.includeAnalysis ?? true,
                    includeMarketSummary: body.includeMarketSummary ?? true,
                }
            });
        }
        else {
            prefs = await prisma.digestPreference.update({
                where: { userId },
                data: {
                    ...(body.enabled !== undefined && { enabled: body.enabled }),
                    ...(body.deliveryTime && { deliveryTime: body.deliveryTime }),
                    ...(body.timezone && { timezone: body.timezone }),
                    ...(body.includeAlerts !== undefined && { includeAlerts: body.includeAlerts }),
                    ...(body.includeAnalysis !== undefined && { includeAnalysis: body.includeAnalysis }),
                    ...(body.includeMarketSummary !== undefined && { includeMarketSummary: body.includeMarketSummary }),
                }
            });
        }
        return {
            data: {
                ...prefs,
                createdAt: prefs.createdAt.toISOString(),
                updatedAt: prefs.updatedAt.toISOString(),
            }
        };
    });
}
