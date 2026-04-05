import type { FastifyRequest, FastifyReply, FastifyInstance, FastifySchema } from 'fastify';
import { Type } from '@sinclair/typebox';
import { verifyAccessToken, generateAccessToken, generateRefreshToken, verifyRefreshToken, hashPassword, verifyPassword, generateApiKey, validatePasswordStrength } from './utils.js';
import { hasRole } from './utils.js';
import type { TokenPayload, UserRole, AuthResponse, CreateApiKeyResponse } from './types.js';
import { getPrismaClient } from '../db/index.js';
import bcrypt from 'bcrypt';
import {
  RegisterBodySchema,
  LoginBodySchema,
  RefreshBodySchema,
  CreateApiKeyBodySchema,
  AuthResponseSchema,
  ApiKeyResponseSchema,
  ErrorSchema,
  ValidationErrorSchema
} from './schemas.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

const roleMap: Record<string, 'ADMIN' | 'USER' | 'SERVICE'> = {
  admin: 'ADMIN',
  user: 'USER',
  service: 'SERVICE'
};

const reverseRoleMap: Record<'ADMIN' | 'USER' | 'SERVICE', UserRole> = {
  ADMIN: 'admin',
  USER: 'user',
  SERVICE: 'service'
};

export function authMiddleware(request: FastifyRequest, reply: FastifyReply): void {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Missing Authorization header'
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid Authorization header format. Use: Bearer <token>'
    });
    return;
  }

  try {
    const token = parts[1];
    const payload = verifyAccessToken(token);
    request.user = payload;
  } catch (error) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Invalid or expired token'
    });
    return;
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

export async function apiKeyMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = Array.isArray(request.headers['x-api-key'])
    ? request.headers['x-api-key'][0]
    : request.headers['x-api-key'];

  if (!apiKey) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Missing X-API-Key header'
    });
  }

  const keyUser = await verifyApiKey(apiKey);
  if (!keyUser) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired API key'
    });
  }

  request.user = {
    userId: keyUser.userId,
    email: 'api-key@internal',
    role: keyUser.role
  };
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export function registerAuthRoutes(app: FastifyInstance) {
  app.post('/register', {
    bodyLimit: 10240,
    schema: {
      tags: ['Auth'],
      description: 'Register a new user account',
      body: RegisterBodySchema,
      response: {
        201: AuthResponseSchema,
        400: ValidationErrorSchema,
        409: ErrorSchema
      }
    }
  }, async (request, reply) => {
    const body = request.body as { email: string; password: string; role?: UserRole };
    const prisma = getPrismaClient();

    const passwordValidation = validatePasswordStrength(body.password);
    if (!passwordValidation.valid) {
      return reply.code(400).send({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        error: 'Bad Request',
        message: passwordValidation.errors.join(', ')
      });
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return reply.code(409).send({
        statusCode: 409,
        code: 'USER_EXISTS',
        error: 'Conflict',
        message: 'User with this email already exists'
      });
    }

    const passwordHash = await hashPassword(body.password);
    const dbRole = 'USER';

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        role: dbRole,
      }
    });

    const authUser = { id: user.id, email: user.email, role: reverseRoleMap[user.role] };
    const token = generateAccessToken(authUser);
    const { token: refreshToken, jti } = generateRefreshToken(user.id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { jti, userId: user.id, expiresAt }
    });

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60
    });

    return reply.code(201).send({
      user: { id: user.id, email: user.email, role: reverseRoleMap[user.role] },
      token,
      refreshToken,
    } as AuthResponse);
  });

  app.post('/login', {
    bodyLimit: 10240,
    schema: {
      tags: ['Auth'],
      description: 'Login with email and password',
      body: LoginBodySchema,
      response: {
        200: AuthResponseSchema,
        400: ValidationErrorSchema,
        401: ErrorSchema,
        423: ErrorSchema
      }
    }
  }, async (request, reply) => {
    const body = request.body as { email: string; password: string };
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.passwordHash) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      return reply.code(423).send({
        error: 'Locked',
        message: `Account is locked. Try again in ${Math.ceil(remainingMs / 1000 / 60)} minutes`
      });
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;

      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newFailedAttempts,
            lockedUntil
          }
        });
        return reply.code(423).send({
          error: 'Locked',
          message: `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in 15 minutes`
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: newFailedAttempts }
      });

      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null }
    });

    const authUser = { id: user.id, email: user.email, role: reverseRoleMap[user.role] };
    const token = generateAccessToken(authUser);
    const { token: refreshToken, jti } = generateRefreshToken(user.id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { jti, userId: user.id, expiresAt }
    });

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60
    });

    return reply.send({
      user: { id: user.id, email: user.email, role: reverseRoleMap[user.role] },
      token,
      refreshToken,
    } as AuthResponse);
  });

  app.post('/refresh', {
    bodyLimit: 10240,
    schema: {
      tags: ['Auth'],
      description: 'Refresh access token using refresh token',
      body: RefreshBodySchema,
      response: {
        200: AuthResponseSchema,
        400: ValidationErrorSchema,
        401: ErrorSchema
      }
    }
  }, async (request, reply) => {
    const body = request.body as { refreshToken?: string };
    if (!body?.refreshToken) {
      return reply.code(400).send({
        statusCode: 400,
        code: 'MISSING_REFRESH_TOKEN',
        error: 'Bad Request',
        message: 'refreshToken is required'
      });
    }

    const prisma = getPrismaClient();

    let payload;
    try {
      payload = verifyRefreshToken(body.refreshToken);
    } catch {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token'
      });
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { jti: payload.jti }
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Refresh token has been revoked or expired'
      });
    }

    await prisma.refreshToken.update({
      where: { jti: payload.jti },
      data: { revoked: true }
    });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    const authUser = { id: user.id, email: user.email, role: reverseRoleMap[user.role] };
    const token = generateAccessToken(authUser);
    const { token: newRefreshToken, jti } = generateRefreshToken(user.id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { jti, userId: user.id, expiresAt }
    });

    return reply.send({
      user: { id: user.id, email: user.email, role: reverseRoleMap[user.role] },
      token,
      refreshToken: newRefreshToken,
    } as AuthResponse);
  });

  app.post('/api-keys', {
    preHandler: [authMiddleware],
    bodyLimit: 10240,
    schema: {
      tags: ['Auth'],
      description: 'Create a new API key (admin only)',
      body: CreateApiKeyBodySchema,
      response: {
        201: ApiKeyResponseSchema,
        400: ValidationErrorSchema,
        401: ErrorSchema,
        403: ErrorSchema
      },
      security: [{ bearerAuth: [] }]
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

    const body = request.body as { name: string; role?: UserRole; expiresAt?: string };
    const prisma = getPrismaClient();
    const { rawKey, keyHash } = generateApiKey();

    const dbRole = roleMap[body.role || 'service'] || 'SERVICE';
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    const apiKey = await prisma.apiKey.create({
      data: {
        keyHash,
        userId: request.user.userId,
        name: body.name,
        role: dbRole,
        expiresAt,
      }
    });

    return reply.code(201).send({
      apiKey: {
        id: apiKey.id,
        keyHash: apiKey.keyHash,
        userId: apiKey.userId,
        name: apiKey.name,
        role: reverseRoleMap[apiKey.role],
        createdAt: apiKey.createdAt.toISOString(),
        expiresAt: apiKey.expiresAt?.toISOString(),
      },
      rawKey,
    } as CreateApiKeyResponse);
  });

  app.post('/logout', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Auth'],
      description: 'Logout and revoke refresh token',
      body: RefreshBodySchema,
      response: {
        200: Type.Object({ message: Type.String() }),
        400: ValidationErrorSchema,
        401: ErrorSchema,
        403: ErrorSchema
      },
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const body = request.body as { refreshToken?: string };
    if (!body?.refreshToken) {
      return reply.code(400).send({
        statusCode: 400,
        code: 'MISSING_REFRESH_TOKEN',
        error: 'Bad Request',
        message: 'refreshToken is required'
      });
    }

    const prisma = getPrismaClient();

    try {
      const payload = verifyRefreshToken(body.refreshToken);

      if (payload.userId !== request.user.userId) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Cannot revoke tokens belonging to other users'
        });
      }

      await prisma.refreshToken.updateMany({
        where: {
          jti: payload.jti,
          userId: request.user.userId,
          revoked: false
        },
        data: { revoked: true }
      });

      return reply.send({
        message: 'Successfully logged out'
      });
    } catch {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid refresh token'
      });
    }
  });

  app.delete('/api-keys/:keyId', {
    preHandler: [authMiddleware, requireRole('admin')],
    schema: {
      tags: ['Auth'],
      description: 'Revoke an API key (admin only)',
      params: {
        type: 'object',
        properties: {
          keyId: { type: 'string', format: 'uuid' }
        },
        required: ['keyId']
      },
      response: {
        200: Type.Object({ message: Type.String() }),
        401: ErrorSchema,
        403: ErrorSchema,
        404: ErrorSchema
      },
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    const prisma = getPrismaClient();
    const { keyId } = request.params as { keyId: string };

    const apiKey = await prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!apiKey) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'API key not found'
      });
    }

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { revoked: true }
    });

    return reply.send({
      message: 'API key revoked successfully'
    });
  });
}

async function verifyApiKey(rawKey: string): Promise<{ userId: string; role: UserRole } | null> {
  const prisma = getPrismaClient();

  let apiKeys;
  try {
    apiKeys = await prisma.apiKey.findMany({
      where: { revoked: false }
    });
  } catch {
    return null;
  }

  for (const apiKey of apiKeys) {
    const matches = await bcrypt.compare(rawKey, apiKey.keyHash);
    if (matches) {
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        try {
          await prisma.apiKey.update({
            where: { id: apiKey.id },
            data: { revoked: true }
          });
        } catch {
        }
        return null;
      }

      try {
        await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() }
        });
      } catch {
      }

      return {
        userId: apiKey.userId,
        role: reverseRoleMap[apiKey.role]
      };
    }
  }

  return null;
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
      const apiKey = Array.isArray(request.headers['x-api-key'])
        ? request.headers['x-api-key'][0]
        : request.headers['x-api-key'];

      if (apiKey) {
        let keyUser;
        try {
          keyUser = await verifyApiKey(apiKey);
        } catch {
          return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Invalid or expired API key'
          });
        }
        if (!keyUser) {
          return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Invalid or expired API key'
          });
        }
        request.user = {
          userId: keyUser.userId,
          email: 'api-key@internal',
          role: keyUser.role
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
