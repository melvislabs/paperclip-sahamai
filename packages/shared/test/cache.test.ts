import { describe, it, expect } from 'vitest';
import { TtlCache } from '../src/cache.js';

describe('TtlCache', () => {
  it('loads value via loader on cache miss', () => {
    const cache = new TtlCache(1000);
    const result = cache.getOrLoad('key1', () => 'value1', 0);
    expect(result).toBe('value1');
  });

  it('returns cached value before expiry', () => {
    const cache = new TtlCache(1000);
    let loadCount = 0;
    cache.getOrLoad('key1', () => {
      loadCount++;
      return 'value1';
    }, 0);
    const result = cache.getOrLoad('key1', () => {
      loadCount++;
      return 'value2';
    }, 500);
    expect(result).toBe('value1');
    expect(loadCount).toBe(1);
  });

  it('reloads value after TTL expires', () => {
    const cache = new TtlCache(1000);
    let loadCount = 0;
    cache.getOrLoad('key1', () => {
      loadCount++;
      return 'value1';
    }, 0);
    const result = cache.getOrLoad('key1', () => {
      loadCount++;
      return 'value2';
    }, 1500);
    expect(result).toBe('value2');
    expect(loadCount).toBe(2);
  });

  it('handles exact expiry boundary (expiresAt === now means stale)', () => {
    const cache = new TtlCache(1000);
    cache.getOrLoad('key1', () => 'value1', 0);
    const result = cache.getOrLoad('key1', () => 'value2', 1000);
    expect(result).toBe('value2');
  });

  it('clears all entries', () => {
    const cache = new TtlCache(1000);
    cache.getOrLoad('key1', () => 'value1', 0);
    cache.getOrLoad('key2', () => 'value2', 0);
    cache.clear();
    let loadCount = 0;
    cache.getOrLoad('key1', () => {
      loadCount++;
      return 'value3';
    }, 500);
    expect(loadCount).toBe(1);
  });

  it('handles different keys independently', () => {
    const cache = new TtlCache(1000);
    cache.getOrLoad('a', () => 'A', 0);
    cache.getOrLoad('b', () => 'B', 0);
    expect(cache.getOrLoad('a', () => 'A-new', 500)).toBe('A');
    expect(cache.getOrLoad('b', () => 'B-new', 500)).toBe('B');
  });
});
