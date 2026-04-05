import { OAuth2Client } from 'google-auth-library';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { generateAccessToken, generateRefreshToken, hashPassword } from '../utils.js';
import { authMiddleware } from '../middleware.js';
import type { UserRole } from '../types.js';
import { getPrismaClient } from '../../db/index.js';
import { randomBytes } from 'crypto';

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

function getGoogleClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/v1/auth/google/callback';

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required');
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

export function generateAuthUrl(state?: string): string {
  const client = getGoogleClient();
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: state || randomBytes(16).toString('hex'),
    prompt: 'consent'
  });
}

export async function verifyGoogleToken(code: string) {
  const client = getGoogleClient();
  const { tokens } = await client.getToken(code);
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid Google ID token payload');
  }

  return {
    googleId: payload.sub,
    email: payload.email!,
    name: payload.name,
    picture: payload.picture,
    emailVerified: payload.email_verified
  };
}

export function registerGoogleOAuthRoutes(app: FastifyInstance) {
  app.get('/google', {
    schema: {
      tags: ['Auth'],
      description: 'Initiate Google OAuth sign-in flow',
      querystring: {
        type: 'object',
        properties: {
          state: { type: 'string' },
          redirect: { type: 'string' }
        }
      },
      response: {
        302: { type: 'null' }
      }
    }
  }, async (request, reply) => {
    const query = request.query as { state?: string; redirect?: string };
    const authUrl = generateAuthUrl(query.state);

    if (query.redirect) {
      reply.setCookie('oauth_redirect', query.redirect, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 600
      });
    }

    return reply.redirect(authUrl);
  });

  app.get('/google/callback', {
    schema: {
      tags: ['Auth'],
      description: 'Google OAuth callback handler',
      querystring: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          state: { type: 'string' },
          error: { type: 'string' }
        },
        required: ['code']
      }
    }
  }, async (request, reply) => {
    const query = request.query as { code?: string; state?: string; error?: string };

    if (query.error) {
      return reply.code(400).send({
        error: 'OAuth Error',
        message: query.error
      });
    }

    if (!query.code) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Authorization code is required'
      });
    }

    const prisma = getPrismaClient();

    let googleUser;
    try {
      googleUser = await verifyGoogleToken(query.code);
    } catch (error) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid Google authorization code'
      });
    }

    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.googleId }
    });

    if (!user) {
      const existingUser = await prisma.user.findUnique({
        where: { email: googleUser.email }
      });

      if (existingUser) {
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            googleId: googleUser.googleId,
            name: existingUser.name || googleUser.name,
            avatarUrl: existingUser.avatarUrl || googleUser.picture
          }
        });
      } else {
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            googleId: googleUser.googleId,
            name: googleUser.name,
            avatarUrl: googleUser.picture,
            role: 'USER'
          }
        });
      }
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return reply.code(423).send({
        error: 'Locked',
        message: 'Account is locked'
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null }
    });

    const authUser = { id: user.id, email: user.email, role: reverseRoleMap[user.role as 'ADMIN' | 'USER' | 'SERVICE'] };
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

    const redirectUrl = request.cookies?.oauth_redirect || '/';
    reply.clearCookie('oauth_redirect', { path: '/' });

    return reply.send({
      user: { id: user.id, email: user.email, name: user.name, role: reverseRoleMap[user.role as 'ADMIN' | 'USER' | 'SERVICE'] },
      token,
      refreshToken,
      redirectUrl
    });
  });

  app.post('/link/google', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Auth'],
      description: 'Link Google account to existing user',
      body: {
        type: 'object',
        properties: {
          code: { type: 'string' }
        },
        required: ['code']
      }
    }
  }, async (request, reply) => {
    const body = request.body as { code: string };
    const user = (request as any).user;

    if (!user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    let googleUser;
    try {
      googleUser = await verifyGoogleToken(body.code);
    } catch {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid Google authorization code'
      });
    }

    const prisma = getPrismaClient();

    const existingGoogleUser = await prisma.user.findUnique({
      where: { googleId: googleUser.googleId }
    });

    if (existingGoogleUser && existingGoogleUser.id !== user.userId) {
      return reply.code(409).send({
        error: 'Conflict',
        message: 'This Google account is already linked to another user'
      });
    }

    await prisma.user.update({
      where: { id: user.userId },
      data: {
        googleId: googleUser.googleId,
        name: googleUser.name,
        avatarUrl: googleUser.picture
      }
    });

    return reply.send({
      message: 'Google account linked successfully',
      googleId: googleUser.googleId
    });
  });

  app.delete('/unlink/google', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Auth'],
      description: 'Unlink Google account from user',
      response: {
        200: { type: 'object', properties: { message: { type: 'string' } } },
        400: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
        401: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } }
      }
    }
  }, async (request, reply) => {
    const user = (request as any).user;

    if (!user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const prisma = getPrismaClient();

    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId }
    });

    if (!currentUser?.googleId) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'No Google account linked'
      });
    }

    if (!currentUser.passwordHash) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Cannot unlink Google account without a password set. Set a password first.'
      });
    }

    await prisma.user.update({
      where: { id: user.userId },
      data: { googleId: null }
    });

    return reply.send({
      message: 'Google account unlinked successfully'
    });
  });
}
