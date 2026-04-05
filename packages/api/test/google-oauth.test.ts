import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateAuthUrl, verifyGoogleToken } from '../src/auth/oauth/google.js';
import { buildServer } from '../src/server.js';

describe('Google OAuth', () => {
  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/v1/auth/google/callback';
    process.env.JWT_SECRET = 'test-secret-for-jwt-auth';
  });

  describe('generateAuthUrl', () => {
    it('should generate a valid Google OAuth URL', () => {
      const url = generateAuthUrl('test-state');
      expect(url).toContain('accounts.google.com');
      expect(url).toContain('test-state');
      expect(url).toContain('userinfo.email');
      expect(url).toContain('userinfo.profile');
    });

    it('should generate URL without state', () => {
      const url = generateAuthUrl();
      expect(url).toContain('accounts.google.com');
    });
  });

  describe('verifyGoogleToken', () => {
    it('should throw error with invalid code', async () => {
      await expect(verifyGoogleToken('invalid-code')).rejects.toThrow();
    });
  });

  describe('OAuth endpoints', () => {
    it('should redirect to Google OAuth on GET /v1/auth/google', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'GET',
        url: '/v1/auth/google'
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toContain('accounts.google.com');
    });

    it('should return 400 on callback without code', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'GET',
        url: '/v1/auth/google/callback'
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 on callback with error', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'GET',
        url: '/v1/auth/google/callback?error=access_denied'
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
    });

    it('should return 401 on callback with invalid code', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'GET',
        url: '/v1/auth/google/callback?code=invalid-code'
      });

      expect(response.statusCode).toBe(401);
    });

    it('should require auth for link endpoint', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'POST',
        url: '/v1/auth/link/google',
        payload: { code: 'test-code' }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should require auth for unlink endpoint', async () => {
      const server = buildServer();
      const response = await server.inject({
        method: 'DELETE',
        url: '/v1/auth/unlink/google'
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
