import { AlertManager } from '../src/services/alerts/index.js';
import { test, describe, expect, beforeEach, vi } from 'vitest';

describe('Alert Services', () => {
  let alertManager: AlertManager;

  beforeEach(() => {
    alertManager = new AlertManager();
  });

  describe('AlertManager', () => {
    test('should be instantiated correctly', () => {
      expect(alertManager).toBeInstanceOf(AlertManager);
    });

    test('should create alert with valid data', async () => {
      const alertData = {
        userId: 'test-user-id',
        symbol: 'BBCA',
        condition: 'ABOVE' as const,
        targetPrice: 10000,
        alertType: 'ONE_TIME' as const,
        notificationChannels: ['email' as const]
      };

      const alert = await alertManager.create(alertData);
      
      expect(alert).toHaveProperty('id');
      expect(alert.symbol).toBe('BBCA');
      expect(alert.condition).toBe('ABOVE');
      expect(alert.targetPrice).toBe(10000);
    });

    test('should list alerts by user', async () => {
      const userId = 'test-user-id';
      
      const alertData = {
        userId,
        symbol: 'BBCA',
        condition: 'ABOVE' as const,
        targetPrice: 10000
      };

      await alertManager.create(alertData);
      const alerts = await alertManager.listByUser(userId);
      
      expect(alerts).toBeInstanceOf(Array);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].userId).toBe(userId);
    });

    test('should get alert by ID', async () => {
      const userId = 'test-user-id';
      
      const alertData = {
        userId,
        symbol: 'BBCA',
        condition: 'ABOVE' as const,
        targetPrice: 10000
      };

      const created = await alertManager.create(alertData);
      const retrieved = await alertManager.getById(created.id, userId);
      
      expect(retrieved).toBeTruthy();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.symbol).toBe('BBCA');
    });

    test('should update alert', async () => {
      const userId = 'test-user-id';
      
      const alertData = {
        userId,
        symbol: 'BBCA',
        condition: 'ABOVE' as const,
        targetPrice: 10000
      };

      const created = await alertManager.create(alertData);
      const updated = await alertManager.update(created.id, userId, {
        targetPrice: 11000,
        isActive: false
      });
      
      expect(updated.targetPrice).toBe(11000);
      expect(updated.isActive).toBe(false);
    });

    test('should delete alert', async () => {
      const userId = 'test-user-id';
      
      const alertData = {
        userId,
        symbol: 'BBCA',
        condition: 'ABOVE' as const,
        targetPrice: 10000
      };

      const created = await alertManager.create(alertData);
      await alertManager.delete(created.id, userId);
      
      const retrieved = await alertManager.getById(created.id, userId);
      expect(retrieved).toBeNull();
    });

    test('should get alert history', async () => {
      const userId = 'test-user-id';
      
      const alertData = {
        userId,
        symbol: 'BBCA',
        condition: 'ABOVE' as const,
        targetPrice: 10000
      };

      await alertManager.create(alertData);
      const history = await alertManager.getHistory(userId);
      
      expect(history).toBeInstanceOf(Array);
    });
  });
});
