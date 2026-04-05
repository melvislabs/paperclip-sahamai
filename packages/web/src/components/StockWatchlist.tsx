import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboardStore } from '../store/dashboard-store';
import { addWatchlistSymbol, removeWatchlistSymbol } from '../lib/api';
import type { StockQuote, SignalData } from '../types';

const SYMBOL_PATTERN = /^[A-Za-z0-9]{1,10}$/;

interface StockWatchlistProps {
  quotes?: StockQuote[];
  signals?: SignalData[];
  loading?: boolean;
  onSymbolSelect: (symbol: string) => void;
  /** When true, add/remove calls the API and syncs the store from responses. */
  canSyncWatchlist?: boolean;
}

export function StockWatchlist({
  quotes,
  signals,
  loading,
  onSymbolSelect,
  canSyncWatchlist = false,
}: StockWatchlistProps) {
  const queryClient = useQueryClient();
  const { watchlist, selectedSymbol, setWatchlist } = useDashboardStore();
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change'>('symbol');
  const [symbolInput, setSymbolInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: (symbol: string) => addWatchlistSymbol(symbol),
    onSuccess: (data) => {
      setWatchlist(data.symbols);
      setSymbolInput('');
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['user-watchlist'] });
    },
    onError: (e: Error) => {
      setFormError(e.message || 'Could not add symbol');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (symbol: string) => removeWatchlistSymbol(symbol),
    onSuccess: (data) => {
      setWatchlist(data.symbols);
      queryClient.invalidateQueries({ queryKey: ['user-watchlist'] });
    },
    onError: (e: Error) => {
      setFormError(e.message || 'Could not remove symbol');
    },
  });

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

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const raw = symbolInput.trim().toUpperCase();
    if (!SYMBOL_PATTERN.test(raw)) {
      setFormError('Enter 1–10 letters or numbers');
      return;
    }
    addMutation.mutate(raw);
  };

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
      <div className="p-4 border-b border-slate-700 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Watchlist</h3>
        <div className="flex gap-2">
          {(['symbol', 'price', 'change'] as const).map((col) => (
            <button
              key={col}
              type="button"
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

      {canSyncWatchlist && (
        <form onSubmit={handleAdd} className="p-3 border-b border-slate-700 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={symbolInput}
            onChange={(ev) => setSymbolInput(ev.target.value.toUpperCase())}
            placeholder="Symbol e.g. BBCA"
            maxLength={10}
            className="flex-1 min-w-0 rounded-md bg-slate-900 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            disabled={addMutation.isPending}
            aria-label="Add symbol to watchlist"
          />
          <button
            type="submit"
            disabled={addMutation.isPending || !symbolInput.trim()}
            className="rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:pointer-events-none px-4 py-2 text-sm font-medium text-white"
          >
            Add
          </button>
        </form>
      )}

      {formError && (
        <div className="px-3 py-2 text-xs text-red-400 border-b border-slate-700 bg-red-950/20">{formError}</div>
      )}

      {!canSyncWatchlist && (
        <p className="px-3 py-2 text-xs text-slate-500 border-b border-slate-700">
          Sign in and set a token to sync your watchlist with the server.
        </p>
      )}

      <div className="divide-y divide-slate-700">
        {sortedWatchlist.map((symbol) => {
          const quote = getQuote(symbol);
          const signal = signalMap.get(symbol);
          const isSelected = selectedSymbol === symbol;
          const isPositive = (quote?.changePercent ?? 0) >= 0;

          return (
            <div
              key={symbol}
              className={`flex items-stretch min-h-[4.5rem] ${isSelected ? 'bg-slate-700/40' : ''}`}
            >
              <button
                type="button"
                data-testid={`watchlist-select-${symbol}`}
                onClick={() => onSymbolSelect(symbol)}
                className="flex-1 p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-300">
                    {symbol.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
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
                <div className="text-right shrink-0 pl-2">
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
              {canSyncWatchlist && (
                <button
                  type="button"
                  aria-label={`Remove ${symbol} from watchlist`}
                  disabled={removeMutation.isPending}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    removeMutation.mutate(symbol);
                  }}
                  className="shrink-0 px-3 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 text-lg leading-none disabled:opacity-40"
                >
                  ×
                </button>
              )}
            </div>
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
