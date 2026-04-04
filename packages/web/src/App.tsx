import { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from './components/Header';
import { PortfolioSummaryCard } from './components/PortfolioSummaryCard';
import { StockWatchlist } from './components/StockWatchlist';
import { PriceChart } from './components/PriceChart';
import { AIInsights } from './components/AIInsights';
import { MarketOverviewCard } from './components/MarketOverviewCard';
import { AlertsPanel } from './components/AlertsPanel';
import { SignalsDashboard } from './components/SignalsDashboard';
import { OpsDashboard } from './components/OpsDashboard';
import { AIAnalysisReportPage } from './components/AIAnalysisReportPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useDashboardStore } from './store/dashboard-store';
import { subscribeToHashChanges } from './lib/url-sync';
import {
  fetchSignals,
  fetchOpsMetrics,
  fetchOpsAlerts,
  fetchDashboardSLO,
  fetchPortfolioSummary,
  fetchMarketOverview,
  fetchAIAnalysis,
  fetchStockHistory,
} from './lib/api';
import type { SignalData, OpsMetrics, OpsAlert, DashboardSLO, PortfolioSummary, MarketOverview, AIInsight, PricePoint } from './types';

function MainDashboard() {
  const { selectedSymbol, selectedTimeRange, setSelectedSymbol, setSelectedTimeRange } = useDashboardStore();

  const { data: signals } = useQuery<SignalData[]>({
    queryKey: ['signals'],
    queryFn: fetchSignals,
    refetchInterval: 30_000,
  });

  const { data: portfolio, isLoading: portfolioLoading } = useQuery<PortfolioSummary>({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolioSummary,
    refetchInterval: 60_000,
  });

  const { data: market, isLoading: marketLoading } = useQuery<MarketOverview>({
    queryKey: ['market'],
    queryFn: fetchMarketOverview,
    refetchInterval: 60_000,
  });

  const { data: watchlistQuotes, isLoading: quotesLoading } = useQuery({
    queryKey: ['watchlist-quotes'],
    queryFn: async () => {
      const symbols = ['BBCA', 'TLKM', 'BBRI', 'ASII', 'UNVR'];
      const results = await Promise.allSettled(
        symbols.map(async (s) => {
          const res = await fetch(`/v1/stocks/${s}/quote`);
          if (!res.ok) return null;
          return res.json();
        })
      );
      return results.filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value).map((r) => r.value);
    },
    refetchInterval: 15_000,
  });

  const { data: chartData, isLoading: chartLoading } = useQuery<PricePoint[]>({
    queryKey: ['chart', selectedSymbol, selectedTimeRange],
    queryFn: async () => {
      if (!selectedSymbol) return [];
      const res = await fetchStockHistory(selectedSymbol);
      return res.data.map((d: { t: number; o: number; h: number; l: number; c: number; v: number }) => ({
        timestamp: new Date(d.t).toISOString(),
        close: d.c,
        volume: d.v,
        open: d.o,
        high: d.h,
        low: d.l,
      }));
    },
    enabled: !!selectedSymbol,
    refetchInterval: 15_000,
  });

  const { data: insights, isLoading: insightsLoading } = useQuery<AIInsight[]>({
    queryKey: ['insights'],
    queryFn: async () => {
      const symbols = ['BBCA', 'TLKM', 'BBRI'];
      const results = await Promise.allSettled(
        symbols.map(async (s) => {
          try {
            return await fetchAIAnalysis(s);
          } catch {
            return null;
          }
        })
      );
      return results
        .filter((r): r is PromiseFulfilledResult<AIInsight> => r.status === 'fulfilled' && r.value !== null)
        .map((r) => r.value);
    },
    refetchInterval: 300_000,
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<{ alerts: OpsAlert[] }>({
    queryKey: ['alerts'],
    queryFn: fetchOpsAlerts,
    refetchInterval: 60_000,
  });

  const signalData = useMemo(() => signals || [], [signals]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ErrorBoundary>
            <PortfolioSummaryCard summary={portfolio} loading={portfolioLoading} />
          </ErrorBoundary>
        </div>
        <ErrorBoundary>
          <MarketOverviewCard overview={market} loading={marketLoading} />
        </ErrorBoundary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ErrorBoundary>
            <PriceChart
              symbol={selectedSymbol || 'BBCA'}
              data={chartData}
              timeRange={selectedTimeRange}
              onTimeRangeChange={setSelectedTimeRange}
              loading={chartLoading && !!selectedSymbol}
            />
          </ErrorBoundary>
        </div>
        <ErrorBoundary>
          <StockWatchlist
            quotes={watchlistQuotes}
            signals={signalData}
            loading={quotesLoading}
            onSymbolSelect={setSelectedSymbol}
          />
        </ErrorBoundary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 mb-4">AI Insights</h3>
          <ErrorBoundary>
            <AIInsights
              insights={insights}
              loading={insightsLoading}
              onSymbolSelect={setSelectedSymbol}
            />
          </ErrorBoundary>
        </div>
        <ErrorBoundary>
          <AlertsPanel alerts={alerts?.alerts} loading={alertsLoading} />
        </ErrorBoundary>
      </div>
    </div>
  );
}

function App() {
  const { activeTab, selectedSymbol, setActiveTab, setSelectedSymbol, setSelectedTimeRange } = useDashboardStore();

  useEffect(() => {
    const unsub = subscribeToHashChanges((state) => {
      setActiveTab(state.tab);
      setSelectedSymbol(state.symbol);
      setSelectedTimeRange(state.timeRange);
    });
    return unsub;
  }, [setActiveTab, setSelectedSymbol, setSelectedTimeRange]);

  const { data: signals, isLoading: signalsLoading } = useQuery<SignalData[]>({
    queryKey: ['signals'],
    queryFn: fetchSignals,
    refetchInterval: 30_000,
  });

  const { data: opsMetrics, isLoading: metricsLoading } = useQuery<OpsMetrics>({
    queryKey: ['ops-metrics'],
    queryFn: fetchOpsMetrics,
    refetchInterval: 30_000,
  });

  const { data: opsAlerts } = useQuery<{ alerts: OpsAlert[] }>({
    queryKey: ['ops-alerts'],
    queryFn: fetchOpsAlerts,
    refetchInterval: 60_000,
  });

  const { data: sloData } = useQuery<{ slo: DashboardSLO }>({
    queryKey: ['slo'],
    queryFn: fetchDashboardSLO,
    refetchInterval: 60_000,
  });

  const loading = signalsLoading && metricsLoading;

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <main>
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-slate-400 text-sm">Loading dashboard...</div>
            </div>
          </div>
        ) : (
          <ErrorBoundary>
            {activeTab === 'dashboard' ? (
              <MainDashboard />
            ) : activeTab === 'signals' ? (
              <SignalsDashboard signals={signals || []} />
            ) : activeTab === 'analysis' ? (
              <AIAnalysisReportPage symbol={selectedSymbol || 'BBCA'} onBack={() => setActiveTab('dashboard')} />
            ) : (
              <OpsDashboard
                metrics={opsMetrics ?? null}
                alerts={opsAlerts?.alerts ?? []}
                slo={sloData?.slo ?? null}
              />
            )}
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
}

export default App;
