import type { SignalData } from '../types';

interface SignalCardProps {
  signal: SignalData;
}

export function SignalCard({ signal }: SignalCardProps) {
  const actionColors: Record<string, string> = {
    buy: 'text-emerald-400',
    sell: 'text-red-400',
    hold: 'text-yellow-400'
  };

  const statusLabel = signal.stale ? 'Stale' : signal.status === 'missing' ? 'Missing' : 'Fresh';
  const statusClass = signal.stale ? 'stale' : signal.status === 'missing' ? 'missing' : 'fresh';

  const statusBadgeClass = statusClass === 'fresh'
    ? 'bg-emerald-500/20 text-emerald-400'
    : statusClass === 'stale'
    ? 'bg-yellow-500/20 text-yellow-400'
    : 'bg-red-500/20 text-red-400';

  const actionColor = actionColors[signal.signal?.action || 'hold'] || 'text-slate-300';

  return (
    <div className={`bg-slate-800 rounded-lg p-5 border border-slate-700 hover:border-slate-600 transition-all hover:-translate-y-0.5 ${statusClass === 'stale' ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold text-slate-100">{signal.symbol}</h3>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase ${statusBadgeClass}`}>
          {statusLabel}
        </span>
      </div>

      {signal.signal ? (
        <>
          <div className={`text-3xl font-bold mb-4 uppercase tracking-wider ${actionColor}`}>
            {signal.signal.action}
          </div>

          <div className="mb-4">
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all ${
                  signal.signal.action === 'buy' ? 'bg-emerald-500' :
                  signal.signal.action === 'sell' ? 'bg-red-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${signal.signal.confidence * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">
              {(signal.signal.confidence * 100).toFixed(0)}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-900 rounded-md">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 uppercase tracking-wide">Generated</span>
              <span className="text-sm font-medium text-slate-200">
                {new Date(signal.signal.generatedAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 uppercase tracking-wide">Expires</span>
              <span className="text-sm font-medium text-slate-200">
                {new Date(signal.signal.expiresAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {signal.signal.reasonCodes.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-slate-500">Reasons:</span>
              <div className="flex flex-wrap gap-1.5">
                {signal.signal.reasonCodes.map((code) => (
                  <span key={code} className="px-2.5 py-1 bg-slate-900 rounded-full text-xs text-slate-400">
                    {code.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-500">No signal data available</p>
      )}
    </div>
  );
}
