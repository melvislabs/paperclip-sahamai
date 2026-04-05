import { buildServer } from '../src/server.js';
import { test, describe, expect, beforeAll, afterAll } from 'vitest';

describe('API Routes Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = buildServer(() => Date.now());
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Health Endpoint', () => {
    test('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });
      
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        status: 'ok',
        service: 'paperclip-sahamai'
      });
    });
  });

  describe('Market Overview Endpoint', () => {
    test('should return market overview data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/market/overview'
      });
      
      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data).toHaveProperty('indices');
      expect(data).toHaveProperty('topGainers');
      expect(data).toHaveProperty('topLosers');
      expect(data).toHaveProperty('marketStatus');
      expect(data.indices).toHaveLength(3);
      expect(data.topGainers).toHaveLength(5);
      expect(data.topLosers).toHaveLength(5);
    });
  });

  describe('Protected Routes Without Auth', () => {
    test('should return 401 for signals endpoint without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/signals/latest'
      });
      
      expect(response.statusCode).toBe(401);
    });

    test('should return 401 for analysis endpoint without auth', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/analysis/BBCA',
        payload: {
          priceHistory: [],
          news: []
        }
      });
      
      expect(response.statusCode).toBe(401);
    });

    test('should return 401 for stocks endpoint without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/stocks/BBCA/quote'
      });
      
      expect(response.statusCode).toBe(401);
    });

    test('should return 401 for alerts endpoint without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/alerts'
      });
      
      expect(response.statusCode).toBe(401);
    });

    test('should return 401 for portfolios endpoint without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/portfolios'
      });
      
      expect(response.statusCode).toBe(401);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent endpoint', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/non-existent'
      });
      
      expect(response.statusCode).toBe(404);
    });

    test('should handle invalid JSON payload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        headers: {
          'Content-Type': 'application/json'
        },
        payload: 'invalid json'
      });
      
      expect(response.statusCode).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    test('should allow requests within rate limit', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });
      
      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('CORS Headers', () => {
    test('should include CORS headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'Origin': 'http://localhost:5173'
        }
      });
      
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});
