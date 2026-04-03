export interface StockQuote {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previousClose: number;
  change: number;
  changePercent: number;
  timestamp: string;
  marketStatus: 'open' | 'closed' | 'pre_market' | 'after_hours';
}

export interface OHLCVBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockNews {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  symbols: string[];
  summary?: string;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
  industry?: string;
}

export interface StockApiResponse<T> {
  success: boolean;
  data: T;
  rateLimit?: {
    remaining: number;
    resetAt: string;
  };
}

export type StockDataProvider = 'alpha_vantage' | 'polygon' | 'finnhub';

export interface StockApiConfig {
  provider: StockDataProvider;
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  rateLimitPerMin: number;
  cacheTtlMs: number;
}
