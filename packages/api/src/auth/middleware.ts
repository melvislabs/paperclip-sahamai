import type { FastifyRequest, FastifyReply, FastifyInstance, FastifySchema } from 'fastify';
import { verifyAccessToken } from './utils.js';
import { hasRole } from './utils.js';
import type { TokenPayload, UserRole } from './types.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

export function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Missing Authorization header'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid Authorization header format. Use: Bearer <token>'
    });
  }

  try {
    const token = parts[1];
    const payload = verifyAccessToken(token);
    request.user = payload;
  } catch (error) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Invalid or expired token'
    });
  }
}

export function requireRole(requiredRole: UserRole) {
  return function roleMiddleware(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!hasRole(request.user.role, requiredRole)) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: `Insufficient permissions. Required role: ${requiredRole}`
      });
    }
  };
}

export function apiKeyMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers['x-api-key'];
  if (!apiKey) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Missing X-API-Key header'
    });
  }

  request.user = {
    userId: 'api-key-service',
    email: 'service@internal',
    role: 'service'
  };
}

export function registerAuthRoutes(app: FastifyInstance) {
  app.post('/v1/auth/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          role: { type: 'string', enum: ['admin', 'user', 'service'] }
        }
      }
    }
  }, async (request, reply) => {
    const body = request.body as { email: string; password: string; role?: UserRole };

    return reply.code(501).send({
      error: 'Not Implemented',
      message: 'User registration requires database. Set up Prisma migrations first.'
    });
  });

  app.post('/v1/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const body = request.body as { email: string; password: string };

    return reply.code(501).send({
      error: 'Not Implemented',
      message: 'User login requires database. Set up Prisma migrations first.'
    });
  });

  app.post('/v1/auth/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request, reply) => {
    const body = request.body as { refreshToken?: string };
    if (!body?.refreshToken) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'refreshToken is required'
      });
    }

    return reply.code(501).send({
      error: 'Not Implemented',
      message: 'Token refresh requires database for refresh token tracking.'
    });
  });

  app.post('/v1/auth/api-keys', {
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          role: { type: 'string', enum: ['admin', 'user', 'service'] },
          expiresAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  }, async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (request.user.role !== 'admin') {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Only admins can create API keys'
      });
    }

    return reply.code(501).send({
      error: 'Not Implemented',
      message: 'API key management requires database.'
    });
  });
}

export function protectRoutes(app: FastifyInstance, routes: string[], options?: { skipAuth?: string[] }) {
  const skipAuth = options?.skipAuth || ['/health'];

  app.addHook('preHandler', async (request, reply) => {
    const url = request.url.split('?')[0];

    if (skipAuth.includes(url)) {
      return;
    }

    if (routes.some(route => url.startsWith(route))) {
      const authHeader = request.headers.authorization;
      const apiKey = request.headers['x-api-key'];

      if (apiKey) {
        request.user = {
          userId: 'api-key-service',
          email: 'service@internal',
          role: 'service'
        };
        return;
      }

      if (!authHeader) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Missing Authorization header. Use: Bearer <token> or X-API-Key: <key>'
        });
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid Authorization header format'
        });
      }

      try {
        const payload = verifyAccessToken(parts[1]);
        request.user = payload;
      } catch (error) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid or expired token'
        });
      }
    }
  });
}
