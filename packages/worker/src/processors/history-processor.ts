import type { OHLCVBar } from '@sahamai/shared';

export interface HistoryValidationResult {
  isValid: boolean;
  errors: string[];
}

export class HistoryProcessor {
  private readonly seenBars = new Set<string>();

  validate(bar: OHLCVBar): HistoryValidationResult {
    const errors: string[] = [];

    if (!bar.timestamp) {
      errors.push('Timestamp is required');
    }

    if (bar.open <= 0 || bar.high <= 0 || bar.low <= 0 || bar.close <= 0) {
      errors.push('OHLC values must be positive');
    }

    if (bar.high < bar.low) {
      errors.push('High must be >= low');
    }

    if (bar.volume < 0) {
      errors.push('Volume must be non-negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isDuplicate(bar: OHLCVBar): boolean {
    const key = `${bar.timestamp}:${bar.open}:${bar.high}:${bar.low}:${bar.close}`;
    return this.seenBars.has(key);
  }

  process(bars: OHLCVBar[]): OHLCVBar[] {
    const valid: OHLCVBar[] = [];

    for (const bar of bars) {
      if (!this.validate(bar).isValid) {
        continue;
      }

      if (this.isDuplicate(bar)) {
        continue;
      }

      const key = `${bar.timestamp}:${bar.open}:${bar.high}:${bar.low}:${bar.close}`;
      this.seenBars.add(key);
      valid.push(bar);
    }

    return valid.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  calculateDerivedMetrics(bars: OHLCVBar[]): OHLCVBar[] {
    return bars.map((bar, index) => {
      if (index === 0) return bar;

      const prevClose = bars[index - 1].close;
      const dailyReturn = (bar.close - prevClose) / prevClose;

      return {
        ...bar,
        dailyReturn
      } as OHLCVBar & { dailyReturn?: number };
    });
  }

  clearCache(): void {
    this.seenBars.clear();
  }

  getCacheSize(): number {
    return this.seenBars.size;
  }
}
