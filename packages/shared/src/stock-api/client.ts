import type {
  StockApiConfig,
  StockQuote,
  OHLCVBar,
  StockNews,
  StockSearchResult,
  StockApiResponse
} from './types.js';
import { RateLimiter } from './rate-limiter.js';
import { ResponseCache } from './cache.js';

export class StockApiClient {
  private readonly config: StockApiConfig;
  private readonly rateLimiter: RateLimiter;
  private readonly quoteCache: ResponseCache<StockQuote>;
  private readonly searchCache: ResponseCache<StockSearchResult[]>;

  constructor(config: StockApiConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimitPerMin);
    this.quoteCache = new ResponseCache<StockQuote>(config.cacheTtlMs);
    this.searchCache = new ResponseCache<StockSearchResult[]>(config.cacheTtlMs * 2);
  }

  async getQuote(symbol: string): Promise<StockApiResponse<StockQuote>> {
    const cached = this.quoteCache.get(symbol);
    if (cached) {
      return { success: true, data: cached };
    }

    await this.rateLimiter.acquire();

    const quote = await this.fetchQuote(symbol);
    this.quoteCache.set(symbol, quote);

    return {
      success: true,
      data: quote,
      rateLimit: {
        remaining: this.rateLimiter.getRemaining(),
        resetAt: new Date(Date.now() + 60000).toISOString()
      }
    };
  }

  async getHistory(
    symbol: string,
    interval: string = '1day',
    from?: string,
    to?: string
  ): Promise<StockApiResponse<OHLCVBar[]>> {
    await this.rateLimiter.acquire();

    const history = await this.fetchHistory(symbol, interval, from, to);

    return {
      success: true,
      data: history,
      rateLimit: {
        remaining: this.rateLimiter.getRemaining(),
        resetAt: new Date(Date.now() + 60000).toISOString()
      }
    };
  }

  async getNews(symbol: string): Promise<StockApiResponse<StockNews[]>> {
    await this.rateLimiter.acquire();

    const news = await this.fetchNews(symbol);

    return {
      success: true,
      data: news,
      rateLimit: {
        remaining: this.rateLimiter.getRemaining(),
        resetAt: new Date(Date.now() + 60000).toISOString()
      }
    };
  }

  async search(query: string): Promise<StockApiResponse<StockSearchResult[]>> {
    const cached = this.searchCache.get(query);
    if (cached) {
      return { success: true, data: cached };
    }

    await this.rateLimiter.acquire();

    const results = await this.fetchSearch(query);
    this.searchCache.set(query, results);

    return {
      success: true,
      data: results,
      rateLimit: {
        remaining: this.rateLimiter.getRemaining(),
        resetAt: new Date(Date.now() + 60000).toISOString()
      }
    };
  }

  private async fetchQuote(symbol: string): Promise<StockQuote> {
    switch (this.config.provider) {
      case 'finnhub':
        return this.fetchFinnhubQuote(symbol);
      case 'alpha_vantage':
        return this.fetchAlphaVantageQuote(symbol);
      case 'polygon':
        return this.fetchPolygonQuote(symbol);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private async fetchFinnhubQuote(symbol: string): Promise<StockQuote> {
    const url = `${this.config.baseUrl}/quote?symbol=${symbol}&token=${this.config.apiKey}`;
    const response = await this.fetchWithRetry(url);
    const data = await response.json();

    return {
      symbol,
      price: data.c,
      open: data.o,
      high: data.h,
      low: data.l,
      volume: 0,
      previousClose: data.pc,
      change: data.c - data.pc,
      changePercent: ((data.c - data.pc) / data.pc) * 100,
      timestamp: new Date().toISOString(),
      marketStatus: data.c > 0 ? 'open' : 'closed'
    };
  }

  private async fetchAlphaVantageQuote(symbol: string): Promise<StockQuote> {
    const url = `${this.config.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.config.apiKey}`;
    const response = await this.fetchWithRetry(url);
    const data = await response.json();
    const quote = data['Global Quote'];

    return {
      symbol,
      price: parseFloat(quote['05. price']),
      open: parseFloat(quote['02. open']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      volume: parseInt(quote['06. volume']),
      previousClose: parseFloat(quote['08. previous close']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      timestamp: quote['07. latest trading day'],
      marketStatus: 'closed'
    };
  }

  private async fetchPolygonQuote(symbol: string): Promise<StockQuote> {
    const url = `${this.config.baseUrl}/v2/aggs/ticker/${symbol}/prev?apiKey=${this.config.apiKey}`;
    const response = await this.fetchWithRetry(url);
    const data = await response.json();
    const result = data.results[0];

    return {
      symbol,
      price: result.c,
      open: result.o,
      high: result.h,
      low: result.l,
      volume: result.v,
      previousClose: 0,
      change: 0,
      changePercent: 0,
      timestamp: new Date(result.t).toISOString(),
      marketStatus: 'closed'
    };
  }

  private async fetchHistory(
    symbol: string,
    interval: string,
    from?: string,
    to?: string
  ): Promise<OHLCVBar[]> {
    switch (this.config.provider) {
      case 'finnhub':
        return this.fetchFinnhubHistory(symbol, interval, from, to);
      case 'alpha_vantage':
        return this.fetchAlphaVantageHistory(symbol, interval);
      case 'polygon':
        return this.fetchPolygonHistory(symbol, interval, from, to);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private async fetchFinnhubHistory(
    symbol: string,
    resolution: string,
    from?: string,
    to?: string
  ): Promise<OHLCVBar[]> {
    const fromTs = from ? Math.floor(new Date(from).getTime() / 1000) : Math.floor(Date.now() / 1000) - 86400 * 30;
    const toTs = to ? Math.floor(new Date(to).getTime() / 1000) : Math.floor(Date.now() / 1000);

    const url = `${this.config.baseUrl}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${fromTs}&to=${toTs}&token=${this.config.apiKey}`;
    const response = await this.fetchWithRetry(url);
    const data = await response.json();

    if (data.s !== 'ok') return [];

    return data.t.map((timestamp: number, i: number) => ({
      timestamp: new Date(timestamp * 1000).toISOString(),
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i]
    }));
  }

  private async fetchAlphaVantageHistory(symbol: string, interval: string): Promise<OHLCVBar[]> {
    const functionMap: Record<string, string> = {
      '1min': 'TIME_SERIES_INTRADAY',
      '5min': 'TIME_SERIES_INTRADAY',
      '15min': 'TIME_SERIES_INTRADAY',
      '30min': 'TIME_SERIES_INTRADAY',
      '60min': 'TIME_SERIES_INTRADAY',
      '1day': 'TIME_SERIES_DAILY',
      '1week': 'TIME_SERIES_WEEKLY',
      '1month': 'TIME_SERIES_MONTHLY'
    };

    const func = functionMap[interval] || 'TIME_SERIES_DAILY';
    const url = `${this.config.baseUrl}?function=${func}&symbol=${symbol}&apikey=${this.config.apiKey}&outputsize=compact`;
    const response = await this.fetchWithRetry(url);
    const data = await response.json();

    const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
    if (!timeSeriesKey) return [];

    return Object.entries(data[timeSeriesKey]).map(([timestamp, values]: [string, any]) => ({
      timestamp,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'])
    }));
  }

  private async fetchPolygonHistory(
    symbol: string,
    multiplier: string,
    from?: string,
    to?: string
  ): Promise<OHLCVBar[]> {
    const fromStr = from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const toStr = to || new Date().toISOString().split('T')[0];

    const url = `${this.config.baseUrl}/v2/aggs/ticker/${symbol}/range/${multiplier}/day/${fromStr}/${toStr}?apiKey=${this.config.apiKey}`;
    const response = await this.fetchWithRetry(url);
    const data = await response.json();

    return data.results.map((result: any) => ({
      timestamp: new Date(result.t).toISOString(),
      open: result.o,
      high: result.h,
      low: result.l,
      close: result.c,
      volume: result.v
    }));
  }

  private async fetchNews(symbol: string): Promise<StockNews[]> {
    switch (this.config.provider) {
      case 'finnhub':
        return this.fetchFinnhubNews(symbol);
      case 'alpha_vantage':
        return this.fetchAlphaVantageNews(symbol);
      case 'polygon':
        return this.fetchPolygonNews(symbol);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private async fetchFinnhubNews(symbol: string): Promise<StockNews[]> {
    const today = new Date().toISOString().split('T')[0];
    const url = `${this.config.baseUrl}/company-news?symbol=${symbol}&from=${today}&to=${today}&token=${this.config.apiKey}`;
    const response = await this.fetchWithRetry(url);
    const data = await response.json();

    return data.map((item: any) => ({
      title: item.headline,
      url: item.url,
      source: item.source,
      publishedAt: new Date(item.datetime * 1000).toISOString(),
      symbols: [symbol],
      summary: item.summary
    }));
  }

  private async fetchAlphaVantageNews(symbol: string): Promise<StockNews[]> {
    const url = `${this.config.baseUrl}?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${this.config.apiKey}`;
    const response = await this.fetchWithRetry(url);
    const data = await response.json();

    return (data.feed || []).map((item: any) => ({
      title: item.title,
      url: item.url,
      source: item.source,
      publishedAt: item.time_published,
      symbols: item.ticker_sentiment?.map((t: any) => t.ticker) || [symbol],
      summary: item.summary
    }));
  }

  private async fetchPolygonNews(symbol: string): Promise<StockNews[]> {
    const url = `${this.config.baseUrl}/v2/reference/news?ticker=${symbol}&apiKey=${this.config.apiKey}`;
    const response = await this.fetchWithRetry(url);
    const data = await response.json();

    return (data.results || []).map((item: any) => ({
      title: item.title,
      url: item.article_url,
      source: item.publisher.name,
      publishedAt: item.published_utc,
      symbols: [symbol],
      summary: item.description
    }));
  }

  private async fetchSearch(query: string): Promise<StockSearchResult[]> {
    switch (this.config.provider) {
      case 'finnhub':
        return this.fetchFinnhubSearch(query);
      case 'alpha_vantage':
        return this.fetchAlphaVantageSearch(query);
      case 'polygon':
        return this.fetchPolygonSearch(query);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private async fetchFinnhubSearch(query: string): Promise<StockSearchResult[]> {
    const url = `${this.config.baseUrl}/search?q=${query}&token=${this.config.apiKey}`;
    const response = await this.fetchWithRetry(url);
    const data = await response.json();

    return (data.result || []).map((item: any) => ({
      symbol: item.symbol,
      name: item.description,
      exchange: item.exchange
    }));
  }

  private async fetchAlphaVantageSearch(query: string): Promise<StockSearchResult[]> {
    const url = `${this.config.baseUrl}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${this.config.apiKey}`;
    const response = await this.fetchWithRetry(url);
    const data = await response.json();

    return (data.bestMatches || []).map((item: any) => ({
      symbol: item['1. symbol'],
      name: item['2. name'],
      exchange: item['4. region'],
      sector: item['8. currency'],
      industry: item['7. type']
    }));
  }

  private async fetchPolygonSearch(query: string): Promise<StockSearchResult[]> {
    const url = `${this.config.baseUrl}/v3/reference/tickers?search=${query}&apiKey=${this.config.apiKey}`;
    const response = await this.fetchWithRetry(url);
    const data = await response.json();

    return (data.results || []).map((item: any) => ({
      symbol: item.ticker,
      name: item.name,
      exchange: item.primary_exchange,
      sector: item.market,
      industry: item.type
    }));
  }

  private async fetchWithRetry(url: string, retries = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.status === 429) {
        if (retries >= this.config.maxRetries) {
          throw new Error(`Rate limit exceeded after ${retries} retries`);
        }
        const waitTime = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.fetchWithRetry(url, retries + 1);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeoutMs}ms`);
      }

      if (retries >= this.config.maxRetries) {
        throw error;
      }

      const waitTime = Math.pow(2, retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.fetchWithRetry(url, retries + 1);
    }
  }
}
