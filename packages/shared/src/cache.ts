interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {}

  getOrLoad(key: string, loader: () => T, now = Date.now()): T {
    const existing = this.entries.get(key);
    if (existing && existing.expiresAt > now) {
      return existing.value;
    }

    const value = loader();
    this.entries.set(key, { value, expiresAt: now + this.ttlMs });
    return value;
  }

  clear(): void {
    this.entries.clear();
  }
}
