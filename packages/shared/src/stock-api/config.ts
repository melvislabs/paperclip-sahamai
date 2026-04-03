import type { StockApiConfig, StockDataProvider } from './types.js';

const PROVIDER_CONFIGS: Record<StockDataProvider, { baseUrl: string; rateLimitPerMin: number }> = {
  alpha_vantage: {
    baseUrl: 'https://www.alphavantage.co/query',
    rateLimitPerMin: 5
  },
  polygon: {
    baseUrl: 'https://api.polygon.io',
    rateLimitPerMin: 5
  },
  finnhub: {
    baseUrl: 'https://finnhub.io/api/v1',
    rateLimitPerMin: 60
  }
};

export function buildStockApiConfig(overrides: Partial<StockApiConfig>): StockApiConfig {
  const provider = overrides.provider ?? 'finnhub';
  const defaults = PROVIDER_CONFIGS[provider];

  return {
    provider,
    apiKey: overrides.apiKey ?? process.env.STOCK_API_KEY ?? '',
    baseUrl: overrides.baseUrl ?? defaults.baseUrl,
    timeoutMs: overrides.timeoutMs ?? 10000,
    maxRetries: overrides.maxRetries ?? 3,
    rateLimitPerMin: overrides.rateLimitPerMin ?? defaults.rateLimitPerMin,
    cacheTtlMs: overrides.cacheTtlMs ?? 5 * 60 * 1000
  };
}
