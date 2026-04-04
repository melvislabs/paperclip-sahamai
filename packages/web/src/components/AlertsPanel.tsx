import type { OpsAlert } from '../types';

interface AlertsPanelProps {
  alerts?: OpsAlert[];
  loading?: boolean;
}

export function AlertsPanel({ alerts, loading }: AlertsPanelProps) {
  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-24 mb-4" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-700 rounded mb-2" />
        ))}
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Alerts</h3>
        <div className="flex items-center gap-2 text-emerald-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm">All systems operational</p>
        </div>
      </div>
    );
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500 bg-red-500/10';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-500/10';
      default:
        return 'border-l-blue-500 bg-blue-500/10';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-slate-900';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Alerts</h3>
        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
          {alerts.length} active
        </span>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.code}
            className={`p-4 rounded border-l-4 ${getSeverityStyles(alert.severity)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <code className="text-xs text-slate-400">{alert.code}</code>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${getSeverityBadge(alert.severity)}`}>
                {alert.severity}
              </span>
            </div>
            <p className="text-sm text-slate-200 mb-1">{alert.message}</p>
            <p className="text-xs text-slate-500">
              Triggered: {new Date(alert.triggeredAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
