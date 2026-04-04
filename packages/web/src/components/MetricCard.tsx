interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  status: 'success' | 'warning' | 'danger' | 'info';
}

const statusColors: Record<string, string> = {
  success: 'text-emerald-400',
  warning: 'text-yellow-400',
  danger: 'text-red-400',
  info: 'text-blue-400'
};

const dotColors: Record<string, string> = {
  success: 'bg-emerald-400',
  warning: 'bg-yellow-400',
  danger: 'bg-red-400',
  info: 'bg-blue-400'
};

export function MetricCard({ title, value, subtitle, status }: MetricCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 uppercase tracking-wide">{title}</span>
        <span className={`w-2 h-2 rounded-full ${dotColors[status]}`} />
      </div>
      <div className={`text-2xl font-bold mb-1 ${statusColors[status]}`}>
        {value}
      </div>
      {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
    </div>
  );
}
