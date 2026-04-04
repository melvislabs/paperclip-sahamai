import { useState, useEffect } from 'react';

interface LiveIndicatorProps {
  lastUpdated?: Date;
  staleThresholdMs?: number;
}

export function LiveIndicator({ lastUpdated, staleThresholdMs = 30_000 }: LiveIndicatorProps) {
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (!lastUpdated) {
      setIsStale(true);
      return;
    }

    const check = () => {
      const elapsed = Date.now() - lastUpdated.getTime();
      setIsStale(elapsed > staleThresholdMs);
    };

    check();
    const interval = setInterval(check, 5_000);
    return () => clearInterval(interval);
  }, [lastUpdated, staleThresholdMs]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center w-2 h-2">
        {!isStale && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${isStale ? 'bg-slate-500' : 'bg-emerald-400'}`} />
      </div>
      <span className={`text-xs ${isStale ? 'text-slate-500' : 'text-emerald-400'}`}>
        {isStale ? 'Stale' : 'Live'}
      </span>
    </div>
  );
}

export function useDataFreshness() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const markFresh = () => {
    setLastUpdated(new Date());
  };

  return { lastUpdated, markFresh };
}
