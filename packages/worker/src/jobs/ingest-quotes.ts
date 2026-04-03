import type { StockApiClient, StockQuote } from '@sahamai/shared';
import { QuoteProcessor } from '../processors/quote-processor.js';
import { withRetry } from '../utils/error-handler.js';
import { processBatch } from '../utils/batch-processor.js';

export interface QuoteIngestionResult {
  symbol: string;
  status: 'success' | 'error' | 'duplicate' | 'invalid';
  quote?: StockQuote;
  error?: string;
}

export class QuoteIngestionJob {
  private readonly quoteProcessor: QuoteProcessor;

  constructor(
    private readonly client: StockApiClient,
    private readonly symbols: string[],
    private readonly onStore?: (quotes: StockQuote[]) => Promise<void>
  ) {
    this.quoteProcessor = new QuoteProcessor();
  }

  async execute(): Promise<QuoteIngestionResult[]> {
    const results = await processBatch(
      this.symbols,
      async (symbol) => this.ingestQuote(symbol),
      { size: 10, delayMs: 1000 }
    );

    const validQuotes = results
      .filter(r => r.status === 'success' && r.quote)
      .map(r => r.quote!);

    if (validQuotes.length > 0 && this.onStore) {
      await this.onStore(validQuotes);
    }

    return results;
  }

  private async ingestQuote(symbol: string): Promise<QuoteIngestionResult> {
    try {
      const response = await withRetry(
        () => this.client.getQuote(symbol),
        { maxRetries: 3, baseDelayMs: 1000 }
      );

      if (!response.success) {
        return { symbol, status: 'error', error: 'Failed to fetch quote' };
      }

      const quote = response.data;
      const processed = this.quoteProcessor.process(quote);

      if (!processed) {
        return { symbol, status: this.quoteProcessor.isDuplicate(quote) ? 'duplicate' : 'invalid' };
      }

      return { symbol, status: 'success', quote: processed };
    } catch (error) {
      return {
        symbol,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  clearCache(): void {
    this.quoteProcessor.clearCache();
  }
}
