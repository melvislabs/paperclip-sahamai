import type { MarketOverview } from '../types';

interface MarketOverviewProps {
  overview?: MarketOverview;
  loading?: boolean;
}

export function MarketOverviewCard({ overview, loading }: MarketOverviewProps) {
  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 bg-slate-700 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Market Overview</h3>
        <p className="text-slate-500 text-sm">No market data available</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-emerald-400';
      case 'closed': return 'text-slate-400';
      case 'pre-market': return 'text-yellow-400';
      case 'after-hours': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Market Overview</h3>
        <span className={`text-xs font-medium ${getStatusColor(overview.marketStatus)}`}>
          {overview.marketStatus.replace('-', ' ').toUpperCase()}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-medium text-slate-500 mb-2">Indices</h4>
          <div className="space-y-2">
            {overview.indices.map((index) => {
              const isPositive = index.change >= 0;
              return (
                <div key={index.name} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{index.name}</span>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-100">
                      {index.value.toLocaleString('id-ID')}
                    </p>
                    <p className={`text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {overview.topGainers.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-emerald-400 mb-2">Top Gainers</h4>
            <div className="space-y-1">
              {overview.topGainers.slice(0, 3).map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{stock.symbol}</span>
                  <span className="text-emerald-400">+{stock.changePercent.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {overview.topLosers.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-red-400 mb-2">Top Losers</h4>
            <div className="space-y-1">
              {overview.topLosers.slice(0, 3).map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{stock.symbol}</span>
                  <span className="text-red-400">{stock.changePercent.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
