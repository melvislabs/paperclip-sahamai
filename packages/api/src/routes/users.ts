import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../auth/middleware.js';
import { getPrismaClient } from '../db/index.js';
import {
  UserProfileSchema,
  UpdateProfileBodySchema,
  ErrorSchema,
  ValidationErrorSchema
} from '../auth/schemas.js';

export function registerUserRoutes(app: FastifyInstance) {
  app.get('/v1/users/me', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Users'],
      description: 'Get current user profile',
      response: {
        200: UserProfileSchema,
        401: ErrorSchema,
        404: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId }
    });

    if (!user) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.toLowerCase(),
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  });

  app.patch('/v1/users/me', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Users'],
      description: 'Update current user profile',
      body: UpdateProfileBodySchema,
      response: {
        200: UserProfileSchema,
        400: ValidationErrorSchema,
        401: ErrorSchema
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }]
    }
  }, async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const body = request.body as {
      name?: string;
      avatarUrl?: string;
    };

    const prisma = getPrismaClient();
    const user = await prisma.user.update({
      where: { id: request.user.userId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl })
      }
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.toLowerCase(),
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  });
}
