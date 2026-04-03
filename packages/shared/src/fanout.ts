import type { LatestSignal } from './types.js';

export type DeliveryChannel = 'telegram' | 'slack' | 'email';

export interface SignalDestination {
  channel: DeliveryChannel;
  recipient: string;
}

export interface SignalPublishedEvent {
  eventId: string;
  publishedAt: string;
  signal: LatestSignal;
  destinations: SignalDestination[];
}

export interface DeliveryAttempt {
  idempotencyKey: string;
  event: SignalPublishedEvent;
  destination: SignalDestination;
  attempt: number;
}

export interface DeliveryAdapter {
  send(attempt: DeliveryAttempt): Promise<void>;
}

export type DeliveryAdapters = Record<DeliveryChannel, DeliveryAdapter>;

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface FanoutWorkerOptions {
  maxAttempts?: number;
  baseBackoffMs?: number;
  rateLimits?: Partial<Record<DeliveryChannel, RateLimitConfig>>;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  onDeliveryResult?: (entry: {
    channel: DeliveryChannel;
    status: 'delivered' | 'dead_lettered';
    latencyMs: number;
    attempts: number;
    idempotencyKey: string;
  }) => void;
}

export interface DeadLetterEntry {
  idempotencyKey: string;
  eventId: string;
  destination: SignalDestination;
  attempts: number;
  error: string;
  movedAt: string;
}

export type DeliveryStatus = 'delivered' | 'duplicate' | 'dead_lettered';

export interface DeliveryResult {
  idempotencyKey: string;
  destination: SignalDestination;
  status: DeliveryStatus;
  attempts: number;
}

export interface FanoutRunResult {
  eventId: string;
  deliveredCount: number;
  duplicateCount: number;
  deadLetterCount: number;
  results: DeliveryResult[];
}

export class FanoutWorker {
  private readonly maxAttempts: number;

  private readonly baseBackoffMs: number;

  private readonly rateLimits: Partial<Record<DeliveryChannel, RateLimitConfig>>;

  private readonly now: () => number;

  private readonly sleep: (ms: number) => Promise<void>;

  private readonly onDeliveryResult?: FanoutWorkerOptions['onDeliveryResult'];

  private readonly deliveredIdempotencyKeys = new Set<string>();

  private readonly deadLetters: DeadLetterEntry[] = [];

  private readonly channelBuckets = new Map<DeliveryChannel, number[]>();

  constructor(
    private readonly adapters: DeliveryAdapters,
    options: FanoutWorkerOptions = {}
  ) {
    this.maxAttempts = Math.max(1, options.maxAttempts ?? 3);
    this.baseBackoffMs = Math.max(1, options.baseBackoffMs ?? 200);
    this.rateLimits = options.rateLimits ?? {};
    this.now = options.now ?? (() => Date.now());
    this.sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.onDeliveryResult = options.onDeliveryResult;
  }

  async fanout(event: SignalPublishedEvent): Promise<FanoutRunResult> {
    const results: DeliveryResult[] = [];

    for (const destination of event.destinations) {
      const idempotencyKey = this.idempotencyKey(event.eventId, destination);

      if (this.deliveredIdempotencyKeys.has(idempotencyKey)) {
        results.push({
          idempotencyKey,
          destination,
          status: 'duplicate',
          attempts: 0
        });
        continue;
      }

      const delivery = await this.deliverWithRetry(event, destination, idempotencyKey);
      results.push(delivery);
    }

    return {
      eventId: event.eventId,
      deliveredCount: results.filter((item) => item.status === 'delivered').length,
      duplicateCount: results.filter((item) => item.status === 'duplicate').length,
      deadLetterCount: results.filter((item) => item.status === 'dead_lettered').length,
      results
    };
  }

  getDeadLetters(): DeadLetterEntry[] {
    return [...this.deadLetters];
  }

  private async deliverWithRetry(
    event: SignalPublishedEvent,
    destination: SignalDestination,
    idempotencyKey: string
  ): Promise<DeliveryResult> {
    const startedAt = this.now();

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        await this.waitForRateLimit(destination.channel);
        await this.adapters[destination.channel].send({
          idempotencyKey,
          event,
          destination,
          attempt
        });

        this.deliveredIdempotencyKeys.add(idempotencyKey);

        this.onDeliveryResult?.({
          channel: destination.channel,
          status: 'delivered',
          latencyMs: Math.max(0, this.now() - startedAt),
          attempts: attempt,
          idempotencyKey
        });

        return {
          idempotencyKey,
          destination,
          status: 'delivered',
          attempts: attempt
        };
      } catch (error) {
        if (attempt >= this.maxAttempts) {
          const deadLetter: DeadLetterEntry = {
            idempotencyKey,
            eventId: event.eventId,
            destination,
            attempts: attempt,
            error: this.errorText(error),
            movedAt: new Date(this.now()).toISOString()
          };
          this.deadLetters.push(deadLetter);

          this.onDeliveryResult?.({
            channel: destination.channel,
            status: 'dead_lettered',
            latencyMs: Math.max(0, this.now() - startedAt),
            attempts: attempt,
            idempotencyKey
          });

          return {
            idempotencyKey,
            destination,
            status: 'dead_lettered',
            attempts: attempt
          };
        }

        await this.sleep(this.baseBackoffMs * 2 ** (attempt - 1));
      }
    }

    return {
      idempotencyKey,
      destination,
      status: 'dead_lettered',
      attempts: this.maxAttempts
    };
  }

  private async waitForRateLimit(channel: DeliveryChannel): Promise<void> {
    const config = this.rateLimits[channel];
    if (!config) {
      return;
    }

    const bucket = this.channelBuckets.get(channel) ?? [];

    while (true) {
      const current = this.now();
      while (bucket.length > 0 && current - bucket[0] >= config.windowMs) {
        bucket.shift();
      }

      if (bucket.length < config.limit) {
        bucket.push(current);
        this.channelBuckets.set(channel, bucket);
        return;
      }

      const waitMs = Math.max(1, config.windowMs - (current - bucket[0]));
      await this.sleep(waitMs);
    }
  }

  private idempotencyKey(eventId: string, destination: SignalDestination): string {
    return `${eventId}:${destination.channel}:${destination.recipient.toLowerCase()}`;
  }

  private errorText(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
