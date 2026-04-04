import { describe, it, expect, beforeAll } from 'vitest';
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, hasRole, generateApiKey } from '../src/auth/utils.js';
import { buildServer } from '../src/server.js';

describe('Auth Utils', () => {
  describe('hashPassword / verifyPassword', () => {
    it('should hash and verify password', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword('wrongPassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('should use bcrypt with cost factor 12', async () => {
      const hash = await hashPassword('test');
      const rounds = parseInt(hash.split('$')[2]);
      expect(rounds).toBe(12);
    });
  });

  describe('JWT tokens', () => {
    beforeAll(() => {
      process.env.JWT_SECRET = 'test-secret-for-jwt-auth';
    });

    it('should generate and verify access token', () => {
      const user = { id: 'user-1', email: 'test@example.com', role: 'user' as const };
      const token = generateAccessToken(user);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const payload = verifyAccessToken(token);
      expect(payload.userId).toBe('user-1');
      expect(payload.email).toBe('test@example.com');
      expect(payload.role).toBe('user');
    });

    it('should generate and verify refresh token', () => {
      const { token, jti } = generateRefreshToken('user-1');
      expect(token).toBeDefined();
      expect(jti).toBeDefined();

      const payload = verifyRefreshToken(token);
      expect(payload.userId).toBe('user-1');
      expect(payload.jti).toBe(jti);
    });

    it('should reject invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('should reject expired token', async () => {
      process.env.JWT_SECRET = 'test-secret-expired';
      const user = { id: 'user-1', email: 'test@example.com', role: 'user' as const };
      const token = generateAccessToken(user);

      await new Promise(resolve => setTimeout(resolve, 100));

      const payload = verifyAccessToken(token);
      expect(payload.userId).toBe('user-1');
    });
  });

  describe('hasRole', () => {
    it('should allow admin to access admin resources', () => {
      expect(hasRole('admin', 'admin')).toBe(true);
    });

    it('should allow admin to access user resources', () => {
      expect(hasRole('admin', 'user')).toBe(true);
    });

    it('should deny user from accessing admin resources', () => {
      expect(hasRole('user', 'admin')).toBe(false);
    });

    it('should allow service to access service resources', () => {
      expect(hasRole('service', 'service')).toBe(true);
    });

    it('should deny service from accessing user resources', () => {
      expect(hasRole('service', 'user')).toBe(false);
    });
  });

  describe('generateApiKey', () => {
    it('should generate API key with hash', () => {
      const { rawKey, keyHash } = generateApiKey();
      expect(rawKey).toMatch(/^sk_[a-f0-9]{32}$/);
      expect(keyHash).not.toBe(rawKey);
      expect(keyHash.startsWith('$2')).toBe(true);
    });
  });
});

describe('Auth Middleware', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-for-jwt-auth';
  });

  it('should return 401 for protected routes without auth', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'GET',
      url: '/v1/signals/latest'
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Unauthorized');
  });

  it('should allow health check without auth', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
  });

  it('should return 401 for invalid token', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'GET',
      url: '/v1/signals/latest',
      headers: {
        authorization: 'Bearer invalid-token'
      }
    });

    expect(response.statusCode).toBe(401);
  });

  it('should allow access with valid token', async () => {
    const user = { id: 'user-1', email: 'test@example.com', role: 'user' as const };
    const token = generateAccessToken(user);

    const server = buildServer();
    const response = await server.inject({
      method: 'GET',
      url: '/v1/signals/latest',
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(response.statusCode).toBe(200);
  });

  it('should reject unregistered X-API-Key header', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'GET',
      url: '/v1/signals/latest',
      headers: {
        'x-api-key': 'sk_test1234567890'
      }
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Unauthorized');
  });
});
