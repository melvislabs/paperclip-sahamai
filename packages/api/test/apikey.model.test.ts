import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPrismaClient } from '../src/db/index.js';
const prisma = getPrismaClient();
import { hashPassword } from '../src/auth/utils.js';

describe('ApiKey Model', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test-apikey@example.com',
        passwordHash: await hashPassword('TestPassword123!'),
        name: 'Test User',
        role: 'USER',
      },
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.apiKey.deleteMany({
      where: {
        userId: testUserId,
      },
    });
    await prisma.user.delete({
      where: {
        id: testUserId,
      },
    });
  });

  describe('create', () => {
    it('should create an API key with hash', async () => {
      const apiKeyData = {
        keyHash: '$2b$12$hashedkeyexample123456789012',
        name: 'Test API Key',
        role: 'USER',
        userId: testUserId,
      };

      const apiKey = await prisma.apiKey.create({
        data: apiKeyData,
      });

      expect(apiKey).toBeDefined();
      expect(apiKey.id).toBeDefined();
      expect(apiKey.keyHash).toBe(apiKeyData.keyHash);
      expect(apiKey.name).toBe(apiKeyData.name);
      expect(apiKey.role).toBe(apiKeyData.role);
      expect(apiKey.userId).toBe(apiKeyData.userId);
      expect(apiKey.createdAt).toBeDefined();
      expect(apiKey.revoked).toBe(false);
      expect(apiKey.expiresAt).toBeNull();
      expect(apiKey.lastUsedAt).toBeNull();
    });

    it('should create an API key with expiration date', async () => {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      const apiKeyData = {
        keyHash: '$2b$12$hashedkeyexample123456789012',
        name: 'Expiring API Key',
        role: 'USER',
        expiresAt,
        userId: testUserId,
      };

      const apiKey = await prisma.apiKey.create({
        data: apiKeyData,
      });

      expect(apiKey).toBeDefined();
      expect(apiKey.expiresAt).toBeDefined();
      expect(new Date(apiKey.expiresAt).getTime()).toBe(expiresAt.getTime());
    });
  });

  describe('findUnique', () => {
    it('should find an API key by ID', async () => {
      const apiKeyData = {
        keyHash: '$2b$12$hashedkeyexample123456789012',
        name: 'Findable API Key',
        role: 'USER',
        userId: testUserId,
      };

      const createdApiKey = await prisma.apiKey.create({
        data: apiKeyData,
      });

      const foundApiKey = await prisma.apiKey.findUnique({
        where: { id: createdApiKey.id },
      });

      expect(foundApiKey).toBeDefined();
      expect(foundApiKey?.id).toBe(createdApiKey.id);
      expect(foundApiKey?.name).toBe(apiKeyData.name);
    });
  });

  describe('findMany', () => {
    it('should find multiple API keys for a user', async () => {
      const apiKeyData1 = {
        keyHash: '$2b$12$hashedkeyexample123456789012',
        name: 'API Key 1',
        role: 'USER',
        userId: testUserId,
      };

      const apiKeyData2 = {
        keyHash: '$2b$12$hashedkeyexample123456789013',
        name: 'API Key 2',
        role: 'USER',
        userId: testUserId,
      };

      await prisma.apiKey.create({ data: apiKeyData1 });
      await prisma.apiKey.create({ data: apiKeyData2 });

      const apiKeys = await prisma.apiKey.findMany({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
      });

      expect(apiKeys).toHaveLength(2);
      expect(apiKeys[0].name).toBe('API Key 2'); // Most recent first
      expect(apiKeys[1].name).toBe('API Key 1');
    });
  });

  describe('update', () => {
    it('should update an API key', async () => {
      const apiKeyData = {
        keyHash: '$2b$12$hashedkeyexample123456789012',
        name: 'Original Name',
        role: 'USER',
        userId: testUserId,
      };

      const apiKey = await prisma.apiKey.create({
        data: apiKeyData,
      });

      const updatedApiKey = await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: {
          name: 'Updated Name',
          role: 'ADMIN',
        },
      });

      expect(updatedApiKey.name).toBe('Updated Name');
      expect(updatedApiKey.role).toBe('ADMIN');
      expect(updatedApiKey.keyHash).toBe(apiKeyData.keyHash); // Unchanged
    });

    it('should revoke an API key', async () => {
      const apiKeyData = {
        keyHash: '$2b$12$hashedkeyexample123456789012',
        name: 'Revocable API Key',
        role: 'USER',
        userId: testUserId,
      };

      const apiKey = await prisma.apiKey.create({
        data: apiKeyData,
      });

      const revokedApiKey = await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: {
          revoked: true,
        },
      });

      expect(revokedApiKey.revoked).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete an API key', async () => {
      const apiKeyData = {
        keyHash: '$2b$12$hashedkeyexample123456789012',
        name: 'Deletable API Key',
        role: 'USER',
        userId: testUserId,
      };

      const apiKey = await prisma.apiKey.create({
        data: apiKeyData,
      });

      await prisma.apiKey.delete({
        where: { id: apiKey.id },
      });

      const deletedApiKey = await prisma.apiKey.findUnique({
        where: { id: apiKey.id },
      });

      expect(deletedApiKey).toBeNull();
    });
  });

  describe('relationships', () => {
    it('should include user data when requested', async () => {
      const apiKeyData = {
        keyHash: '$2b$12$hashedkeyexample123456789012',
        name: 'Relational API Key',
        role: 'USER',
        userId: testUserId,
      };

      const apiKey = await prisma.apiKey.create({
        data: apiKeyData,
      });

      const apiKeyWithUser = await prisma.apiKey.findUnique({
        where: { id: apiKey.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      });

      expect(apiKeyWithUser).toBeDefined();
      expect(apiKeyWithUser?.user).toBeDefined();
      expect(apiKeyWithUser?.user.id).toBe(testUserId);
      expect(apiKeyWithUser?.user.email).toBe('test-apikey@example.com');
      expect(apiKeyWithUser?.user.name).toBe('Test User');
      expect(apiKeyWithUser?.user.role).toBe('USER');
    });
  });
});