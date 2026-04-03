import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SignalsDashboard } from './components/SignalsDashboard';
import { OpsDashboard } from './components/OpsDashboard';
import type { SignalData, OpsMetrics, OpsAlert, DashboardSLO } from './types';

type Tab = 'signals' | 'ops';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('signals');
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [opsMetrics, setOpsMetrics] = useState<OpsMetrics | null>(null);
  const [alerts, setAlerts] = useState<OpsAlert[]>([]);
  const [slo, setSlo] = useState<DashboardSLO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [signalsRes, metricsRes, alertsRes, dashboardRes] = await Promise.all([
        fetch('/v1/signals/latest'),
        fetch('/v1/ops/metrics'),
        fetch('/v1/ops/alerts/latest'),
        fetch('/v1/ops/dashboard/latest')
      ]);

      if (!signalsRes.ok) throw new Error('Failed to fetch signals');
      if (!metricsRes.ok) throw new Error('Failed to fetch metrics');
      if (!alertsRes.ok) throw new Error('Failed to fetch alerts');
      if (!dashboardRes.ok) throw new Error('Failed to fetch dashboard');

      const signalsData = await signalsRes.json();
      const metricsData = await metricsRes.json();
      const alertsData = await alertsRes.json();
      const dashboardData = await dashboardRes.json();

      setSignals(signalsData.data || []);
      setOpsMetrics(metricsData);
      setAlerts(alertsData.alerts || []);
      setSlo(dashboardData.slo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">
            <p>{error}</p>
            <button onClick={fetchData}>Retry</button>
          </div>
        ) : activeTab === 'signals' ? (
          <SignalsDashboard signals={signals} />
        ) : (
          <OpsDashboard metrics={opsMetrics} alerts={alerts} slo={slo} />
        )}
      </main>
    </div>
  );
}

export default App;
