import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { TimeRange } from '../types';

interface PricePoint {
  timestamp: string;
  close: number;
  volume: number;
}

interface PriceChartProps {
  symbol: string;
  data?: PricePoint[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  loading?: boolean;
}

const timeRanges: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y'];

export function PriceChart({ symbol, data, timeRange, onTimeRangeChange, loading }: PriceChartProps) {
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((d) => ({
      time: new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      price: d.close,
      volume: d.volume,
    }));
  }, [data]);

  const priceRange = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 100 };
    const prices = chartData.map((d) => d.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [chartData]);

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-32 mb-4" />
        <div className="h-64 bg-slate-700 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{symbol}</h3>
          {chartData.length > 0 && (
            <p className="text-sm text-slate-400">
              Rp {chartData[chartData.length - 1]?.price.toLocaleString('id-ID')}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1 text-xs font-medium rounded ${
                range === timeRange
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      {chartData.length > 0 ? (
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
              <YAxis
                domain={[priceRange.min * 0.99, priceRange.max * 1.01]}
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(v: number) => `Rp ${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#06b6d4"
                fill="url(#colorPrice)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={chartData}>
              <Bar dataKey="volume" fill="#475569" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-slate-500">
          <p className="text-sm">Select a stock to view chart</p>
        </div>
      )}
    </div>
  );
}
