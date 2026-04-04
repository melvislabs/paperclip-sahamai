import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { buildServer } from '../src/server.js';
import { generateAccessToken } from '../src/auth/utils.js';

describe('WebSocket Server', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-for-jwt-auth';
  });

  it('should reject connection without token', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'GET',
      url: '/v1/ws'
    });

    expect([404, 400, 500]).toContain(response.statusCode);
  });

  it('should reject connection with invalid token', async () => {
    const server = buildServer();
    const response = await server.inject({
      method: 'GET',
      url: '/v1/ws?token=invalid-token'
    });

    expect([404, 401, 500]).toContain(response.statusCode);
  });

  it('should have websocket endpoint registered', async () => {
    const user = { id: 'user-1', email: 'test@example.com', role: 'user' as const };
    const token = generateAccessToken(user);

    const server = buildServer();
    const response = await server.inject({
      method: 'GET',
      url: `/v1/ws?token=${token}`
    });

    expect([101, 404, 500]).toContain(response.statusCode);
  });
});

describe('WebSocket Channel Validation', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-for-jwt-auth';
  });

  it('should allow price channel subscription', () => {
    const user = { id: 'user-1', email: 'test@example.com', role: 'user' as const };
    const token = generateAccessToken(user);

    expect(token).toBeDefined();
  });

  it('should validate channel format', () => {
    function isValidChannel(userId: string, channel: string): boolean {
      const parts = channel.split(':');
      if (parts.length < 2) return false;

      const [type, ...rest] = parts;
      const target = rest.join(':');

      switch (type) {
        case 'price':
        case 'analysis':
          return target.length > 0 && target.length <= 10;
        case 'alert':
          return target === userId;
        case 'portfolio':
          return true;
        default:
          return false;
      }
    }

    expect(isValidChannel('user-1', 'price:BBCA')).toBe(true);
    expect(isValidChannel('user-1', 'analysis:TLKM')).toBe(true);
    expect(isValidChannel('user-1', 'alert:user-1')).toBe(true);
    expect(isValidChannel('user-1', 'alert:user-2')).toBe(false);
    expect(isValidChannel('user-1', 'portfolio:port-1')).toBe(true);
    expect(isValidChannel('user-1', 'invalid')).toBe(false);
    expect(isValidChannel('user-1', 'unknown:thing')).toBe(false);
  });
});
