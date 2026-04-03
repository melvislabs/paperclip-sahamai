export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatuses?: number[];
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableStatuses: [429, 500, 502, 503, 504]
};

export class RetryableError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryable = !(error instanceof RetryableError && error.statusCode && !opts.retryableStatuses?.includes(error.statusCode));

      if (!isRetryable || attempt === opts.maxRetries) {
        throw lastError;
      }

      const delay = Math.min(
        opts.baseDelayMs * Math.pow(2, attempt),
        opts.maxDelayMs
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

export function createErrorHandler(
  onError?: (error: Error, attempt: number, maxRetries: number) => void
) {
  return {
    async execute<T>(fn: () => Promise<T>, options: Partial<RetryOptions> = {}): Promise<T> {
      let attempt = 0;
      const opts: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };

      return withRetry(async () => {
        attempt++;
        try {
          return await fn();
        } catch (error) {
          onError?.(error as Error, attempt, opts.maxRetries);
          throw error;
        }
      }, opts);
    }
  };
}
