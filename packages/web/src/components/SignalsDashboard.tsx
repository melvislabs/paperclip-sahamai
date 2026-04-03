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
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Trading Signals</h2>
        <div className="signal-summary">
          <span className="summary-badge fresh">{freshSignals.length} Fresh</span>
          <span className="summary-badge stale">{staleSignals.length} Stale</span>
          {missingSignals.length > 0 && (
            <span className="summary-badge missing">{missingSignals.length} Missing</span>
          )}
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="empty-state">
          <p>No signals available</p>
          <p className="text-muted">Signals will appear here when the system generates them</p>
        </div>
      ) : (
        <div className="signal-grid">
          {signals.map((signal) => (
            <SignalCard key={signal.symbol} signal={signal} />
          ))}
        </div>
      )}
    </div>
  );
}
