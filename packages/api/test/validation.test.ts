import { describe, it, expect, beforeAll } from 'vitest';
import { buildServer } from '../src/server.js';
import { generateAccessToken } from '../src/auth/utils.js';

describe('Input Validation', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-for-jwt-auth';
  });

  const authHeaders = () => {
    const user = { id: 'test-user', email: 'test@example.com', role: 'user' as const };
    const token = generateAccessToken(user);
    return { authorization: `Bearer ${token}` };
  };

  describe('Symbol validation', () => {
    it('should reject empty symbol', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'GET',
        url: '/v1/signals/latest/',
        headers: authHeaders()
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject symbols with special characters', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'GET',
        url: '/v1/signals/latest/<script>',
        headers: authHeaders()
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Analysis body validation', () => {
    it('should reject empty priceHistory', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'POST',
        url: '/v1/analysis/BBCA',
        headers: {
          ...authHeaders(),
          'content-type': 'application/json'
        },
        payload: JSON.stringify({
          priceHistory: []
        })
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject missing priceHistory', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'POST',
        url: '/v1/analysis/BBCA',
        headers: {
          ...authHeaders(),
          'content-type': 'application/json'
        },
        payload: JSON.stringify({
          news: []
        })
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject invalid price data point', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'POST',
        url: '/v1/analysis/BBCA',
        headers: {
          ...authHeaders(),
          'content-type': 'application/json'
        },
        payload: JSON.stringify({
          priceHistory: [{
            timestamp: '2024-01-01T00:00:00Z',
            open: 'not-a-number',
            high: 100,
            low: 90,
            close: 95,
            volume: 1000
          }]
        })
      });

      expect(response.statusCode).toBe(400);
    });

    it('should accept valid analysis payload', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'POST',
        url: '/v1/analysis/BBCA',
        headers: {
          ...authHeaders(),
          'content-type': 'application/json'
        },
        payload: JSON.stringify({
          priceHistory: [{
            timestamp: '2024-01-01T00:00:00Z',
            open: 100,
            high: 105,
            low: 98,
            close: 103,
            volume: 1000
          }]
        })
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Search query validation', () => {
    it('should reject empty search query', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'GET',
        url: '/v1/stocks/search?q=',
        headers: authHeaders()
      });

      expect([400, 503]).toContain(response.statusCode);
    });

    it('should reject missing search query', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'GET',
        url: '/v1/stocks/search',
        headers: authHeaders()
      });

      expect([400, 503]).toContain(response.statusCode);
    });
  });

  describe('Auth endpoint validation', () => {
    it('should reject registration with short password', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'POST',
        url: '/v1/auth/register',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({
          email: 'test@example.com',
          password: 'short'
        })
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject registration with invalid email', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'POST',
        url: '/v1/auth/register',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({
          email: 'not-an-email',
          password: 'longpassword123'
        })
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject login with missing fields', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'POST',
        url: '/v1/auth/login',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({
          email: 'test@example.com'
        })
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
