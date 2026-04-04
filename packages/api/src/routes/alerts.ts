import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from '@sinclair/typebox';
import { AlertManager } from '../services/alerts/index.js';
import {
  PriceAlertSchema,
  CreateAlertBodySchema,
  UpdateAlertBodySchema,
  AlertListResponseSchema,
  AlertHistoryResponseSchema,
  ErrorSchema,
  ValidationErrorSchema
} from '../auth/schemas.js';
import { authMiddleware } from '../auth/middleware.js';

const alertManager = new AlertManager();

export function registerAlertRoutes(app: FastifyInstance) {
  app.post('/v1/alerts', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Alerts'],
      description: 'Create a new price alert',
      body: CreateAlertBodySchema,
      response: {
        201: PriceAlertSchema,
        400: ValidationErrorSchema,
        401: ErrorSchema,
        429: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request, reply) => {
    const body = request.body as {
      symbol: string;
      condition: 'ABOVE' | 'BELOW' | 'PERCENT_CHANGE';
      targetPrice: number;
      alertType?: 'ONE_TIME' | 'RECURRING' | 'EXPIRING';
      expiresAt?: string;
      notificationChannels?: Array<'in_app' | 'email' | 'push'>;
    };

    const alert = await alertManager.create({
      userId: request.user!.userId,
      symbol: body.symbol,
      condition: body.condition,
      targetPrice: body.targetPrice,
      alertType: body.alertType,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      notificationChannels: body.notificationChannels,
    });

    return reply.code(201).send(alert);
  });

  app.get('/v1/alerts', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Alerts'],
      description: 'List all price alerts for the authenticated user',
      response: {
        200: AlertListResponseSchema,
        401: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request) => {
    const alerts = await alertManager.listByUser(request.user!.userId);
    return { count: alerts.length, data: alerts };
  });

  app.get('/v1/alerts/:id', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Alerts'],
      description: 'Get a specific price alert',
      params: Type.Object({
        id: Type.String({ minLength: 1 })
      }),
      response: {
        200: PriceAlertSchema,
        401: ErrorSchema,
        404: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request, reply) => {
    const params = request.params as { id: string };
    const alert = await alertManager.getById(params.id, request.user!.userId);
    if (!alert) {
      return reply.code(404).send({ error: 'Not Found', message: 'Alert not found' });
    }
    return alert;
  });

  app.patch('/v1/alerts/:id', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Alerts'],
      description: 'Update a price alert',
      params: Type.Object({
        id: Type.String({ minLength: 1 })
      }),
      body: UpdateAlertBodySchema,
      response: {
        200: PriceAlertSchema,
        400: ValidationErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as {
      targetPrice?: number;
      isActive?: boolean;
      notificationChannels?: Array<'in_app' | 'email' | 'push'>;
      expiresAt?: string;
    };

    const alert = await alertManager.update(params.id, request.user!.userId, {
      targetPrice: body.targetPrice,
      isActive: body.isActive,
      notificationChannels: body.notificationChannels,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });

    return alert;
  });

  app.delete('/v1/alerts/:id', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Alerts'],
      description: 'Delete a price alert',
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
    await alertManager.delete(params.id, request.user!.userId);
    return reply.code(204).send();
  });

  app.get('/v1/alerts/history', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Alerts'],
      description: 'Get triggered alert history for the authenticated user',
      response: {
        200: AlertHistoryResponseSchema,
        401: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request) => {
    const history = await alertManager.getHistory(request.user!.userId);
    return { count: history.length, data: history };
  });
}
