import type { OpsAlert } from '../types';

interface AlertItemProps {
  alert: OpsAlert;
}

const severityBorderColors: Record<string, string> = {
  info: 'border-l-blue-500',
  warning: 'border-l-yellow-500',
  critical: 'border-l-red-500'
};

const severityBadgeColors: Record<string, string> = {
  info: 'bg-blue-500 text-white',
  warning: 'bg-yellow-500 text-slate-900',
  critical: 'bg-red-500 text-white'
};

const severityBgColors: Record<string, string> = {
  info: 'bg-blue-500/10',
  warning: 'bg-yellow-500/10',
  critical: 'bg-red-500/10'
};

export function AlertItem({ alert }: AlertItemProps) {
  return (
    <div className={`p-4 rounded border-l-4 border-t border-r border-b border-slate-700 ${severityBorderColors[alert.severity]} ${severityBgColors[alert.severity]}`}>
      <div className="flex items-center justify-between mb-2">
        <code className="text-xs text-slate-400">{alert.code}</code>
        <span className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${severityBadgeColors[alert.severity]}`}>
          {alert.severity}
        </span>
      </div>
      <p className="text-sm text-slate-200 mb-1">{alert.message}</p>
      <p className="text-xs text-slate-500">
        {new Date(alert.triggeredAt).toLocaleString()}
      </p>
    </div>
  );
}
