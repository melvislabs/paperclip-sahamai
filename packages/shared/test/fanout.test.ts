import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FanoutWorker } from '../src/fanout.js';
import type {
  DeliveryAdapters,
  SignalPublishedEvent,
  SignalDestination,
  DeliveryAdapter
} from '../src/fanout.js';

function makeEvent(destinations: SignalDestination[]): SignalPublishedEvent {
  return {
    eventId: 'evt-1',
    publishedAt: new Date().toISOString(),
    signal: {
      symbol: 'BBCA',
      action: 'buy',
      confidence: 0.8,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60000).toISOString(),
      version: '1.0.0',
      reasonCodes: ['test']
    },
    destinations
  };
}

describe('FanoutWorker', () => {
  describe('fanout', () => {
    it('delivers to all destinations successfully', async () => {
      const mockAdapter: DeliveryAdapter = { send: vi.fn().mockResolvedValue(undefined) };
      const adapters: DeliveryAdapters = { telegram: mockAdapter, slack: mockAdapter, email: mockAdapter };
      const worker = new FanoutWorker(adapters);

      const event = makeEvent([
        { channel: 'telegram', recipient: '@user1' },
        { channel: 'slack', recipient: '#alerts' }
      ]);

      const result = await worker.fanout(event);

      expect(result.deliveredCount).toBe(2);
      expect(result.duplicateCount).toBe(0);
      expect(result.deadLetterCount).toBe(0);
      expect(mockAdapter.send).toHaveBeenCalledTimes(2);
    });

    it('deduplicates by idempotency key', async () => {
      const mockAdapter: DeliveryAdapter = { send: vi.fn().mockResolvedValue(undefined) };
      const adapters: DeliveryAdapters = { telegram: mockAdapter, slack: mockAdapter, email: mockAdapter };
      const worker = new FanoutWorker(adapters);

      const event = makeEvent([{ channel: 'telegram', recipient: '@user1' }]);

      await worker.fanout(event);
      const result = await worker.fanout(event);

      expect(result.duplicateCount).toBe(1);
      expect(result.deliveredCount).toBe(0);
      expect(mockAdapter.send).toHaveBeenCalledTimes(1);
    });

    it('dead-letters after max attempts', async () => {
      const failingAdapter: DeliveryAdapter = { send: vi.fn().mockRejectedValue(new Error('fail')) };
      const adapters: DeliveryAdapters = { telegram: failingAdapter, slack: failingAdapter, email: failingAdapter };
      const worker = new FanoutWorker(adapters, { maxAttempts: 2, sleep: async () => {} });

      const event = makeEvent([{ channel: 'telegram', recipient: '@user1' }]);

      const result = await worker.fanout(event);

      expect(result.deadLetterCount).toBe(1);
      expect(failingAdapter.send).toHaveBeenCalledTimes(2);
    });

    it('tracks dead letters', async () => {
      const failingAdapter: DeliveryAdapter = { send: vi.fn().mockRejectedValue(new Error('network error')) };
      const adapters: DeliveryAdapters = { telegram: failingAdapter, slack: failingAdapter, email: failingAdapter };
      const worker = new FanoutWorker(adapters, { maxAttempts: 1 });

      const event = makeEvent([{ channel: 'telegram', recipient: '@user1' }]);
      await worker.fanout(event);

      const deadLetters = worker.getDeadLetters();
      expect(deadLetters).toHaveLength(1);
      expect(deadLetters[0].error).toBe('network error');
      expect(deadLetters[0].eventId).toBe('evt-1');
    });

    it('calls onDeliveryResult callback', async () => {
      const mockAdapter: DeliveryAdapter = { send: vi.fn().mockResolvedValue(undefined) };
      const adapters: DeliveryAdapters = { telegram: mockAdapter, slack: mockAdapter, email: mockAdapter };
      const callbacks: Array<{ channel: string; status: string }> = [];
      const worker = new FanoutWorker(adapters, {
        onDeliveryResult: (entry) => {
          callbacks.push({ channel: entry.channel, status: entry.status });
        }
      });

      const event = makeEvent([{ channel: 'telegram', recipient: '@user1' }]);
      await worker.fanout(event);

      expect(callbacks).toHaveLength(1);
      expect(callbacks[0]).toEqual({ channel: 'telegram', status: 'delivered' });
    });
  });

  describe('rate limiting', () => {
    it('respects rate limits', async () => {
      const mockAdapter: DeliveryAdapter = { send: vi.fn().mockResolvedValue(undefined) };
      const adapters: DeliveryAdapters = { telegram: mockAdapter, slack: mockAdapter, email: mockAdapter };
      let currentTime = 0;
      const sleepTimes: number[] = [];

      const worker = new FanoutWorker(adapters, {
        rateLimits: { telegram: { limit: 1, windowMs: 1000 } },
        now: () => currentTime,
        sleep: async (ms: number) => {
          sleepTimes.push(ms);
          currentTime += ms;
        }
      });

      const destinations: SignalDestination[] = [
        { channel: 'telegram', recipient: '@user1' },
        { channel: 'telegram', recipient: '@user2' }
      ];
      const event = makeEvent(destinations);

      await worker.fanout(event);

      expect(sleepTimes.length).toBeGreaterThan(0);
    });
  });

  describe('idempotency key generation', () => {
    it('normalizes recipient to lowercase', async () => {
      const mockAdapter: DeliveryAdapter = { send: vi.fn().mockResolvedValue(undefined) };
      const adapters: DeliveryAdapters = { telegram: mockAdapter, slack: mockAdapter, email: mockAdapter };
      const worker = new FanoutWorker(adapters);

      const event1 = makeEvent([{ channel: 'telegram', recipient: '@User1' }]);
      const event2 = makeEvent([{ channel: 'telegram', recipient: '@user1' }]);

      await worker.fanout(event1);
      const result = await worker.fanout(event2);

      expect(result.duplicateCount).toBe(1);
    });
  });
});
