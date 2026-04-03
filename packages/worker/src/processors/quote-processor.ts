import type { StockQuote, OHLCVBar } from '@sahamai/shared';

export interface QuoteValidationResult {
  isValid: boolean;
  errors: string[];
}

export class QuoteProcessor {
  private readonly seenQuotes = new Set<string>();
  private readonly maxAgeMs: number;

  constructor(options: { maxAgeMs?: number } = {}) {
    this.maxAgeMs = options.maxAgeMs ?? 5 * 60 * 1000;
  }

  validate(quote: StockQuote): QuoteValidationResult {
    const errors: string[] = [];

    if (!quote.symbol || quote.symbol.length === 0) {
      errors.push('Symbol is required');
    }

    if (quote.price <= 0) {
      errors.push('Price must be positive');
    }

    if (quote.high < quote.low) {
      errors.push('High must be >= low');
    }

    if (quote.high < quote.price || quote.low > quote.price) {
      errors.push('Price must be between high and low');
    }

    if (quote.volume < 0) {
      errors.push('Volume must be non-negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isDuplicate(quote: StockQuote): boolean {
    const key = `${quote.symbol}:${quote.timestamp}`;
    return this.seenQuotes.has(key);
  }

  process(quote: StockQuote): StockQuote | null {
    if (!this.validate(quote).isValid) {
      return null;
    }

    if (this.isDuplicate(quote)) {
      return null;
    }

    const key = `${quote.symbol}:${quote.timestamp}`;
    this.seenQuotes.add(key);

    return quote;
  }

  clearCache(): void {
    this.seenQuotes.clear();
  }

  getCacheSize(): number {
    return this.seenQuotes.size;
  }
}
