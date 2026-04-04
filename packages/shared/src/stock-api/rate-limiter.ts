export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillIntervalMs: number;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(
    requestsPerMinute: number,
    options: { now?: () => number; sleep?: (ms: number) => Promise<void> } = {}
  ) {
    this.now = options.now ?? (() => Date.now());
    this.sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.maxTokens = requestsPerMinute;
    this.tokens = requestsPerMinute;
    this.lastRefill = this.now();
    this.refillIntervalMs = 60_000 / requestsPerMinute;
  }

  private refill(): void {
    const now = this.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor(elapsed / this.refillIntervalMs);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = this.lastRefill + tokensToAdd * this.refillIntervalMs;
    }
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens <= 0) {
      const waitTime = this.refillIntervalMs;
      await this.sleep(waitTime);
      this.refill();
    }

    this.tokens--;
  }

  getRemaining(): number {
    this.refill();
    return this.tokens;
  }
}
