import { describe, it, expect } from 'vitest';
import { SignalStore } from '../src/store.js';
import type { LatestSignal } from '../src/types.js';

function makeSignal(symbol: string, expiresAt: string): LatestSignal {
  return {
    symbol,
    action: 'buy',
    confidence: 0.8,
    generatedAt: '2024-01-01T00:00:00.000Z',
    expiresAt,
    version: '1.0.0',
    reasonCodes: ['test']
  };
}

describe('SignalStore', () => {
  it('returns null for unknown symbol', () => {
    const store = new SignalStore();
    expect(store.get('UNKNOWN')).toBeNull();
  });

  it('returns fresh signal with stale=false', () => {
    const store = new SignalStore();
    const future = new Date(Date.now() + 60000).toISOString();
    store.seed([makeSignal('BBCA', future)]);
    const result = store.get('BBCA');
    expect(result).not.toBeNull();
    expect(result!.signal.symbol).toBe('BBCA');
    expect(result!.stale).toBe(false);
  });

  it('returns stale signal when expiresAt <= now', () => {
    const store = new SignalStore();
    const past = new Date(Date.now() - 1000).toISOString();
    store.seed([makeSignal('TLKM', past)]);
    const result = store.get('TLKM');
    expect(result).not.toBeNull();
    expect(result!.stale).toBe(true);
  });

  it('normalizes symbol to uppercase', () => {
    const store = new SignalStore();
    const future = new Date(Date.now() + 60000).toISOString();
    store.seed([makeSignal('bbca', future)]);
    expect(store.get('BBCA')).not.toBeNull();
    expect(store.get('bbca')).not.toBeNull();
  });

  it('getMany returns signals for valid symbols only', () => {
    const store = new SignalStore();
    const future = new Date(Date.now() + 60000).toISOString();
    store.seed([makeSignal('BBCA', future), makeSignal('TLKM', future)]);
    const results = store.getMany(['BBCA', 'UNKNOWN', 'TLKM']);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.signal.symbol)).toContain('BBCA');
    expect(results.map((r) => r.signal.symbol)).toContain('TLKM');
  });

  it('all returns all signals with freshness status', () => {
    const store = new SignalStore();
    const future = new Date(Date.now() + 60000).toISOString();
    const past = new Date(Date.now() - 1000).toISOString();
    store.seed([makeSignal('BBCA', future), makeSignal('TLKM', past)]);
    const results = store.all();
    expect(results).toHaveLength(2);
    const bbca = results.find((r) => r.signal.symbol === 'BBCA');
    const tlkm = results.find((r) => r.signal.symbol === 'TLKM');
    expect(bbca!.stale).toBe(false);
    expect(tlkm!.stale).toBe(true);
  });

  it('overwrites signal on re-seed', () => {
    const store = new SignalStore();
    const future = new Date(Date.now() + 60000).toISOString();
    store.seed([makeSignal('BBCA', future)]);
    const newerFuture = new Date(Date.now() + 120000).toISOString();
    store.seed([makeSignal('BBCA', newerFuture)]);
    expect(store.all()).toHaveLength(1);
    expect(store.get('BBCA')!.signal.expiresAt).toBe(newerFuture);
  });
});
