import type { StockApiClient, StockNews } from '@sahamai/shared';
import { NewsProcessor } from '../processors/news-processor.js';
import { withRetry } from '../utils/error-handler.js';

export interface NewsIngestionResult {
  symbol: string;
  articlesIngested: number;
  status: 'success' | 'error';
  error?: string;
}

export class NewsIngestionJob {
  private readonly newsProcessor: NewsProcessor;

  constructor(
    private readonly client: StockApiClient,
    private readonly symbols: string[],
    private readonly onStore?: (articles: StockNews[]) => Promise<void>
  ) {
    this.newsProcessor = new NewsProcessor();
  }

  async execute(): Promise<NewsIngestionResult[]> {
    const results: NewsIngestionResult[] = [];

    for (const symbol of this.symbols) {
      const result = await this.ingestNews(symbol);
      results.push(result);

      if (result.status === 'success' && result.articlesIngested > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  private async ingestNews(symbol: string): Promise<NewsIngestionResult> {
    try {
      const response = await withRetry(
        () => this.client.getNews(symbol),
        { maxRetries: 3, baseDelayMs: 1000 }
      );

      if (!response.success) {
        return { symbol, articlesIngested: 0, status: 'error', error: 'Failed to fetch news' };
      }

      const validArticles = this.newsProcessor.process(response.data);

      if (validArticles.length > 0 && this.onStore) {
        await this.onStore(validArticles);
      }

      return { symbol, articlesIngested: validArticles.length, status: 'success' };
    } catch (error) {
      return {
        symbol,
        articlesIngested: 0,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  clearCache(): void {
    this.newsProcessor.clearCache();
  }
}
