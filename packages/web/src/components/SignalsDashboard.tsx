import { SignalCard } from './SignalCard';
import type { SignalData } from '../types';

interface SignalsDashboardProps {
  signals: SignalData[];
}

export function SignalsDashboard({ signals }: SignalsDashboardProps) {
  const freshSignals = signals.filter(s => !s.stale && s.signal);
  const staleSignals = signals.filter(s => s.stale && s.signal);
  const missingSignals = signals.filter(s => s.status === 'missing');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-semibold text-slate-100">Trading Signals</h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
            {freshSignals.length} Fresh
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            {staleSignals.length} Stale
          </span>
          {missingSignals.length > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
              {missingSignals.length} Missing
            </span>
          )}
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-lg mb-2">No signals available</p>
          <p className="text-sm">Signals will appear here when the system generates them</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {signals.map((signal) => (
            <SignalCard key={signal.symbol} signal={signal} />
          ))}
        </div>
      )}
    </div>
  );
}
