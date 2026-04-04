import { render, screen } from '@testing-library/react';
import { SignalsDashboard } from '../src/components/SignalsDashboard';
import type { SignalData } from '../src/types';

function createMockSignal(overrides: Partial<SignalData> = {}): SignalData {
  return {
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
      reasonCodes: ['RSI oversold', 'MACD bullish crossover']
    },
    ...overrides
  };
}

describe('SignalsDashboard', () => {
  it('should render empty state when no signals', () => {
    render(<SignalsDashboard signals={[]} />);
    expect(screen.getByText('No signals available')).toBeInTheDocument();
  });

  it('should render fresh signals correctly', () => {
    const signals = [createMockSignal()];
    render(<SignalsDashboard signals={signals} />);
    
    expect(screen.getByText('1 Fresh')).toBeInTheDocument();
    expect(screen.getByText('BBCA')).toBeInTheDocument();
    expect(screen.getByText('buy')).toBeInTheDocument();
  });

  it('should render stale signals with correct badge', () => {
    const signals = [createMockSignal({ stale: true, status: 'stale' })];
    render(<SignalsDashboard signals={signals} />);
    
    expect(screen.getByText('1 Stale')).toBeInTheDocument();
  });

  it('should render missing signals with correct badge', () => {
    const signals: SignalData[] = [{ symbol: 'TLKM', status: 'missing', stale: true }];
    render(<SignalsDashboard signals={signals} />);
    
    expect(screen.getByText('1 Missing')).toBeInTheDocument();
  });

  it('should display correct counts for mixed signals', () => {
    const signals: SignalData[] = [
      createMockSignal({ symbol: 'BBCA' }),
      createMockSignal({ symbol: 'TLKM', stale: true, status: 'stale' }),
      { symbol: 'BBRI', status: 'missing', stale: true }
    ];
    render(<SignalsDashboard signals={signals} />);
    
    expect(screen.getByText('1 Fresh')).toBeInTheDocument();
    expect(screen.getByText('1 Stale')).toBeInTheDocument();
    expect(screen.getByText('1 Missing')).toBeInTheDocument();
  });

  it('should render sell signal with correct styling', () => {
    const signals = [createMockSignal({ 
      signal: { 
        symbol: 'BBCA',
        action: 'sell', 
        confidence: 0.7,
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 300000).toISOString(),
        version: '1.0.0',
        reasonCodes: ['RSI overbought']
      }
    })];
    render(<SignalsDashboard signals={signals} />);
    
    expect(screen.getByText('sell')).toBeInTheDocument();
  });

  it('should render hold signal with correct styling', () => {
    const signals = [createMockSignal({ 
      signal: { 
        symbol: 'BBCA',
        action: 'hold', 
        confidence: 0.5,
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 300000).toISOString(),
        version: '1.0.0',
        reasonCodes: []
      }
    })];
    render(<SignalsDashboard signals={signals} />);
    
    expect(screen.getByText('hold')).toBeInTheDocument();
  });
});
