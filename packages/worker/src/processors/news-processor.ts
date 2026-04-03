import type { StockNews } from '@sahamai/shared';

export interface NewsValidationResult {
  isValid: boolean;
  errors: string[];
}

export class NewsProcessor {
  private readonly seenUrls = new Set<string>();
  private readonly maxAgeDays: number;

  constructor(options: { maxAgeDays?: number } = {}) {
    this.maxAgeDays = options.maxAgeDays ?? 30;
  }

  validate(news: StockNews): NewsValidationResult {
    const errors: string[] = [];

    if (!news.title || news.title.length === 0) {
      errors.push('Title is required');
    }

    if (!news.url || news.url.length === 0) {
      errors.push('URL is required');
    }

    if (!news.source || news.source.length === 0) {
      errors.push('Source is required');
    }

    if (!news.publishedAt) {
      errors.push('Published date is required');
    }

    if (news.symbols && news.symbols.length === 0) {
      errors.push('At least one symbol is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isDuplicate(news: StockNews): boolean {
    return this.seenUrls.has(news.url);
  }

  process(newsItems: StockNews[]): StockNews[] {
    const valid: StockNews[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.maxAgeDays);

    for (const item of newsItems) {
      if (!this.validate(item).isValid) {
        continue;
      }

      if (this.isDuplicate(item)) {
        continue;
      }

      const publishedAt = new Date(item.publishedAt);
      if (publishedAt < cutoffDate) {
        continue;
      }

      this.seenUrls.add(item.url);
      valid.push(item);
    }

    return valid.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  clearCache(): void {
    this.seenUrls.clear();
  }

  getCacheSize(): number {
    return this.seenUrls.size;
  }
}
