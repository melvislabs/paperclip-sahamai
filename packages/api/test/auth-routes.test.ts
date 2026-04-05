import { buildServer } from '../src/server.js';
import { test, describe, expect, beforeAll, afterAll } from 'vitest';

describe('Auth Routes', () => {
  let app: any;

  beforeAll(async () => {
    app = buildServer(() => Date.now());
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /v1/auth/register', () => {
    test('should validate password requirements', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'weak'
        }
      });
      
      expect(response.statusCode).toBe(400);
      const error = response.json();
      expect(error.message).toContain('Password must contain at least one uppercase letter');
    });

    test('should validate email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: {
          email: 'invalid-email',
          password: 'Password123!'
        }
      });
      
      expect(response.statusCode).toBe(400);
    });

    test('should require email field', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: {
          password: 'Password123!'
        }
      });
      
      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /v1/auth/login', () => {
    test('should validate credentials format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'weak'
        }
      });
      
      expect(response.statusCode).toBe(400);
    });

    test('should require both email and password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: 'test@example.com'
        }
      });
      
      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /v1/auth/refresh', () => {
    test('should require refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/refresh',
        payload: {}
      });
      
      expect(response.statusCode).toBe(400);
    });

    test('should validate refresh token format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/refresh',
        payload: {
          refreshToken: 'invalid-token'
        }
      });
      
      expect(response.statusCode).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    test('should apply stricter rate limiting to auth endpoints', async () => {
      const requests = Array(15).fill(null).map(() =>
        app.inject({
          method: 'POST',
          url: '/v1/auth/register',
          payload: {
            email: `test${Math.random()}@example.com`,
            password: 'Password123!'
          }
        })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(res => res.statusCode === 429);
      
      // Should hit rate limit after 10 requests
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
