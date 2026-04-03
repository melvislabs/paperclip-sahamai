import { describe, expect, it, vi } from 'vitest';
import { DataIngestionWorker } from '../src/ingestion.js';
import type { LatestSignal } from '@sahamai/shared';
import type { IngestionAdapter } from '../src/ingestion.js';

function makeSignal(symbol: string): LatestSignal {
  return {
    symbol,
    action: 'buy',
    confidence: 0.8,
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 300_000).toISOString(),
    version: 'v1',
    reasonCodes: ['test']
  };
}

describe('data ingestion worker', () => {
  it('ingests signals from adapter', async () => {
    const adapter: IngestionAdapter = {
      fetchSignals: vi.fn().mockResolvedValue([makeSignal('BBCA'), makeSignal('TLKM')])
    };

    const worker = new DataIngestionWorker(adapter, {
      name: 'test-source',
      enabled: true,
      intervalMs: 1000
    });

    const result = await worker.ingest();

    expect(result.source).toBe('test-source');
    expect(result.signalsIngested).toBe(2);
    expect(result.error).toBeUndefined();
  });

  it('captures errors from adapter', async () => {
    const adapter: IngestionAdapter = {
      fetchSignals: vi.fn().mockRejectedValue(new Error('network error'))
    };

    const worker = new DataIngestionWorker(adapter, {
      name: 'failing-source',
      enabled: true,
      intervalMs: 1000
    });

    const result = await worker.ingest();

    expect(result.signalsIngested).toBe(0);
    expect(result.error).toBe('network error');
  });

  it('runs loop until disabled', async () => {
    const adapter: IngestionAdapter = {
      fetchSignals: vi.fn().mockResolvedValue([makeSignal('BBCA')])
    };

    const results: Array<{ signalsIngested: number }> = [];
    let currentTime = 1_000_000;
    const config = { name: 'loop-source', enabled: true, intervalMs: 500 };

    const worker = new DataIngestionWorker(adapter, config, {
      now: () => currentTime,
      sleep: async (ms) => { currentTime += ms; }
    });

    const loopPromise = worker.runLoop((r) => {
      results.push({ signalsIngested: r.signalsIngested });
      if (results.length >= 3) {
        config.enabled = false;
      }
    });

    await loopPromise;

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.signalsIngested === 1)).toBe(true);
  });
});
