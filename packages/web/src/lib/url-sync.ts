import type { TimeRange } from '../types';

type Tab = 'dashboard' | 'signals' | 'analysis' | 'ops';

const VALID_TABS: Tab[] = ['dashboard', 'signals', 'analysis', 'ops'];
const VALID_TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y'];

export interface UrlState {
  tab: Tab;
  symbol: string | null;
  timeRange: TimeRange;
}

export function parseUrlHash(): UrlState {
  const hash = window.location.hash.slice(1);
  if (!hash) return { tab: 'dashboard', symbol: null, timeRange: '1D' };

  const params = new URLSearchParams(hash);
  const tab = params.get('tab');
  const symbol = params.get('symbol');
  const timeRange = params.get('timeRange');

  return {
    tab: VALID_TABS.includes(tab as Tab) ? (tab as Tab) : 'dashboard',
    symbol: symbol || null,
    timeRange: VALID_TIME_RANGES.includes(timeRange as TimeRange) ? (timeRange as TimeRange) : '1D',
  };
}

export function updateUrlHash(state: Partial<UrlState>): void {
  const current = parseUrlHash();
  const next = { ...current, ...state };
  const params = new URLSearchParams();

  if (next.tab !== 'dashboard') params.set('tab', next.tab);
  if (next.symbol) params.set('symbol', next.symbol);
  if (next.timeRange !== '1D') params.set('timeRange', next.timeRange);

  const hash = params.toString();
  const newUrl = hash ? `#${hash}` : window.location.pathname;

  if (window.location.hash !== hash && `#${hash}` !== window.location.hash) {
    window.history.replaceState(null, '', newUrl);
  }
}

export function subscribeToHashChanges(callback: (state: UrlState) => void): () => void {
  const handler = () => callback(parseUrlHash());
  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}
