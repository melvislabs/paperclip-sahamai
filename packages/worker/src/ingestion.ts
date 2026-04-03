import type { LatestSignal } from '@sahamai/shared';

export interface DataSourceConfig {
  name: string;
  enabled: boolean;
  intervalMs: number;
}

export interface IngestionResult {
  source: string;
  signalsIngested: number;
  durationMs: number;
  error?: string;
}

export interface IngestionAdapter {
  fetchSignals(): Promise<LatestSignal[]>;
}

export class DataIngestionWorker {
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(
    private readonly adapter: IngestionAdapter,
    private readonly config: DataSourceConfig,
    options: { now?: () => number; sleep?: (ms: number) => Promise<void> } = {}
  ) {
    this.now = options.now ?? (() => Date.now());
    this.sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  async ingest(): Promise<IngestionResult> {
    const startedAt = this.now();

    try {
      const signals = await this.adapter.fetchSignals();

      return {
        source: this.config.name,
        signalsIngested: signals.length,
        durationMs: Math.max(0, this.now() - startedAt)
      };
    } catch (error) {
      return {
        source: this.config.name,
        signalsIngested: 0,
        durationMs: Math.max(0, this.now() - startedAt),
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async runLoop(onResult?: (result: IngestionResult) => void): Promise<void> {
    while (this.config.enabled) {
      const result = await this.ingest();
      onResult?.(result);
      await this.sleep(this.config.intervalMs);
    }
  }
}
