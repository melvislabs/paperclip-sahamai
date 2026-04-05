import { useMemo, useEffect, useState } from 'react';
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
import { ErrorAlert } from './components/ErrorAlert';
import { AuthModal } from './components/AuthModal';
import { useDashboardStore } from './store/dashboard-store';
import { useRealTimeData } from './hooks/useRealTimeData';
import { subscribeToHashChanges } from './lib/url-sync';
import {
  fetchSignals,
  fetchOpsMetrics,
  fetchOpsAlerts,
  fetchDashboardSLO,
  fetchPortfolioSummary,
  fetchMarketOverview,
  fetchAIAnalysis,
  fetchStockQuote,
  fetchStockHistory,
  fetchWatchlist,
} from './lib/api';
import type {
  SignalData,
  OpsMetrics,
  OpsAlert,
  DashboardSLO,
  PortfolioSummary,
  MarketOverview,
  AIInsight,
  PricePoint,
  StockQuote,
} from './types';

function MainDashboard() {
  const { selectedSymbol, selectedTimeRange, setSelectedSymbol, setSelectedTimeRange, watchlist, setWatchlist } =
    useDashboardStore();

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Enable real-time data updates
  const { isConnected, isRealTimeEnabled } = useRealTimeData({ enabled: true });

  // Error states
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [signalsError, setSignalsError] = useState<string | null>(null);

  const { data: watchlistSync } = useQuery({
    queryKey: ['user-watchlist'],
    queryFn: async () => {
      if (typeof window === 'undefined' || !localStorage.getItem('authToken')) {
        return { skip: true as const };
      }
      try {
        const res = await fetchWatchlist();
        return { skip: false as const, symbols: res.symbols };
      } catch {
        return { skip: true as const };
      }
    },
  });

  useEffect(() => {
    if (watchlistSync && !watchlistSync.skip) {
      setWatchlist(watchlistSync.symbols);
    }
  }, [watchlistSync, setWatchlist]);

  const { data: signals, error: signalsErrorRaw } = useQuery<SignalData[]>({
    queryKey: ['signals'],
    queryFn: fetchSignals,
    refetchInterval: isRealTimeEnabled ? false : 15_000, // Use WebSocket when available
  });

  const { data: portfolio, isLoading: portfolioLoading, error: portfolioErrorRaw } = useQuery<PortfolioSummary>({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolioSummary,
    refetchInterval: isRealTimeEnabled ? false : 30_000, // Use WebSocket when available
  });

  const { data: market, isLoading: marketLoading, error: marketErrorRaw } = useQuery<MarketOverview>({
    queryKey: ['market'],
    queryFn: fetchMarketOverview,
    refetchInterval: isRealTimeEnabled ? false : 30_000, // Use WebSocket when available
  });

  // Handle errors from queries
  useEffect(() => {
    if (signalsErrorRaw) {
      setSignalsError(signalsErrorRaw instanceof Error ? signalsErrorRaw.message : 'Failed to load signals');
    } else {
      setSignalsError(null);
    }
  }, [signalsErrorRaw]);

  useEffect(() => {
    if (portfolioErrorRaw) {
      setPortfolioError(portfolioErrorRaw instanceof Error ? portfolioErrorRaw.message : 'Failed to load portfolio');
    } else {
      setPortfolioError(null);
    }
  }, [portfolioErrorRaw]);

  useEffect(() => {
    if (marketErrorRaw) {
      setMarketError(marketErrorRaw instanceof Error ? marketErrorRaw.message : 'Failed to load market data');
    } else {
      setMarketError(null);
    }
  }, [marketErrorRaw]);

  const { data: watchlistQuotes, isLoading: quotesLoading } = useQuery({
    queryKey: ['watchlist-quotes', watchlist.join(',')],
    queryFn: async () => {
      if (watchlist.length === 0) return [];
      const results = await Promise.allSettled(watchlist.map((s) => fetchStockQuote(s)));
      return results
        .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled' && r.value !== null)
        .map((r) => r.value);
    },
    refetchInterval: isRealTimeEnabled ? false : 10_000, // Use WebSocket when available
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
    refetchInterval: isRealTimeEnabled ? false : 30_000, // Use WebSocket when available
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
    refetchInterval: isRealTimeEnabled ? false : 30_000, // Use WebSocket when available
  });

  const signalData = useMemo(() => signals || [], [signals]);

  const canSyncWatchlist =
    typeof window !== 'undefined' && Boolean(localStorage.getItem('authToken'));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Real-time connection status */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-xs text-slate-400">
            {isRealTimeEnabled ? (isConnected ? 'Real-time updates active' : 'Connecting...') : 'Sign in for real-time updates'}
          </span>
        </div>
      </div>

      {/* Error alerts */}
      {signalsError && (
        <ErrorAlert 
          error={signalsError} 
          onDismiss={() => setSignalsError(null)}
        />
      )}
      {portfolioError && (
        <ErrorAlert 
          error={portfolioError} 
          onDismiss={() => setPortfolioError(null)}
        />
      )}
      {marketError && (
        <ErrorAlert 
          error={marketError} 
          onDismiss={() => setMarketError(null)}
        />
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

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
            canSyncWatchlist={canSyncWatchlist}
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
  const [showAuthModal, setShowAuthModal] = useState(false);

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
      <Header onLoginClick={() => setShowAuthModal(true)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
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
