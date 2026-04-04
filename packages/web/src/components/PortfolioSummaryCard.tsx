import { Skeleton } from './Skeleton';
import type { PortfolioSummary } from '../types';

interface PortfolioSummaryProps {
  summary?: PortfolioSummary;
  loading?: boolean;
}

export function PortfolioSummaryCard({ summary, loading }: PortfolioSummaryProps) {
  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <Skeleton variant="text" className="w-32 mb-4" />
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <Skeleton variant="text" className="w-48 h-8 mb-2" />
            <Skeleton variant="text" className="w-24" />
          </div>
          <div>
            <Skeleton variant="text" className="w-40 h-8 mb-2" />
            <Skeleton variant="text" className="w-32" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" className="w-20 h-3" />
          <Skeleton variant="text" className="w-full h-2" />
          <Skeleton variant="text" className="w-full h-2" />
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Portfolio</h3>
        <p className="text-slate-500 text-sm">No portfolio data available</p>
      </div>
    );
  }

  const isPositive = summary.totalGainLoss >= 0;

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Portfolio Summary</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-2xl font-bold text-slate-100">
            Rp {summary.totalValue.toLocaleString('id-ID')}
          </p>
          <p className="text-sm text-slate-400">Total Value</p>
        </div>
        <div>
          <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{summary.totalGainLossPercent.toFixed(2)}%
          </p>
          <p className="text-sm text-slate-400">
            {isPositive ? '+' : ''}Rp {Math.abs(summary.totalGainLoss).toLocaleString('id-ID')}
          </p>
        </div>
      </div>
      {summary.sectorAllocation.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-slate-400 uppercase mb-2">Sector Allocation</h4>
          <div className="space-y-2">
            {summary.sectorAllocation.map((sector) => (
              <div key={sector.sector} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{sector.sector}</span>
                    <span className="text-slate-400">{sector.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all"
                      style={{ width: `${sector.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
