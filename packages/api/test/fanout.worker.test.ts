import { describe, expect, it, vi } from 'vitest';
import { FanoutWorker } from '@sahamai/shared';
import type {
  DeliveryAdapters,
  SignalPublishedEvent,
  SignalDestination
} from '@sahamai/shared';

function makeEvent(destinations: SignalDestination[]): SignalPublishedEvent {
  return {
    eventId: 'evt-1',
    publishedAt: new Date().toISOString(),
    signal: {
      symbol: 'BBCA',
      action: 'buy',
      confidence: 0.81,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
      version: 'v1',
      reasonCodes: ['trend_up']
    },
    destinations
  };
}

function makeAdapters(options: { fail?: boolean } = {}): DeliveryAdapters {
  const send = options.fail
    ? vi.fn().mockRejectedValue(new Error('delivery failed'))
    : vi.fn().mockResolvedValue(undefined);

  return {
    telegram: { send },
    slack: { send },
    email: { send }
  };
}

describe('fanout worker', () => {
  it('delivers to all destinations successfully', async () => {
    const adapters = makeAdapters();
    const worker = new FanoutWorker(adapters, { now: () => Date.now() });

    const result = await worker.fanout(makeEvent([
      { channel: 'telegram', recipient: '@user1' },
      { channel: 'slack', recipient: '#channel1' }
    ]));

    expect(result.deliveredCount).toBe(2);
    expect(result.deadLetterCount).toBe(0);
    expect(result.duplicateCount).toBe(0);
  });

  it('dead-letters after max attempts', async () => {
    const adapters = makeAdapters({ fail: true });
    const worker = new FanoutWorker(adapters, {
      maxAttempts: 2,
      baseBackoffMs: 1,
      now: () => Date.now()
    });

    const result = await worker.fanout(makeEvent([
      { channel: 'email', recipient: 'user@example.com' }
    ]));

    expect(result.deadLetterCount).toBe(1);
    expect(result.deliveredCount).toBe(0);
  });

  it('deduplicates by idempotency key', async () => {
    const adapters = makeAdapters();
    const worker = new FanoutWorker(adapters, { now: () => Date.now() });

    const event = makeEvent([{ channel: 'telegram', recipient: '@user1' }]);

    await worker.fanout(event);
    const result = await worker.fanout(event);

    expect(result.duplicateCount).toBe(1);
    expect(result.deliveredCount).toBe(0);
  });

  it('respects rate limits', async () => {
    const adapters = makeAdapters();
    let currentTime = 1_000_000;
    const worker = new FanoutWorker(adapters, {
      now: () => currentTime,
      sleep: async (ms) => { currentTime += ms; },
      rateLimits: {
        telegram: { limit: 1, windowMs: 1000 }
      }
    });

    const destinations: SignalDestination[] = [
      { channel: 'telegram', recipient: '@user1' },
      { channel: 'telegram', recipient: '@user2' }
    ];

    const result = await worker.fanout(makeEvent(destinations));

    expect(result.deliveredCount).toBe(2);
    expect(currentTime).toBeGreaterThan(1_000_000);
  });
});
