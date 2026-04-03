import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteProcessor } from '../src/processors/quote-processor.js';
import { HistoryProcessor } from '../src/processors/history-processor.js';
import { NewsProcessor } from '../src/processors/news-processor.js';
import { processBatch, chunkArray } from '../src/utils/batch-processor.js';
import { withRetry, RetryableError, createErrorHandler } from '../src/utils/error-handler.js';
import { JobScheduler } from '../src/scheduler.js';
import type { StockQuote, OHLCVBar, StockNews } from '@sahamai/shared';

describe('QuoteProcessor', () => {
  let processor: QuoteProcessor;

  beforeEach(() => {
    processor = new QuoteProcessor();
  });

  it('should validate a correct quote', () => {
    const quote: StockQuote = {
      symbol: 'AAPL',
      price: 150.00,
      open: 148.00,
      high: 151.00,
      low: 147.50,
      volume: 1000000,
      previousClose: 149.00,
      change: 1.00,
      changePercent: 0.67,
      timestamp: '2026-04-03T10:00:00Z',
      marketStatus: 'open'
    };

    const result = processor.validate(quote);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject quotes with invalid price', () => {
    const quote: StockQuote = {
      symbol: 'AAPL',
      price: -10,
      open: 148.00,
      high: 151.00,
      low: 147.50,
      volume: 1000000,
      previousClose: 149.00,
      change: 1.00,
      changePercent: 0.67,
      timestamp: '2026-04-03T10:00:00Z',
      marketStatus: 'open'
    };

    const result = processor.validate(quote);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Price must be positive');
  });

  it('should detect duplicates', () => {
    const quote: StockQuote = {
      symbol: 'AAPL',
      price: 150.00,
      open: 148.00,
      high: 151.00,
      low: 147.50,
      volume: 1000000,
      previousClose: 149.00,
      change: 1.00,
      changePercent: 0.67,
      timestamp: '2026-04-03T10:00:00Z',
      marketStatus: 'open'
    };

    const first = processor.process(quote);
    expect(first).not.toBeNull();

    const second = processor.process(quote);
    expect(second).toBeNull();
  });
});

describe('HistoryProcessor', () => {
  let processor: HistoryProcessor;

  beforeEach(() => {
    processor = new HistoryProcessor();
  });

  it('should validate and process bars', () => {
    const bars: OHLCVBar[] = [
      {
        timestamp: '2026-04-01T10:00:00Z',
        open: 148.00,
        high: 151.00,
        low: 147.50,
        close: 150.00,
        volume: 1000000
      },
      {
        timestamp: '2026-04-02T10:00:00Z',
        open: 150.00,
        high: 153.00,
        low: 149.00,
        close: 152.00,
        volume: 1200000
      }
    ];

    const result = processor.process(bars);
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe('2026-04-01T10:00:00Z');
    expect(result[1].timestamp).toBe('2026-04-02T10:00:00Z');
  });

  it('should calculate derived metrics', () => {
    const bars: OHLCVBar[] = [
      {
        timestamp: '2026-04-01T10:00:00Z',
        open: 100,
        high: 105,
        low: 99,
        close: 104,
        volume: 1000000
      },
      {
        timestamp: '2026-04-02T10:00:00Z',
        open: 104,
        high: 108,
        low: 103,
        close: 107,
        volume: 1200000
      }
    ];

    const processed = processor.process(bars);
    const withMetrics = processor.calculateDerivedMetrics(processed);

    expect(withMetrics).toHaveLength(2);
    expect((withMetrics[1] as any).dailyReturn).toBeCloseTo(0.0288, 3);
  });
});

describe('NewsProcessor', () => {
  let processor: NewsProcessor;

  beforeEach(() => {
    processor = new NewsProcessor();
  });

  it('should validate and process news articles', () => {
    const articles: StockNews[] = [
      {
        title: 'Apple announces new product',
        url: 'https://example.com/1',
        source: 'TechCrunch',
        publishedAt: '2026-04-03T10:00:00Z',
        symbols: ['AAPL'],
        summary: 'Apple announced...'
      }
    ];

    const result = processor.process(articles);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Apple announces new product');
  });

  it('should reject articles older than max age', () => {
    const processor = new NewsProcessor({ maxAgeDays: 1 });
    const articles: StockNews[] = [
      {
        title: 'Old news',
        url: 'https://example.com/old',
        source: 'TechCrunch',
        publishedAt: '2020-01-01T10:00:00Z',
        symbols: ['AAPL']
      }
    ];

    const result = processor.process(articles);
    expect(result).toHaveLength(0);
  });
});

describe('BatchProcessor', () => {
  it('should process items in batches', async () => {
    const items = Array.from({ length: 250 }, (_, i) => i);
    const results = await processBatch(
      items,
      async (item) => item * 2,
      { size: 100 }
    );

    expect(results).toHaveLength(250);
    expect(results[0]).toBe(0);
    expect(results[249]).toBe(498);
  });

  it('should chunk arrays correctly', () => {
    const array = [1, 2, 3, 4, 5, 6, 7];
    const chunks = chunkArray(array, 3);

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toEqual([1, 2, 3]);
    expect(chunks[1]).toEqual([4, 5, 6]);
    expect(chunks[2]).toEqual([7]);
  });
});

describe('withRetry', () => {
  it('should succeed on first try', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    await expect(withRetry(fn, { maxRetries: 2, baseDelayMs: 10 }))
      .rejects.toThrow('fail');

    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe('JobScheduler', () => {
  let scheduler: JobScheduler;
  let mockNow: Date;

  beforeEach(() => {
    mockNow = new Date('2026-04-03T10:00:00Z');
    scheduler = new JobScheduler({ now: () => mockNow });
  });

  it('should register and retrieve jobs', () => {
    scheduler.register({
      name: 'test-job',
      schedule: { expression: '*/5 * * * *' },
      enabled: true
    });

    const job = scheduler.getJob('test-job');
    expect(job).toBeDefined();
    expect(job?.name).toBe('test-job');
  });

  it('should list all jobs', () => {
    scheduler.register({
      name: 'job1',
      schedule: { expression: '*/5 * * * *' },
      enabled: true
    });
    scheduler.register({
      name: 'job2',
      schedule: { expression: '*/15 * * * *' },
      enabled: true
    });

    const jobs = scheduler.getAllJobs();
    expect(jobs).toHaveLength(2);
  });

  it('should parse cron expressions', () => {
    scheduler.register({
      name: 'minute-job',
      schedule: { expression: '* * * * *' },
      enabled: true
    });

    expect(() => scheduler.getJob('minute-job')).not.toThrow();
  });
});
