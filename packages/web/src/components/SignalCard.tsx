import type { SignalData } from '../types';

interface SignalCardProps {
  signal: SignalData;
}

export function SignalCard({ signal }: SignalCardProps) {
  const actionColors: Record<string, string> = {
    buy: 'var(--color-success)',
    sell: 'var(--color-danger)',
    hold: 'var(--color-warning)'
  };

  const statusLabel = signal.stale ? 'Stale' : signal.status === 'missing' ? 'Missing' : 'Fresh';
  const statusClass = signal.stale ? 'stale' : signal.status === 'missing' ? 'missing' : 'fresh';

  return (
    <div className={`signal-card ${statusClass}`}>
      <div className="signal-header">
        <h3 className="signal-symbol">{signal.symbol}</h3>
        <span className={`signal-status ${statusClass}`}>{statusLabel}</span>
      </div>

      {signal.signal ? (
        <>
          <div className="signal-action" style={{ color: actionColors[signal.signal.action] }}>
            {signal.signal.action.toUpperCase()}
          </div>

          <div className="signal-confidence">
            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{
                  width: `${signal.signal.confidence * 100}%`,
                  backgroundColor: actionColors[signal.signal.action]
                }}
              />
            </div>
            <span className="confidence-value">
              {(signal.signal.confidence * 100).toFixed(0)}%
            </span>
          </div>

          <div className="signal-meta">
            <div className="meta-item">
              <span className="meta-label">Generated</span>
              <span className="meta-value">
                {new Date(signal.signal.generatedAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Expires</span>
              <span className="meta-value">
                {new Date(signal.signal.expiresAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {signal.signal.reasonCodes.length > 0 && (
            <div className="signal-reasons">
              <span className="reasons-label">Reasons:</span>
              <div className="reason-tags">
                {signal.signal.reasonCodes.map((code) => (
                  <span key={code} className="reason-tag">
                    {code.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-muted">No signal data available</p>
      )}
    </div>
  );
}
