export type SignalAction = 'buy' | 'sell' | 'hold';

export interface LatestSignal {
  symbol: string;
  action: SignalAction;
  confidence: number;
  generatedAt: string;
  expiresAt: string;
  version: string;
  reasonCodes: string[];
}

export interface SignalWithFreshness {
  signal: LatestSignal;
  stale: boolean;
}
