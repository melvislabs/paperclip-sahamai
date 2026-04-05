import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { TokenPayload, RefreshTokenPayload, AuthUser, UserRole } from './types.js';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(user: AuthUser): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, getSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(userId: string): { token: string; jti: string } {
  const jti = randomUUID();
  const payload: RefreshTokenPayload = { userId, jti };
  const token = jwt.sign(payload, getSecret(), { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { token, jti };
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, getSecret()) as TokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, getSecret()) as RefreshTokenPayload;
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    service: 1,
    user: 2,
    admin: 3,
  };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function generateApiKey(): { rawKey: string; keyHash: string } {
  const rawKey = `sk_${randomUUID().replace(/-/g, '')}`;
  const keyHash = bcrypt.hashSync(rawKey, BCRYPT_ROUNDS);
  return { rawKey, keyHash };
}

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be at most 128 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export async function verifyApiKey(apiKey: string): Promise<{ userId: string; role: UserRole } | null> {
  const { getPrismaClient } = await import('../db/index.js');
  const prisma = getPrismaClient();
  
  // Find API key with user relation
  const keyRecord = await prisma.apiKey.findFirst({
    where: {
      keyHash: { contains: apiKey }, // This is a placeholder - real implementation would use bcrypt.compare
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: {
      user: true
    }
  });

  if (!keyRecord || !keyRecord.user) {
    return null;
  }

  return {
    userId: keyRecord.userId,
    role: keyRecord.user.role as UserRole
  };
}
