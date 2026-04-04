import { create } from 'zustand';
import type { TimeRange } from '../types';
import { parseUrlHash, updateUrlHash } from '../lib/url-sync';

type Tab = 'dashboard' | 'signals' | 'analysis' | 'ops';

interface DashboardState {
  activeTab: Tab;
  selectedSymbol: string | null;
  selectedTimeRange: TimeRange;
  watchlist: string[];
  searchQuery: string;
  setActiveTab: (tab: Tab) => void;
  setSelectedSymbol: (symbol: string | null) => void;
  setSelectedTimeRange: (range: TimeRange) => void;
  setWatchlist: (symbols: string[]) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  setSearchQuery: (query: string) => void;
}

const urlState = typeof window !== 'undefined' ? parseUrlHash() : { tab: 'dashboard' as Tab, symbol: null, timeRange: '1D' as TimeRange };

export const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: urlState.tab,
  selectedSymbol: urlState.symbol,
  selectedTimeRange: urlState.timeRange,
  watchlist: ['BBCA', 'TLKM', 'BBRI', 'ASII', 'UNVR'],
  searchQuery: '',
  setActiveTab: (tab) => {
    updateUrlHash({ tab });
    set({ activeTab: tab });
  },
  setSelectedSymbol: (symbol) => {
    updateUrlHash({ symbol });
    set({ selectedSymbol: symbol });
  },
  setSelectedTimeRange: (range) => {
    updateUrlHash({ timeRange: range });
    set({ selectedTimeRange: range });
  },
  setWatchlist: (symbols) => set({ watchlist: symbols }),
  addToWatchlist: (symbol) =>
    set((state) => ({
      watchlist: state.watchlist.includes(symbol)
        ? state.watchlist
        : [...state.watchlist, symbol],
    })),
  removeFromWatchlist: (symbol) =>
    set((state) => ({
      watchlist: state.watchlist.filter((s) => s !== symbol),
    })),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
