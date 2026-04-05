import { describe, it, expect, beforeAll } from 'vitest';
import { buildServer } from '../src/server.js';

describe('watchlist', () => {
  const server = buildServer();

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-for-jwt-auth';
    process.env.NODE_ENV = 'test';
  });

  it('returns 401 without auth', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/watchlist'
    });
    expect(response.statusCode).toBe(401);
  });
});
