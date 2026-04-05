export interface EnvConfig {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL?: string;
  JWT_SECRET: string;
  JWT_ACCESS_TOKEN_EXPIRY: string;
  JWT_REFRESH_TOKEN_EXPIRY: string;
  STOCK_API_KEY?: string;
  STOCK_API_PROVIDER: 'alpha_vantage' | 'polygon' | 'finnhub';
  OPENAI_API_KEY?: string;
  OPENAI_MODEL: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL: string;
  OPENCODE_API_KEY?: string;
  OPENCODE_MODEL: string;
  OLLAMA_BASE_URL?: string;
  OLLAMA_MODEL: string;
  LLM_FALLBACK_ENABLED: boolean;
  LLM_PROVIDER_PRIORITY: string;
  SIGNAL_TTL_MS: number;
  CACHE_TTL_MS: number;
  ALLOWED_ORIGINS: string;
  REDIS_URL?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  LOG_LEVEL: string;
  SLO_API_ERROR_RATE_THRESHOLD: number;
  SLO_STALE_RATE_THRESHOLD: number;
  SLO_LATENCY_P95_THRESHOLD_MS: number;
  ALERT_CHECK_INTERVAL_MS: number;
  FANOUT_RETRY_MAX_ATTEMPTS: number;
  FANOUT_RETRY_BASE_DELAY_MS: number;
}

const REQUIRED_VARS = ['JWT_SECRET'] as const;

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return isNaN(parsed) ? fallback : parsed;
}

function validate(): string[] {
  const errors: string[] = [];
  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      errors.push(`${key} is required but not set`);
    }
  }
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters');
  }
  const validProviders = ['alpha_vantage', 'polygon', 'finnhub'];
  if (process.env.STOCK_API_PROVIDER && !validProviders.includes(process.env.STOCK_API_PROVIDER)) {
    errors.push(`STOCK_API_PROVIDER must be one of: ${validProviders.join(', ')}`);
  }
  return errors;
}

let cachedConfig: EnvConfig | null = null;

export function loadConfig(): EnvConfig {
  if (cachedConfig) return cachedConfig;

  const errors = validate();
  if (errors.length > 0) {
    throw new Error(`Environment configuration failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  }

  cachedConfig = {
    NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'test' | 'production',
    PORT: parseNumber(process.env.PORT, 3000),
    DATABASE_URL: process.env.DATABASE_URL || undefined,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
    JWT_REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
    STOCK_API_KEY: process.env.STOCK_API_KEY || undefined,
    STOCK_API_PROVIDER: (process.env.STOCK_API_PROVIDER || 'finnhub') as 'alpha_vantage' | 'polygon' | 'finnhub',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || undefined,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || undefined,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
    OPENCODE_API_KEY: process.env.OPENCODE_API_KEY || undefined,
    OPENCODE_MODEL: process.env.OPENCODE_MODEL || 'opencode/claude-3.5-sonnet',
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || undefined,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3.2:3b',
    LLM_FALLBACK_ENABLED: process.env.LLM_FALLBACK_ENABLED === 'true',
    LLM_PROVIDER_PRIORITY: process.env.LLM_PROVIDER_PRIORITY || 'openai,openrouter,opencode,ollama,mock',
    SIGNAL_TTL_MS: parseNumber(process.env.SIGNAL_TTL_MS, 5 * 60 * 1000),
    CACHE_TTL_MS: parseNumber(process.env.CACHE_TTL_MS, 30 * 1000),
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:5173',
    REDIS_URL: process.env.REDIS_URL || undefined,
    SMTP_HOST: process.env.SMTP_HOST || undefined,
    SMTP_PORT: parseNumber(process.env.SMTP_PORT, 587),
    SMTP_USER: process.env.SMTP_USER || undefined,
    SMTP_PASS: process.env.SMTP_PASS || undefined,
    SMTP_FROM: process.env.SMTP_FROM || undefined,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    SLO_API_ERROR_RATE_THRESHOLD: parseNumber(process.env.SLO_API_ERROR_RATE_THRESHOLD, 0.05),
    SLO_STALE_RATE_THRESHOLD: parseNumber(process.env.SLO_STALE_RATE_THRESHOLD, 0.2),
    SLO_LATENCY_P95_THRESHOLD_MS: parseNumber(process.env.SLO_LATENCY_P95_THRESHOLD_MS, 500),
    ALERT_CHECK_INTERVAL_MS: parseNumber(process.env.ALERT_CHECK_INTERVAL_MS, 60_000),
    FANOUT_RETRY_MAX_ATTEMPTS: parseNumber(process.env.FANOUT_RETRY_MAX_ATTEMPTS, 3),
    FANOUT_RETRY_BASE_DELAY_MS: parseNumber(process.env.FANOUT_RETRY_BASE_DELAY_MS, 1000),
  };

  return cachedConfig;
}

export function getConfig(): EnvConfig {
  const config = loadConfig();
  if (!config) {
    throw new Error('Configuration not loaded');
  }
  return config;
}

export function resetConfig(): void {
  cachedConfig = null;
}

export const SIGNAL_TTL_MS = Number(process.env.SIGNAL_TTL_MS ?? 5 * 60 * 1000);
export const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS ?? 30 * 1000);
