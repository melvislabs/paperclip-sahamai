interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  status: 'success' | 'warning' | 'danger' | 'info';
}

const statusColors: Record<string, string> = {
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  info: 'var(--color-info)'
};

export function MetricCard({ title, value, subtitle, status }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        <span
          className="metric-status-dot"
          style={{ backgroundColor: statusColors[status] }}
        />
      </div>
      <div className="metric-value" style={{ color: statusColors[status] }}>
        {value}
      </div>
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    </div>
  );
}
