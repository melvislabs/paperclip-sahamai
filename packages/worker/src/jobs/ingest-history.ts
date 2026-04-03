import type { StockApiClient, OHLCVBar } from '@sahamai/shared';
import { HistoryProcessor } from '../processors/history-processor.js';
import { withRetry } from '../utils/error-handler.js';

export interface HistoryIngestionResult {
  symbol: string;
  barsIngested: number;
  status: 'success' | 'error';
  error?: string;
}

export class HistoryIngestionJob {
  private readonly historyProcessor: HistoryProcessor;

  constructor(
    private readonly client: StockApiClient,
    private readonly symbols: string[],
    private readonly interval: string = '1day',
    private readonly onStore?: (bars: OHLCVBar[]) => Promise<void>
  ) {
    this.historyProcessor = new HistoryProcessor();
  }

  async execute(): Promise<HistoryIngestionResult[]> {
    const results: HistoryIngestionResult[] = [];

    for (const symbol of this.symbols) {
      const result = await this.ingestHistory(symbol);
      results.push(result);

      if (result.status === 'success' && result.barsIngested > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  private async ingestHistory(symbol: string): Promise<HistoryIngestionResult> {
    try {
      const response = await withRetry(
        () => this.client.getHistory(symbol, this.interval),
        { maxRetries: 3, baseDelayMs: 2000 }
      );

      if (!response.success) {
        return { symbol, barsIngested: 0, status: 'error', error: 'Failed to fetch history' };
      }

      const validBars = this.historyProcessor.process(response.data);
      const barsWithMetrics = this.historyProcessor.calculateDerivedMetrics(validBars);

      if (barsWithMetrics.length > 0 && this.onStore) {
        await this.onStore(barsWithMetrics as OHLCVBar[]);
      }

      return { symbol, barsIngested: barsWithMetrics.length, status: 'success' };
    } catch (error) {
      return {
        symbol,
        barsIngested: 0,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  clearCache(): void {
    this.historyProcessor.clearCache();
  }
}
