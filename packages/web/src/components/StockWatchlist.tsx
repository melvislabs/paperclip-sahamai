import { useState } from 'react';
import { useDashboardStore } from '../store/dashboard-store';
import type { StockQuote, SignalData } from '../types';

interface StockWatchlistProps {
  quotes?: StockQuote[];
  signals?: SignalData[];
  loading?: boolean;
  onSymbolSelect: (symbol: string) => void;
}

export function StockWatchlist({ quotes, signals, loading, onSymbolSelect }: StockWatchlistProps) {
  const { watchlist, selectedSymbol } = useDashboardStore();
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change'>('symbol');

  const signalMap = new Map(signals?.map((s) => [s.symbol, s]));

  const getQuote = (symbol: string): StockQuote | undefined => {
    return quotes?.find((q) => q.symbol === symbol);
  };

  const sortedWatchlist = [...watchlist].sort((a, b) => {
    const quoteA = getQuote(a);
    const quoteB = getQuote(b);
    if (sortBy === 'symbol') return a.localeCompare(b);
    if (sortBy === 'price') return (quoteB?.price ?? 0) - (quoteA?.price ?? 0);
    if (sortBy === 'change') return (quoteB?.changePercent ?? 0) - (quoteA?.changePercent ?? 0);
    return 0;
  });

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700 animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-24" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-slate-700 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Watchlist</h3>
        <div className="flex gap-2">
          {(['symbol', 'price', 'change'] as const).map((col) => (
            <button
              key={col}
              onClick={() => setSortBy(col)}
              className={`text-xs px-2 py-1 rounded ${
                sortBy === col
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {col}
            </button>
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-700">
        {sortedWatchlist.map((symbol) => {
          const quote = getQuote(symbol);
          const signal = signalMap.get(symbol);
          const isSelected = selectedSymbol === symbol;
          const isPositive = (quote?.changePercent ?? 0) >= 0;

          return (
            <button
              key={symbol}
              onClick={() => onSymbolSelect(symbol)}
              className={`w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors text-left ${
                isSelected ? 'bg-slate-700/50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-300">
                  {symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-slate-100">{symbol}</p>
                  {signal && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        signal.signal?.action === 'buy'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : signal.signal?.action === 'sell'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-600 text-slate-300'
                      }`}
                    >
                      {signal.signal?.action?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                {quote ? (
                  <>
                    <p className="font-medium text-slate-100">
                      Rp {quote.price.toLocaleString('id-ID')}
                    </p>
                    <p className={`text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}
                      {quote.changePercent.toFixed(2)}%
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">No data</p>
                )}
              </div>
            </button>
          );
        })}
        {sortedWatchlist.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <p className="text-sm">No stocks in watchlist</p>
          </div>
        )}
      </div>
    </div>
  );
}
