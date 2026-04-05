import { useDashboardStore } from '../store/dashboard-store';
import { LiveIndicator } from './LiveIndicator';

interface HeaderProps {
  onLoginClick?: () => void;
}

const tabs = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: '📊' },
  { id: 'signals' as const, label: 'Signals', icon: '📡' },
  { id: 'analysis' as const, label: 'Analysis', icon: '🧠' },
  { id: 'ops' as const, label: 'Ops', icon: '⚙️' },
];

export function Header({ onLoginClick }: HeaderProps) {
  const activeTab = useDashboardStore((state) => state.activeTab);
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);
  
  // Check if user is authenticated
  const isAuthenticated = typeof window !== 'undefined' && Boolean(localStorage.getItem('authToken'));

  return (
    <header className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-cyan-500/10 rounded-lg">
              <span className="text-cyan-400 font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-100 leading-tight">Saham AI</h1>
              <span className="text-[10px] text-slate-500 hidden sm:block uppercase tracking-wider">IHSG Analyzer</span>
            </div>
          </div>
          <nav className="flex gap-1 bg-slate-900/50 p-1 rounded-lg" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.icon}</span>
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <LiveIndicator />
            {!isAuthenticated && onLoginClick && (
              <button
                onClick={onLoginClick}
                className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-700/50 rounded-md transition-all"
              >
                Sign In
              </button>
            )}
            {isAuthenticated && (
              <button
                onClick={() => {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('userEmail');
                  window.location.reload();
                }}
                className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-700/50 rounded-md transition-all"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
