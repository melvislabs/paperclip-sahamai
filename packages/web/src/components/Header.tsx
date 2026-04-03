interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: 'signals' | 'ops') => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>Saham AI</h1>
          <span className="logo-subtitle">Stock Analysis Dashboard</span>
        </div>
        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'signals' ? 'active' : ''}`}
            onClick={() => onTabChange('signals')}
          >
            Signals
          </button>
          <button
            className={`nav-tab ${activeTab === 'ops' ? 'active' : ''}`}
            onClick={() => onTabChange('ops')}
          >
            Operations
          </button>
        </nav>
      </div>
    </header>
  );
}
