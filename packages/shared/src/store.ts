import type { LatestSignal, SignalWithFreshness } from './types.js';

export class SignalStore {
  private readonly bySymbol = new Map<string, LatestSignal>();

  seed(signals: LatestSignal[]): void {
    for (const signal of signals) {
      this.bySymbol.set(signal.symbol.toUpperCase(), signal);
    }
  }

  get(symbol: string, now = Date.now()): SignalWithFreshness | null {
    const signal = this.bySymbol.get(symbol.toUpperCase());
    if (!signal) {
      return null;
    }

    const stale = Date.parse(signal.expiresAt) <= now;
    return { signal, stale };
  }

  getMany(symbols: string[], now = Date.now()): Array<SignalWithFreshness> {
    return symbols
      .map((symbol) => this.get(symbol, now))
      .filter((item): item is SignalWithFreshness => item !== null);
  }

  all(now = Date.now()): Array<SignalWithFreshness> {
    const out: Array<SignalWithFreshness> = [];
    for (const signal of this.bySymbol.values()) {
      out.push({ signal, stale: Date.parse(signal.expiresAt) <= now });
    }
    return out;
  }
}
