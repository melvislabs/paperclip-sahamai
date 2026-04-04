import { render, screen } from '@testing-library/react';
import { PriceChart } from '../src/components/PriceChart';
import type { PricePoint } from '../src/types';

const mockChartData: PricePoint[] = [
  { timestamp: '2024-01-01T10:00:00Z', open: 9000, high: 9200, low: 8900, close: 9100, volume: 1000000 },
  { timestamp: '2024-01-01T11:00:00Z', open: 9100, high: 9300, low: 9050, close: 9250, volume: 1200000 },
  { timestamp: '2024-01-01T12:00:00Z', open: 9250, high: 9400, low: 9200, close: 9350, volume: 800000 },
];

describe('PriceChart', () => {
  it('should render loading skeleton when loading', () => {
    const { container } = render(
      <PriceChart
        symbol="BBCA"
        data={[]}
        timeRange="1D"
        onTimeRangeChange={() => {}}
        loading={true}
      />
    );
    
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render chart with symbol name', () => {
    render(
      <PriceChart
        symbol="BBCA"
        data={mockChartData}
        timeRange="1D"
        onTimeRangeChange={() => {}}
      />
    );
    
    expect(screen.getByText('BBCA')).toBeInTheDocument();
  });

  it('should display current price from chart data', () => {
    render(
      <PriceChart
        symbol="BBCA"
        data={mockChartData}
        timeRange="1D"
        onTimeRangeChange={() => {}}
      />
    );
    
    expect(screen.getByText('Rp 9.350')).toBeInTheDocument();
  });

  it('should render time range buttons', () => {
    render(
      <PriceChart
        symbol="BBCA"
        data={mockChartData}
        timeRange="1D"
        onTimeRangeChange={() => {}}
      />
    );
    
    expect(screen.getByText('1D')).toBeInTheDocument();
    expect(screen.getByText('1W')).toBeInTheDocument();
    expect(screen.getByText('1M')).toBeInTheDocument();
    expect(screen.getByText('3M')).toBeInTheDocument();
    expect(screen.getByText('1Y')).toBeInTheDocument();
  });

  it('should highlight active time range', () => {
    render(
      <PriceChart
        symbol="BBCA"
        data={mockChartData}
        timeRange="1W"
        onTimeRangeChange={() => {}}
      />
    );
    
    const activeButton = screen.getByText('1W');
    expect(activeButton).toHaveClass('bg-cyan-500');
  });

  it('should show placeholder when no data', () => {
    render(
      <PriceChart
        symbol="BBCA"
        data={[]}
        timeRange="1D"
        onTimeRangeChange={() => {}}
      />
    );
    
    expect(screen.getByText('Select a stock to view chart')).toBeInTheDocument();
  });
});
