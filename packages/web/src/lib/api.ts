import type { SignalData, StockQuote, PortfolioSummary, AIInsight, AIAnalysisReport, MarketOverview, OpsMetrics, OpsAlert, DashboardSLO } from '../types';

const API_BASE = '';

async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function fetchSignals(): Promise<SignalData[]> {
  const data = await fetchApi<{ data: SignalData[] }>('/v1/signals/latest');
  return data.data || [];
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  return fetchApi<StockQuote>(`/v1/stocks/${symbol}/quote`);
}

export async function fetchStockHistory(symbol: string, interval = '1d'): Promise<{ data: Array<{ t: number; o: number; h: number; l: number; c: number; v: number }> }> {
  return fetchApi(`/v1/stocks/${symbol}/history?interval=${interval}`);
}

export async function fetchAIAnalysis(symbol: string): Promise<AIInsight> {
  return fetchApi<AIInsight>(`/v1/analysis/${symbol}/latest`);
}

export async function fetchPortfolioSummary(): Promise<PortfolioSummary> {
  return fetchApi<PortfolioSummary>('/v1/portfolio/summary');
}

export async function fetchMarketOverview(): Promise<MarketOverview> {
  return fetchApi<MarketOverview>('/v1/market/overview');
}

export async function fetchOpsMetrics(): Promise<OpsMetrics> {
  return fetchApi<OpsMetrics>('/v1/ops/metrics');
}

export async function fetchOpsAlerts(): Promise<{ alerts: OpsAlert[] }> {
  return fetchApi<{ alerts: OpsAlert[] }>('/v1/ops/alerts/latest');
}

export async function fetchDashboardSLO(): Promise<{ slo: DashboardSLO }> {
  return fetchApi<{ slo: DashboardSLO }>('/v1/ops/dashboard/latest');
}

export async function searchStocks(query: string): Promise<StockQuote[]> {
  const data = await fetchApi<{ data: StockQuote[] }>(`/v1/stocks/search?q=${encodeURIComponent(query)}`);
  return data.data || [];
}

export async function fetchAIAnalysisReport(symbol: string): Promise<AIAnalysisReport> {
  return fetchApi<AIAnalysisReport>(`/v1/analysis/${symbol}/latest`);
}
