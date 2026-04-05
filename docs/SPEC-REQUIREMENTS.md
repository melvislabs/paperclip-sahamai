# Saham AI — Specification & Requirements

> AI-powered stock analysis platform for Indonesian equities (IHSG).
> Version: 0.2.1 | Last updated: 2026-04-05

## 1. Product Vision

Build a reliable, low-latency AI stock analysis platform that provides actionable trading signals for Indonesian stocks. The system combines deterministic technical analysis with multi-provider LLM-powered insights and intelligent fallback, plus sentiment fusion, delivered through a REST API, WebSocket, and web dashboard.

### Target Users

| User Type | Description |
|-----------|-------------|
| Retail traders | Individual Indonesian stock investors seeking AI-assisted trading signals |
| Portfolio managers | Users managing multiple stock positions who need aggregated insights |
| Developers | Third-party integrators using the API for custom trading tools |

### Core Value Propositions

1. **Multi-provider AI-augmented analysis** — Technical indicators + intelligent LLM fallback (OpenAI, OpenRouter, OpenCode, Ollama) + sentiment fusion in one pipeline
2. **Freshness guarantees** — Signals have explicit TTL; stale signals are never served as fresh
3. **Multi-channel delivery** — Signals delivered via API, WebSocket, Telegram, Slack, email
4. **Operational transparency** — SLO tracking, alerting, and observability built in
5. **IHSG focus** — Optimized for Indonesian Stock Exchange characteristics

---

## 2. Functional Requirements

### FR-1: User Authentication & Authorization

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-1.1 | Email/password registration with password strength validation | P0 | ✅ Done |
| FR-1.2 | Login with account lockout (5 attempts, 15min cooldown) | P0 | ✅ Done |
| FR-1.3 | JWT access tokens (15min) + refresh tokens (7d) with rotation | P0 | ✅ Done |
| FR-1.4 | Google OAuth login, account linking, unlinking | P1 | ✅ Done |
| FR-1.5 | API key management (create, revoke) for programmatic access | P1 | ✅ Done |
| FR-1.6 | Role hierarchy: service < user < admin | P0 | ✅ Done |
| FR-1.7 | User profile management (view, update) | P1 | ✅ Done |

### FR-2: Stock Data Ingestion

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-2.1 | Real-time quote fetching from stock data providers | P0 | ✅ Done |
| FR-2.2 | Historical OHLCV data fetching (configurable intervals) | P0 | ✅ Done |
| FR-2.3 | News article fetching per symbol | P1 | ✅ Done |
| FR-2.4 | Stock search by name/symbol | P1 | ✅ Done |
| FR-2.5 | Multi-provider support (Finnhub, Alpha Vantage, Polygon) | P1 | ✅ Done |
| FR-2.6 | Rate limiting per provider API constraints | P0 | ✅ Done |
| FR-2.7 | Response caching to reduce API calls | P1 | ✅ Done |
| FR-2.8 | Scheduled ingestion jobs (quotes, history, news) | P1 | ⚠️ Implemented, not wired |
| FR-2.9 | Retry with exponential backoff on provider failures | P1 | ✅ Done |

### FR-3: Technical Analysis

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-3.1 | RSI (14-period, Wilder smoothing) | P0 | ✅ Done |
| FR-3.2 | MACD (12/26/9, histogram crossover detection) | P0 | ✅ Done |
| FR-3.3 | Bollinger Bands (20-period, 2σ, %B calculation) | P0 | ✅ Done |
| FR-3.4 | Simple Moving Averages (20, 50, 200 periods) | P0 | ✅ Done |
| FR-3.5 | Exponential Moving Averages (12, 26 periods) | P0 | ✅ Done |
| FR-3.6 | Volume analysis (current vs 20-day average) | P1 | ✅ Done |
| FR-3.7 | Trend detection (short/medium/long term) | P1 | ✅ Done |
| FR-3.8 | Volatility assessment (bandwidth-based) | P2 | ✅ Done |
| FR-3.9 | Technical scoring (-100 to +100 scale) | P0 | ✅ Done |

### FR-4: AI Analysis Pipeline

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-4.1 | Multi-provider LLM analysis (OpenAI, OpenRouter, OpenCode, Ollama) | P0 | ✅ Done |
| FR-4.2 | Intelligent LLM fallback with configurable priority order | P0 | ✅ Done |
| FR-4.3 | Mock LLM fallback when no API keys configured | P0 | ✅ Done |
| FR-4.4 | Sentiment fusion (60% technical + 40% sentiment weighting) | P0 | ✅ Done |
| FR-4.5 | Graceful degradation to technical-only if all LLM providers fail | P0 | ✅ Done |
| FR-4.6 | Analysis result caching (1hr TTL) | P1 | ✅ Done |
| FR-4.7 | Structured JSON output from all LLM providers | P1 | ✅ Done |
| FR-4.8 | Analysis types: TECHNICAL, FUNDAMENTAL, SENTIMENT, PORTFOLIO_RISK, DAILY_DIGEST | P1 | ⚠️ Types defined, only TECHNICAL fully wired |

### FR-5: Signal Generation & Delivery

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-5.1 | Signal generation with action (buy/sell/hold), confidence (0-1), reason codes | P0 | ✅ Done |
| FR-5.2 | Signal freshness via TTL (default 5min) | P0 | ✅ Done |
| FR-5.3 | Single symbol signal endpoint (404 if missing, 503 if stale) | P0 | ✅ Done |
| FR-5.4 | Batch signal endpoint with stale/missing status | P0 | ✅ Done |
| FR-5.5 | Signal summary/freshness aggregate endpoint | P1 | ✅ Done |
| FR-5.6 | Multi-channel fanout delivery (Telegram, Slack, Email) | P1 | ✅ Done |
| FR-5.7 | Idempotent delivery with retry/backoff/dead-letter | P1 | ✅ Done |
| FR-5.8 | Real-time signal broadcast via WebSocket | P1 | ✅ Done |

### FR-6: Price Alerts

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-6.1 | Create price alerts (ABOVE, BELOW, PERCENT_CHANGE conditions) | P1 | ✅ Done |
| FR-6.2 | Alert CRUD (create, read, update, delete) | P1 | ✅ Done |
| FR-6.3 | Alert history tracking | P2 | ✅ Done |
| FR-6.4 | Alert condition evaluation with cooldown | P1 | ✅ Done |
| FR-6.5 | In-app notification delivery | P1 | ✅ Done |
| FR-6.6 | Email notification delivery | P1 | ✅ Done |
| FR-6.7 | Push notification delivery | P2 | ❌ Not implemented |

### FR-7: Portfolio Management

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-7.1 | Portfolio CRUD (create, read, update, delete) | P1 | ✅ Done |
| FR-7.2 | Holdings management (add/remove stocks) | P1 | ✅ Done |
| FR-7.3 | Portfolio value tracking | P2 | ✅ Done |
| FR-7.4 | Gain/loss calculation | P2 | ✅ Done |
| FR-7.5 | Sector allocation breakdown | P2 | ✅ Done |

### FR-8: Watchlist

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-8.1 | User watchlist management | P1 | ✅ Done |
| FR-8.2 | Watchlist with real-time quotes | P1 | ✅ Done |
| FR-8.3 | Sortable watchlist by various metrics | P2 | ✅ Done |

### FR-9: Dashboard & UI

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-9.1 | Signals dashboard with freshness indicators | P0 | ✅ Done |
| FR-9.2 | AI analysis report page (technical, multi-provider LLM, sentiment sections) | P1 | ✅ Done |
| FR-9.3 | Price chart with volume bars and time range selector | P1 | ✅ Done |
| FR-9.4 | Operations dashboard (SLO metrics, alerts, model usage) | P1 | ✅ Done |
| FR-9.5 | Market overview panel | P2 | ✅ Done |
| FR-9.6 | Portfolio summary card | P2 | ✅ Done |

### FR-10: Observability & Operations

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-10.1 | HTTP request metrics (count, error rate, latency) | P0 | ✅ Done |
| FR-10.2 | Signal freshness tracking | P0 | ✅ Done |
| FR-10.3 | Delivery channel metrics (success/failure per channel) | P1 | ✅ Done |
| FR-10.4 | Model usage tracking (calls, tokens, cost) | P1 | ✅ Done |
| FR-10.5 | Alert evaluation (error rate, freshness, channel health, cost spikes) | P1 | ✅ Done |
| FR-10.6 | SLO dashboard payload | P1 | ✅ Done |
| FR-10.7 | Swagger/OpenAPI documentation at `/docs` | P1 | ✅ Done |

### FR-11: Digest & Notifications

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-11.1 | Digest email preferences (view, update) | P2 | ✅ Done |
| FR-11.2 | Daily digest email generation and sending | P2 | ✅ Done |
| FR-11.3 | Digest template with signals summary | P2 | ✅ Done |

---

## 3. Non-Functional Requirements

### NFR-1: Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1.1 | Signal endpoint response time (p95) | < 500ms |
| NFR-1.2 | Analysis endpoint response time (p95) | < 5000ms |
| NFR-1.3 | Stock quote response time (p95) | < 2000ms (depends on provider) |
| NFR-1.4 | WebSocket connection limit per user | 10 |
| NFR-1.5 | Rate limiting (global) | 100 req/min |
| NFR-1.6 | Rate limiting (auth endpoints) | 10 req/min |

### NFR-2: Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-2.1 | Signal freshness — stale signals must NOT be served as fresh | 100% |
| NFR-2.2 | API error rate | < 5% |
| NFR-2.3 | Signal staleness rate | < 20% |
| NFR-2.4 | Fanout delivery retry attempts | 3 with exponential backoff |
| NFR-2.5 | Graceful degradation when all LLM providers unavailable | Required | ✅ Done |

### NFR-3: Security

| ID | Requirement | Status |
|----|-------------|--------|
| NFR-3.1 | Helmet security headers (CSP, HSTS, frameguard) | ✅ Done |
| NFR-3.2 | CORS with configurable origins | ✅ Done |
| NFR-3.3 | JWT secret minimum 32 characters | ✅ Done |
| NFR-3.4 | Password hashing (bcrypt) | ✅ Done |
| NFR-3.5 | API key bcrypt hashing (server-side only) | ✅ Done |
| NFR-3.6 | Refresh token rotation | ✅ Done |
| NFR-3.7 | Account lockout after failed attempts | ✅ Done |
| NFR-3.8 | No secrets in git history | ✅ Done |
| NFR-3.9 | Input validation via TypeBox schemas | ✅ Done |

### NFR-4: Scalability

| ID | Requirement | Status |
|----|-------------|--------|
| NFR-4.1 | Stateless API server (horizontal scaling ready) | ✅ Done |
| NFR-4.2 | In-memory signal store (single-instance only) | ⚠️ Needs migration to persistent store |
| NFR-4.3 | Redis caching layer configured but not wired | ❌ Not wired |
| NFR-4.4 | Event bus for pub/sub decoupling | ❌ Not started |

### NFR-5: Maintainability

| ID | Requirement | Status |
|----|-------------|--------|
| NFR-5.1 | TypeScript across all packages | ✅ Done |
| NFR-5.2 | Unit test coverage | ✅ 20+ test files |
| NFR-5.3 | CI pipeline (lint, test, build) | ✅ Done |
| NFR-5.4 | Docker multi-stage builds | ✅ Done |
| NFR-5.5 | Swagger auto-generated API docs | ✅ Done |

---

## 4. Data Contracts

### 4.1 LatestSignal

```typescript
interface LatestSignal {
  symbol: string;           // e.g., "BBCA"
  action: 'buy' | 'sell' | 'hold';
  confidence: number;       // 0-1
  generatedAt: string;      // ISO 8601 timestamp
  expiresAt: string;        // ISO 8601 timestamp — stale when <= now
  version: string;          // e.g., "signal-registry-v1"
  reasonCodes: string[];    // e.g., ["trend_up", "volume_confirmation"]
}
```

**Freshness rule:** `expiresAt <= now` means stale. Stale signals must NOT be treated as tradable.

### 4.2 SignalWithFreshness

```typescript
interface SignalWithFreshness {
  signal: LatestSignal;
  stale: boolean;
  status: 'fresh' | 'stale' | 'missing';
}
```

### 4.3 AIAnalysisResult

```typescript
interface AIAnalysisResult {
  symbol: string;
  analysisType: 'TECHNICAL' | 'FUNDAMENTAL' | 'SENTIMENT' | 'PORTFOLIO_RISK' | 'DAILY_DIGEST';
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  technicalAnalysis?: TechnicalAnalysisResult;
  llmAnalysis?: LLMAnalysisResult;
  sentimentFusion?: SentimentFusionResult;
  summary: string;
  keyPoints: string[];
  metadata: {
    modelUsed?: string;
    dataPoints: number;
    processingTimeMs: number;
    version: string;
  };
}
```

### 4.4 TechnicalAnalysisResult

```typescript
interface TechnicalAnalysisResult {
  indicators: {
    rsi: { value: number; signal: 'overbought' | 'oversold' | 'neutral' };
    macd: { value: number; signal: number; histogram: number; trend: 'bullish' | 'bearish' | 'neutral' };
    bollingerBands: { upper: number; middle: number; lower: number; percentB: number; signal: 'overbought' | 'oversold' | 'neutral' };
    sma: { sma20: number; sma50: number; sma200: number };
    ema: { ema12: number; ema26: number };
    volume: { current: number; average: number; ratio: number; signal: 'high' | 'normal' | 'low' };
  };
  trend: { shortTerm: 'up' | 'down' | 'neutral'; mediumTerm: 'up' | 'down' | 'neutral'; longTerm: 'up' | 'down' | 'neutral' };
  volatility: 'low' | 'medium' | 'high';
  score: number;            // -100 to +100
  signals: { bullish: number; bearish: number; neutral: number };
}
```

### 4.5 Risk Level Mapping

| Risk Level | Confidence Threshold |
|------------|---------------------|
| LOW | > 0.7 |
| MEDIUM | > 0.4 |
| HIGH | > 0.2 |
| CRITICAL | <= 0.2 |

---

## 5. API Reference

### 5.1 Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | None | Health check |

### 5.2 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/auth/register` | None | User registration |
| POST | `/v1/auth/login` | None | Login |
| POST | `/v1/auth/refresh` | None | Token refresh |
| POST | `/v1/auth/logout` | JWT | Logout |
| GET | `/v1/auth/google` | None | Google OAuth init |
| GET | `/v1/auth/google/callback` | None | Google OAuth callback |
| POST | `/v1/auth/link/google` | JWT | Link Google account |
| DELETE | `/v1/auth/unlink/google` | JWT | Unlink Google |
| POST | `/v1/auth/api-keys` | JWT+Admin | Create API key |
| DELETE | `/v1/auth/api-keys/:keyId` | JWT+Admin | Revoke API key |

### 5.3 Signals

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/v1/signals/latest/:symbol` | Required | Single symbol signal |
| GET | `/v1/signals/latest?symbols=BBCA,TLKM` | Required | Batch signals |
| GET | `/v1/signals/summary/latest` | Required | Freshness summary |

### 5.4 Analysis

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/analysis/:symbol` | Required | Run AI analysis |
| GET | `/v1/analysis/:symbol/latest` | Required | Get latest analysis |

### 5.5 Stocks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/v1/stocks/:symbol/quote` | Required | Real-time quote |
| GET | `/v1/stocks/:symbol/history` | Required | OHLCV history |
| GET | `/v1/stocks/:symbol/news` | Required | Stock news |
| GET | `/v1/stocks/search?q=...` | Required | Search stocks |
| GET | `/v1/market/overview` | None | Market overview (indices, movers, session status) |

### 5.6 Alerts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/alerts` | Required | Create price alert |
| GET | `/v1/alerts` | Required | List user alerts |
| GET | `/v1/alerts/:id` | Required | Get alert |
| PATCH | `/v1/alerts/:id` | Required | Update alert |
| DELETE | `/v1/alerts/:id` | Required | Delete alert |
| GET | `/v1/alerts/history` | Required | Alert history |

### 5.7 Portfolios

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/v1/portfolios` | Required | List portfolios |
| POST | `/v1/portfolios` | Required | Create portfolio |
| GET | `/v1/portfolios/:id` | Required | Portfolio + holdings |
| PATCH | `/v1/portfolios/:id` | Required | Update portfolio |
| DELETE | `/v1/portfolios/:id` | Required | Delete portfolio |
| POST | `/v1/portfolios/:id/stocks` | Required | Add holding |
| DELETE | `/v1/portfolios/:id/stocks/:symbol` | Required | Remove holding |
| GET | `/v1/portfolio/summary` | Required | Portfolio summary (value, gain/loss, sector allocation) |

### 5.8 Watchlist

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/v1/watchlist` | Required | List symbols in order |
| POST | `/v1/watchlist` | Required | Add symbol (`{ symbol }`); returns full list |
| PUT | `/v1/watchlist` | Required | Replace ordered list (`{ symbols: string[] }`) |
| DELETE | `/v1/watchlist/:symbol` | Required | Remove symbol; returns updated list |

### 5.9 Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/v1/users/me` | Required | User profile |
| PATCH | `/v1/users/me` | Required | Update profile |

### 5.10 Settings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/v1/settings/digest` | Required | Get digest preferences |
| PATCH | `/v1/settings/digest` | Required | Update digest preferences |

### 5.11 Operations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/v1/ops/metrics` | Required | Operational metrics |
| GET | `/v1/ops/dashboard/latest` | Required | SLO dashboard payload |
| GET | `/v1/ops/alerts/latest` | Required | Active alerts |

### 5.12 WebSocket

| Endpoint | Auth | Description |
|----------|------|-------------|
| `/v1/ws` | WS Token | Real-time subscriptions (price, signals, alerts, analysis, portfolio) |

### 5.13 Documentation

| Endpoint | Auth | Description |
|----------|------|-------------|
| `/docs` | None | Swagger/OpenAPI interactive documentation |

---

## 6. Architecture

### 6.1 Monorepo Structure

```
paperclip-sahamai/
├── packages/
│   ├── shared/       # @sahamai/shared — Core library (types, AI analysis, stock API, cache, store, fanout, observability)
│   ├── api/          # @sahamai/api    — Fastify HTTP server (signals, analysis, stocks, auth, alerts, portfolios, WebSocket)
│   ├── worker/       # @sahamai/worker — Data ingestion worker (quotes, history, news, price alert monitoring)
│   └── web/          # @sahamai/web    — React/Vite frontend dashboard
├── docs/             # Architecture, deployment, CI/CD, security docs
├── postman/          # Postman collections and environments
├── Dockerfile        # Main API image
├── Dockerfile.worker # Worker image
└── docker-compose.yml # PostgreSQL + Redis
```

### 6.2 Data Flow

```
Market Data Providers (Finnhub/Alpha Vantage/Polygon)
  → StockApiClient (rate-limited, cached, retried)
  → Technical Analysis (RSI, MACD, BB, SMA, EMA, Volume)
  → Multi-provider LLM Analysis (OpenAI, OpenRouter, OpenCode, Ollama, Mock)
  → Sentiment Fusion (60% technical + 40% sentiment)
  → AIAnalysisResult
  → Signal Registry (in-memory, TTL-based)
  → API Response / WebSocket Broadcast / Fanout Delivery

User Requests (Web Dashboard / API Client)
  → Auth Middleware (JWT / API Key)
  → Signal/Analysis/Stock Endpoints
  → Response with freshness status

Price Alerts
  → AlertManager (Prisma CRUD)
  → AlertMonitor (condition evaluation, cooldown)
  → Notifier (in-app + email + push stub)
```

### 6.3 Technology Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript 5.7 |
| Runtime | Node.js |
| API Framework | Fastify 5 |
| Database | PostgreSQL 16 + Prisma 7 |
| Cache | Redis 7 (configured, not wired) |
| Frontend | React 19 + Vite 6 + TailwindCSS 4 |
| State Management | Zustand 5 + TanStack Query 5 |
| Charts | Recharts 3 |
| Auth | JWT + bcrypt + Google OAuth |
| API Docs | Swagger/OpenAPI |
| Testing | Vitest 2 + Testing Library |
| CI/CD | GitHub Actions |
| Containerization | Docker (multi-stage) |
| Orchestration | Paperclip (agent coordination) |

---

## 7. Environment Configuration

### Required Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `JWT_SECRET` | JWT signing key (min 32 chars) | — (required) |

### Application

| Variable | Purpose | Default |
|----------|---------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | HTTP server port | `3000` |
| `LOG_LEVEL` | Logging level | `info` |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `http://localhost:5173` |

### Database

| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — |

### Stock Data

| Variable | Purpose | Default |
|----------|---------|---------|
| `STOCK_API_KEY` | Stock data provider API key | — (mock mode if empty) |
| `STOCK_API_PROVIDER` | Provider: `finnhub`, `alpha_vantage`, `polygon` | `finnhub` |

### AI / LLM

| Variable | Purpose | Default |
|----------|---------|---------|
| `OPENAI_API_KEY` | OpenAI API key | — (falls back to mock) |
| `OPENAI_MODEL` | OpenAI model name | `gpt-4` |
| `OPENROUTER_API_KEY` | OpenRouter multi-model API key | — (optional) |
| `OPENROUTER_MODEL` | OpenRouter model name | `anthropic/claude-3.5-sonnet` |
| `OPENCODE_API_KEY` | OpenCode developer AI API key | — (optional) |
| `OPENCODE_MODEL` | OpenCode model name | `opencode/claude-3.5-sonnet` |
| `OLLAMA_BASE_URL` | Ollama local LLM endpoint | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model name | `llama3.2:3b` |
| `LLM_FALLBACK_ENABLED` | Enable multi-provider fallback | `true` |
| `LLM_PROVIDER_PRIORITY` | Provider priority order | `openai,openrouter,opencode,ollama,mock` |

### TTLs

| Variable | Purpose | Default |
|----------|---------|---------|
| `SIGNAL_TTL_MS` | Signal time-to-live | `300000` (5min) |
| `CACHE_TTL_MS` | Response cache TTL | `30000` (30s) |

### Email / SMTP

| Variable | Purpose | Default |
|----------|---------|---------|
| `SMTP_HOST` | SMTP server | — |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `SMTP_FROM` | From email address | — |
| `APP_URL` | Base URL for digest links | `https://sahamai.app` |
| `DIGEST_EMAIL_ENABLED` | Run digest sender from worker (`false` disables cron job) | `true` |

Daily digests: worker invokes `runDigestEmailBatch` every minute (matches each user’s `deliveryTime` in their timezone, once per calendar day). SMTP must be configured. Manual run: `npm run digest:send -w @sahamai/api`.

### SLO Thresholds

| Variable | Purpose | Default |
|----------|---------|---------|
| `SLO_API_ERROR_RATE_THRESHOLD` | Error rate alert threshold | `0.05` |
| `SLO_STALE_RATE_THRESHOLD` | Stale signal rate threshold | `0.2` |
| `SLO_LATENCY_P95_THRESHOLD_MS` | Latency p95 threshold | `500` |

### Alert & Fanout

| Variable | Purpose | Default |
|----------|---------|---------|
| `ALERT_CHECK_INTERVAL_MS` | Alert check frequency | `60000` |
| `FANOUT_RETRY_MAX_ATTEMPTS` | Delivery retry attempts | `3` |
| `FANOUT_RETRY_BASE_DELAY_MS` | Retry base delay | `1000` |

---

## 8. Known Gaps & Improvement Backlog

### 8.1 Critical (P0)

| ID | Gap | Impact | Proposed Solution |
|----|-----|--------|-------------------|
| GAP-1 | In-memory signal store — not persistent | Signals lost on restart, no multi-instance support | Migrate to PostgreSQL or Redis-backed store |
| GAP-2 | ~~Web frontend calls non-existent endpoints~~ | ~~404 errors in dashboard~~ | ✅ Addressed — `/v1/portfolio/summary`, `/v1/market/overview` implemented |
| GAP-3 | ~~Worker has no entry point~~ | ~~No automated data ingestion~~ | ✅ Addressed — `packages/worker/src/main.ts` + cron jobs |
| GAP-4 | ~~Web stock endpoints lack auth headers~~ | ~~401 errors on quote/watchlist calls~~ | ✅ Addressed — Bearer token on `fetchApi` |

### 8.2 High Priority (P1)

| ID | Gap | Impact | Proposed Solution |
|----|-----|--------|-------------------|
| GAP-5 | Redis configured but not used | No shared caching across instances | Wire Redis client into cache layer |
| GAP-6 | News sentiment is pre-classified, not analyzed | No NLP sentiment analysis | Add text-based sentiment analysis (e.g., VADER, transformer model) |
| GAP-7 | ~~No watchlist backend~~ | ~~Users cannot save/manage watchlists~~ | ✅ Addressed — Prisma `WatchlistItem` + `/v1/watchlist` |
| GAP-8 | Push notifications stubbed | Mobile users get no push alerts | Integrate Firebase Cloud Messaging or OneSignal |
| GAP-9 | ~~Digest email preferences stored but never sent~~ | ~~No actual digest emails~~ | ✅ Addressed — `runDigestEmailBatch` + worker cron / `npm run digest:send` |
| GAP-10 | ~~No portfolio summary/gain-loss/sector endpoints~~ | ~~Portfolio dashboard incomplete~~ | ✅ Addressed — `GET /v1/portfolio/summary` |

### 8.3 Medium Priority (P2)

| ID | Gap | Impact | Proposed Solution |
|----|-----|--------|-------------------|
| GAP-11 | No event bus | Tight coupling between components | Add NATS/SQS/Kafka for pub/sub |
| GAP-12 | No runbook docs for alert codes | Operators lack troubleshooting guides | Create runbook for each alert code |
| GAP-13 | ~~No multi-model LLM fallback~~ | ~~Single point of failure for LLM~~ | ✅ **COMPLETED**: Added model rotation/fallback chain with OpenRouter, OpenCode, Ollama |
| GAP-14 | No streaming LLM responses | Slower perceived analysis time | Add SSE/streaming for analysis endpoint |
| GAP-15 | ~~No IHSG-specific market overview~~ | ~~Missing market context~~ | ✅ Addressed — `GET /v1/market/overview` (deterministic mock until live index feed) |
| GAP-16 | No user onboarding/tutorial | Steep learning curve for new users | Add guided tour, tooltips, help docs |
| GAP-17 | No stock screener/filter | Users cannot discover stocks by criteria | Add screener endpoint with technical filters |
| GAP-18 | No backtesting capability | Cannot validate signal accuracy | Add backtesting module with historical signal replay |

---

## 9. Deployment

### 9.1 Local Development

```bash
# Prerequisites: Node.js 20+, PostgreSQL 16, Redis 7 (optional)
npm install
npm run build
npm run test
npm run dev          # API server on port 3000
npm run dev:web      # Web dev server on port 5173
```

### 9.2 Docker

```bash
# Start infrastructure
docker compose up -d

# Build and run API
docker build -t sahamai:latest .
docker run --rm -p 3000:3000 --env-file .env sahamai:latest

# Build and run worker
docker build -f Dockerfile.worker -t sahamai-worker:latest .
docker run --rm --env-file .env sahamai-worker:latest
```

### 9.3 Production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full runbook and rollback procedures.
See [CICD.md](./CICD.md) for CI/CD pipeline details.

---

## 10. Testing Strategy

| Test Type | Location | Framework |
|-----------|----------|-----------|
| Unit tests | `packages/*/test/` | Vitest |
| Contract tests | `packages/api/test/` | Vitest |
| Component tests | `packages/web/test/` | Vitest + Testing Library |
| Smoke tests (local) | `packages/api/test/smoke/` | Node.js fetch |
| Smoke tests (deploy) | `packages/api/test/smoke/` | Node.js fetch |

Run all tests: `npm run test`

---

## 11. Design Principles

1. **Deterministic before multi-provider LLM** — Technical analysis runs first; LLM augments, never replaces
2. **Fail closed on stale data** — Invalid or expired signals are never served as fresh
3. **Verifiable data contracts** — All I/O has explicit TypeScript types and TypeBox schemas
4. **Cost-aware LLM usage** — Limit LLM synthesis to shortlisted symbols
5. **Traceable execution** — All actions traceable through Paperclip issue/run history
6. **IHSG-first** — Optimized for Indonesian market characteristics (trading hours, lot sizes, currency)

---

## 12. Glossary

| Term | Definition |
|------|------------|
| IHSG | Indeks Harga Saham Gabungan — Indonesian Stock Exchange Composite Index |
| Signal | A trading recommendation (buy/sell/hold) with confidence and expiry |
| Freshness | Whether a signal is within its TTL window |
| Fanout | Multi-channel delivery of signals to subscribers |
| SLO | Service Level Objective — measurable performance target |
| TTL | Time To Live — duration before a signal expires |
| OHLCV | Open, High, Low, Close, Volume — standard price data format |
| RSI | Relative Strength Index — momentum oscillator (0-100) |
| MACD | Moving Average Convergence Divergence — trend-following indicator |
| BB | Bollinger Bands — volatility bands around moving average |
| SMA | Simple Moving Average |
| EMA | Exponential Moving Average |
