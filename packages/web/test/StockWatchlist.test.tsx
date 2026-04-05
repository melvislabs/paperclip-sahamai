import type { ReactElement } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { StockWatchlist } from '../src/components/StockWatchlist';
import type { StockQuote, SignalData } from '../src/types';

const mockQuotes: StockQuote[] = [
  {
    symbol: 'BBCA',
    name: 'Bank Central Asia',
    price: 9500,
    change: 150,
    changePercent: 1.6,
    volume: 15000000,
    high: 9550,
    low: 9350,
    open: 9400,
    previousClose: 9350,
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: 'TLKM',
    name: 'Telkom Indonesia',
    price: 3800,
    change: -50,
    changePercent: -1.3,
    volume: 25000000,
    high: 3850,
    low: 3780,
    open: 3850,
    previousClose: 3850,
    updatedAt: new Date().toISOString(),
  },
];

const mockSignals: SignalData[] = [
  {
    symbol: 'BBCA',
    status: 'fresh',
    stale: false,
    signal: {
      symbol: 'BBCA',
      action: 'buy',
      confidence: 0.85,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300000).toISOString(),
      version: '1.0.0',
      reasonCodes: ['RSI oversold'],
    },
  },
];

function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('StockWatchlist', () => {
  it('should render loading skeleton when loading', () => {
    const { container } = renderWithQuery(
      <StockWatchlist quotes={[]} signals={[]} loading={true} onSymbolSelect={() => {}} />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render watchlist symbols from store', () => {
    renderWithQuery(
      <StockWatchlist quotes={mockQuotes} signals={mockSignals} onSymbolSelect={() => {}} />
    );

    expect(screen.getByText('BBCA')).toBeInTheDocument();
    expect(screen.getByText('TLKM')).toBeInTheDocument();
  });

  it('should show signal action badge when available', () => {
    renderWithQuery(
      <StockWatchlist quotes={mockQuotes} signals={mockSignals} onSymbolSelect={() => {}} />
    );

    expect(screen.getByText('BUY')).toBeInTheDocument();
  });

  it('should show positive change in green', () => {
    renderWithQuery(
      <StockWatchlist quotes={mockQuotes} signals={mockSignals} onSymbolSelect={() => {}} />
    );

    const positiveChange = screen.getByText('+1.60%');
    expect(positiveChange).toBeInTheDocument();
    expect(positiveChange).toHaveClass('text-emerald-400');
  });

  it('should show negative change in red', () => {
    renderWithQuery(
      <StockWatchlist quotes={mockQuotes} signals={mockSignals} onSymbolSelect={() => {}} />
    );

    const negativeChange = screen.getByText('-1.30%');
    expect(negativeChange).toBeInTheDocument();
    expect(negativeChange).toHaveClass('text-red-400');
  });

  it('should call onSymbolSelect when clicking a stock row', () => {
    const onSymbolSelect = vi.fn();
    renderWithQuery(
      <StockWatchlist quotes={mockQuotes} signals={mockSignals} onSymbolSelect={onSymbolSelect} />
    );

    const bbcaRow = screen.getByTestId('watchlist-select-BBCA');
    fireEvent.click(bbcaRow);
    expect(onSymbolSelect).toHaveBeenCalledWith('BBCA');
  });

  it('should show "No data" for stocks without quotes', () => {
    renderWithQuery(
      <StockWatchlist quotes={mockQuotes} signals={mockSignals} onSymbolSelect={() => {}} />
    );

    const noDataElements = screen.getAllByText('No data');
    expect(noDataElements.length).toBeGreaterThan(0);
  });

  it('should render sort buttons', () => {
    renderWithQuery(
      <StockWatchlist quotes={mockQuotes} signals={mockSignals} onSymbolSelect={() => {}} />
    );

    expect(screen.getByText('symbol')).toBeInTheDocument();
    expect(screen.getByText('price')).toBeInTheDocument();
    expect(screen.getByText('change')).toBeInTheDocument();
  });
});
