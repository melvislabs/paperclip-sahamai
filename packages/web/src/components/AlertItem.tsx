import type { OpsAlert } from '../types';

interface AlertItemProps {
  alert: OpsAlert;
}

const severityColors: Record<string, string> = {
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
  critical: 'var(--color-danger)'
};

export function AlertItem({ alert }: AlertItemProps) {
  return (
    <div className="alert-item" style={{ borderLeftColor: severityColors[alert.severity] }}>
      <div className="alert-header">
        <span className="alert-code">{alert.code}</span>
        <span
          className="alert-severity"
          style={{ backgroundColor: severityColors[alert.severity] }}
        >
          {alert.severity}
        </span>
      </div>
      <p className="alert-message">{alert.message}</p>
      <div className="alert-meta">
        <span className="alert-time">
          {new Date(alert.triggeredAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
