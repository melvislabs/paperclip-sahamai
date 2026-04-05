# Saham AI — Agent Guide

AI stock analyzer for Indonesian equities (IHSG), orchestrated via Paperclip. This document is the primary reference for agents operating in this project.

## Project Overview

**Purpose:** Build a reliable, low-latency AI stock analysis platform that provides actionable trading signals for Indonesian stocks. The system combines deterministic technical analysis with LLM-powered insights and sentiment fusion.

**Key problems solved:**
- Real-time signal generation with freshness guarantees
- Multi-source data ingestion and quality gating
- AI-powered analysis combining technical indicators, sentiment, and LLM reasoning
- Multi-channel signal delivery (Telegram, Slack, email)
- Operational observability with SLO tracking and alerting

**Target market:** Indonesian Stock Exchange (IHSG)

## Architecture

### Monorepo Structure

```
paperclip-sahamai/
├── packages/
│   ├── shared/       # @sahamai/shared — Shared types, AI analysis, stock API client, cache, store, fanout, observability
│   ├── api/          # @sahamai/api    — Fastify HTTP server with signal, analysis, stock, and auth endpoints
│   ├── worker/       # @sahamai/worker — Data ingestion worker with job scheduling
│   └── web/          # @sahamai/web    — React/Vite frontend dashboard
├── docs/             # Architecture and deployment docs
├── Dockerfile        # Main service image
└── Dockerfile.worker # Worker image
```

### Runtime Components

#### @sahamai/shared
Core library consumed by all other packages.

| Module | Purpose |
|--------|---------|
| `types.ts` | Signal types: `LatestSignal`, `SignalWithFreshness`, `SignalAction` |
| `ai-analysis/` | AI analysis service: technical indicators (RSI, MACD, Bollinger Bands, SMA/EMA), multi-provider LLM integration with fallback, sentiment fusion |
| `stock-api/` | Stock data API client with rate limiting and response caching. Supports Alpha Vantage, Polygon, Finnhub |
| `cache.ts` | TTL cache for reducing hot-path read latency |
| `store.ts` | In-memory signal registry with stale detection via `expiresAt` |
| `fanout.ts` | Multi-channel delivery worker with idempotency, retry/backoff, dead-letter support, rate limits |
| `observability.ts` | HTTP, delivery, freshness, and model-usage telemetry. Alert evaluation for error-rate, freshness degradation, channel health, cost spikes |
| `config.ts` | Environment-configurable TTLs (`SIGNAL_TTL_MS`, `CACHE_TTL_MS`) |

#### @sahamai/api
Fastify HTTP server. Runs on `PORT` (default `3000`).

**Signal Endpoints:**
- `GET /v1/signals/latest/:symbol` — Single symbol signal (404 if missing, 503 if stale)
- `GET /v1/signals/latest?symbols=BBCA,TLKM` — Batch signals with stale/missing status
- `GET /v1/signals/summary/latest` — Aggregate freshness summary

**Analysis Endpoints:**
- `POST /v1/analysis/:symbol` — Run AI analysis (requires priceHistory, optional news)
- `GET /v1/analysis/:symbol/latest` — Get latest cached analysis result

**Stock Data Endpoints:**
- `GET /v1/stocks/:symbol/quote` — Real-time quote (requires `STOCK_API_KEY`)
- `GET /v1/stocks/:symbol/history` — Historical OHLCV data
- `GET /v1/stocks/:symbol/news` — Stock-related news
- `GET /v1/stocks/search?q=...` — Search stocks

**Ops Endpoints:**
- `GET /health` — Health check
- `GET /v1/ops/metrics` — Operational metrics
- `GET /v1/ops/dashboard/latest` — SLO dashboard payload
- `GET /v1/ops/alerts/latest` — Active alerts

**Auth Endpoints:**
- `POST /v1/auth/register` — User registration
- `POST /v1/auth/login` — User login
- `POST /v1/auth/refresh` — Token refresh
- JWT-based auth with role hierarchy (user < admin)

**Security Middleware:** Helmet (CSP, HSTS, frameguard), CORS, rate limiting (100 req/min)

**Additional Endpoints:**
- `POST /v1/alerts` — Create price alert
- `GET /v1/alerts` — List user alerts
- `GET /v1/alerts/:id` — Get alert details
- `PATCH /v1/alerts/:id` — Update alert
- `DELETE /v1/alerts/:id` — Delete alert
- `GET /v1/alerts/history` — Alert trigger history
- `GET /v1/settings/digest` — Get digest preferences
- `PATCH /v1/settings/digest` — Update digest preferences
- `GET /v1/users/me` — User profile
- `PATCH /v1/users/me` — Update profile
- `GET /v1/portfolios` — List portfolios
- `POST /v1/portfolios` — Create portfolio
- `GET /v1/portfolios/:id` — Portfolio + holdings
- `PATCH /v1/portfolios/:id` — Update portfolio
- `DELETE /v1/portfolios/:id` — Delete portfolio
- `POST /v1/portfolios/:id/stocks` — Add holding
- `DELETE /v1/portfolios/:id/stocks/:symbol` — Remove holding
- `GET /v1/ws` — WebSocket connection for real-time updates

**Interactive API Docs:** `GET /docs` — Swagger/OpenAPI UI

#### @sahamai/worker
Data ingestion and scheduled jobs.

| Module | Purpose |
|--------|---------|
| `ingestion.ts` | `DataIngestionWorker` — Fetches signals from adapters, tracks ingestion metrics |
| `scheduler.ts` | `JobScheduler` — Cron-based job scheduling with start/stop/unregister |
| `jobs/` | Scheduled job definitions |
| `processors/` | Data processing pipelines |
| `utils/` | Shared utilities |

#### @sahamai/web
React + Vite frontend dashboard.

| Component | Purpose |
|-----------|---------|
| `SignalsDashboard` | Displays trading signals with freshness status |
| `OpsDashboard` | Operational metrics, SLOs, and alerts |
| `AIAnalysisReportPage` | Full AI analysis report with price chart, technical indicators, LLM analysis, sentiment fusion |
| `PriceChart` | Recharts area chart with volume bars and time range selector |
| `StockWatchlist` | Sortable watchlist with quotes and signal badges |
| `AIInsights` | AI insight cards with recommendation, confidence, risk, key points |
| `PortfolioSummaryCard` | Portfolio value, gain/loss, sector allocation |
| `AlertsPanel` | Operational alerts display |
| `Header` | Navigation header with tab switching |

**Tabs:** Dashboard, Signals, Analysis, Ops
**State:** Zustand store + TanStack Query with URL hash sync
**Polling:** 15s-5min intervals depending on data type

**Known frontend issues:**
- Calls `/v1/portfolio/summary` and `/v1/market/overview` which do NOT exist as API endpoints (404)
- Watchlist quotes and AI insights use raw `fetch()` without auth headers (will 401)

### Data Flow Architecture

```
Market/Fundamental/News Sources
  → Ingestion + Snapshot Storage (worker)
  → Feature Pipeline + Data Quality Gates
  → Deterministic Scoring Engine (shared/ai-analysis)
  → Risk Overlay (liquidity/exposure/confidence)
  → Signal Registry (versioned + TTL) (shared/store)
  → Delivery API + Fanout (shared/fanout)
  → Ops Dashboard + Alerts (shared/observability)

Paperclip Control Plane
  → Agent task routing, approvals, delegation, audit logs, run-level traceability
```

### User-Facing Feature Gaps

These gaps directly impact user experience and should be prioritized for making the platform useful:

| Priority | Gap | Impact on User | Fix |
|----------|-----|----------------|-----|
| **P0** | `/v1/portfolio/summary` endpoint missing | Portfolio card shows nothing | Implement endpoint with computed metrics |
| **P0** | `/v1/market/overview` endpoint missing | Market overview panel broken | Implement with IHSG index, gainers/losers |
| **P0** | Web API client lacks auth headers | All stock/watchlist calls return 401 | Add Bearer token to fetch calls |
| **P0** | Worker has no entry point | No automated data ingestion, stale signals | Add `src/main.ts` and start script |
| **P1** | No watchlist backend | Users cannot save favorite stocks | Add watchlist CRUD + Prisma model |
| **P1** | Redis not wired | No shared caching, slower responses | Wire Redis client into cache layer |
| **P1** | Push notifications stubbed | No mobile alerts | Integrate FCM or OneSignal |
| **P1** | Digest email never sent | Users get no daily summary | Implement digest generation + scheduler |
| **P1** | News sentiment pre-classified | No NLP analysis of news text | Add text-based sentiment analysis |
| **P2** | No stock screener | Cannot discover stocks by criteria | Add screener with technical filters |
| **P2** | No backtesting | Cannot validate signal accuracy | Add historical signal replay module |
| **P2** | No user onboarding | Steep learning curve | Add guided tour, tooltips, help docs |
| **P2** | No multi-model LLM fallback | Single point of failure | ✅ **COMPLETED**: Added model rotation chain with OpenRouter, OpenCode, Ollama, and fallback support |

### Data Contracts

**LatestSignal:**
```typescript
{
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;    // 0-1
  generatedAt: string;   // ISO timestamp
  expiresAt: string;     // ISO timestamp — stale when <= now
  version: string;
  reasonCodes: string[];
}
```

**Freshness rule:** `expiresAt <= now` means stale. Stale signals must NOT be treated as tradable.

**AIAnalysisResult:**
```typescript
{
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
  metadata: { modelUsed?: string; dataPoints: number; processingTimeMs: number; version: string };
}
```

## Agents Definition

All agents report to the CEO. Each agent has bounded responsibilities.

| Agent | Role | Responsibilities |
|-------|------|-----------------|
| **CEO** | ceo | Defines priorities, milestones, and strategic direction. Creates top-level issues and goals. Approves cross-team work. |
| **Tech Lead** | engineer | Architectural decisions, code review, technical mentoring, cross-team coordination, system design oversight |
| **Product Manager** | pm | Defines product requirements, prioritizes feature backlog, coordinates cross-team delivery |
| **Founding Engineer** | engineer | End-to-end MVP implementation, tests, release quality. Executes prioritized roadmap tasks |
| **Backend Engineer** | engineer | RESTful APIs, WebSocket servers, backend services. API design, real-time communication |
| **Frontend Engineer** | engineer | User interfaces, dashboards, real-time frontend features. React/Next.js, state management |
| **AI Engineer** | engineer | AI/ML services: stock analysis, sentiment analysis, risk assessment. LLM integration, NLP, predictive analytics |
| **Data Pipeline Engineer** | engineer | Data ingestion pipelines, stock data workers, ETL processes. Real-time streaming, API integrations |
| **DevOps Engineer** | engineer | CI/CD pipelines, unit/integration tests, deployment automation, performance monitoring |
| **Security Engineer** | engineer | Authentication/authorization, JWT auth, OAuth, secure API design, user identity management |
| **Infrastructure Engineer** | engineer | Database schemas, environment config, secrets management, PostgreSQL, Prisma, Docker |
| **Alerts Engineer** | engineer | Price alert systems, notification services, automated digest generation. Event-driven architecture |
| **QA Engineer** | engineer | Test strategy, unit/integration tests, code quality reviews, release quality |

### Agent Interaction Model

1. **CEO** sets goals and milestones → creates issues with `goalId`
2. **Tech Lead** reviews architecture, assigns technical subtasks
3. **Engineers** implement bounded subtasks with contract tests
4. **QA Engineer** reviews test coverage and code quality
5. **PM** coordinates cross-team dependencies and feature alignment
6. Paperclip issue hierarchy maps architecture layers into executable work with dependencies

## Workflows

### Heartbeat Workflow (Agent Execution)

1. Agent wakes from assignment/comment/approval event
2. Agent checks out issue: `POST /api/issues/{id}/checkout`
3. Agent reads heartbeat context: `GET /api/issues/{id}/heartbeat-context`
4. Agent executes scoped work in shared/local workspace
5. Agent updates issue with status, links, and blockers
6. If blocked, status is explicitly set to `blocked` with an unblock owner

### Task Lifecycle

```
backlog → todo → in_progress → in_review → done
                       ↓
                    blocked (requires explicit unblock owner)
```

### Development Workflow

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Smoke test (local runtime)
npm run smoke:runtime

# Start API dev server
npm run dev

# Start web dev server
npm run dev:web
```

### Deployment Workflow

1. Build and test locally
2. Build Docker image: `docker build -t paperclip-sahamai:latest .`
3. Run locally: `docker run --rm -p 3000:3000 -e PORT=3000 paperclip-sahamai:latest`
4. Verify: `curl http://127.0.0.1:3000/health`
5. Deploy to platform and run smoke check: `SMOKE_BASE_URL=https://<host> npm run smoke:deploy`

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full runbook and rollback procedures.

## Tools & Capabilities

### Available Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `bash` | Execute shell commands | Build, test, git operations, Docker |
| `read` | Read files | Understanding code, verifying changes |
| `edit` | Edit files | Making code changes |
| `write` | Write files | Creating new files |
| `glob` | Find files by pattern | Locating files in codebase |
| `grep` | Search file contents | Finding code patterns, references |
| `task` | Launch sub-agents | Complex multi-step tasks |

### Paperclip API

Agents interact with Paperclip via REST API. Key endpoints:

| Action | Endpoint |
|--------|----------|
| Get identity | `GET /api/agents/me` |
| Get inbox | `GET /api/agents/me/inbox-lite` |
| Checkout task | `POST /api/issues/{id}/checkout` |
| Update task | `PATCH /api/issues/{id}` |
| Add comment | `POST /api/issues/{id}/comments` |
| Create subtask | `POST /api/companies/{companyId}/issues` |

**Required headers:**
- `Authorization: Bearer $PAPERCLIP_API_KEY`
- `X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID` (on all mutating issue requests)

### Environment Variables

| Variable | Package | Purpose |
|----------|---------|---------|
| `PORT` | api | HTTP server port (default: 3000) |
| `SIGNAL_TTL_MS` | shared | Signal time-to-live (default: 5min) |
| `CACHE_TTL_MS` | shared | Cache time-to-live (default: 30s) |
| `STOCK_API_PROVIDER` | api | Data provider: `alpha_vantage`, `polygon`, `finnhub` |
| `STOCK_API_KEY` | api | Stock data API key |
| `OPENAI_API_KEY` | shared | OpenAI key for LLM analysis (falls back to mock) |
| `OPENROUTER_API_KEY` | shared | OpenRouter key for multi-model access (optional) |
| `OPENCODE_API_KEY` | shared | OpenCode key for developer-focused AI (optional) |
| `OLLAMA_BASE_URL` | shared | Ollama local LLM endpoint (default: http://localhost:11434) |
| `OLLAMA_MODEL` | shared | Ollama model name (default: llama3.2:3b) |
| `LLM_FALLBACK_ENABLED` | shared | Enable multi-provider fallback (default: true) |
| `LLM_PROVIDER_PRIORITY` | shared | Provider priority order (default: openai,openrouter,opencode,ollama,mock) |
| `NODE_ENV` | all | Environment: `development`, `test`, `production` |
| `ALLOWED_ORIGINS` | api | CORS allowed origins (comma-separated) |
| `DATABASE_URL` | api | PostgreSQL connection string (not yet wired) |

## Best Practices

### Code Conventions

- **TypeScript** across all packages — no `any` without justification
- **ES modules** — use `.js` extensions in imports (compiled from `.ts`)
- **Testable design** — inject `now` and `sleep` dependencies for deterministic tests
- **Error handling** — fail closed on stale/invalid data, never return stale signals as fresh

### Naming Conventions

- **Packages:** `@sahamai/<name>` (shared, api, worker, web)
- **Files:** kebab-case for docs, camelCase for source
- **Types:** PascalCase interfaces and types
- **Endpoints:** `/v1/<resource>/<action>/:param`

### Task Structure

- Every issue should have a `goalId` and `projectId`
- Subtasks must have `parentId` set
- Use descriptive titles and clear acceptance criteria
- Link related issues in comments using markdown: `[AIC-47](/SAHA/issues/AIC-47)`

### Error Handling

- API: return appropriate HTTP status codes (404, 401, 429, 500, 503)
- Worker: catch errors in ingestion, return error in result, continue loop
- Fanout: dead-letter queue for failed deliveries, retry with backoff
- LLM: gracefully degrade to technical-only analysis if LLM fails (multi-provider fallback implemented)

### Testing

- Unit tests in `test/` directories per package
- Contract tests for API endpoints
- Smoke tests for runtime validation
- Run `npm run test` before marking tasks done

### Git Workflow

- Commit frequently with descriptive messages
- Add `Co-Authored-By: Paperclip <noreply@paperclip.ing>` to commits made by agents
- Never commit secrets or API keys

## Technical Roadmap

### Phase 1: Make It Usable (P0 — Unblock the Product)
1. Fix web API client auth headers — all stock endpoints return 401 without Bearer token
2. Implement `/v1/portfolio/summary` endpoint — portfolio dashboard card is broken
3. Implement `/v1/market/overview` endpoint — market overview panel is broken
4. Add worker entry point (`src/main.ts`) — no automated data ingestion runs
5. Add seed data for Indonesian blue-chip stocks (BBCA, BBRI, BMRI, TLKM, ASII, UNVR, GOTO)

### Phase 2: Core User Features (P1 — Make It Valuable)
6. Wire Redis into cache layer — shared caching across instances
7. Add watchlist backend — users need to save and track favorite stocks
8. Implement NLP-based news sentiment analysis — replace pre-classified sentiment
9. Implement digest email generation + scheduled sending — daily summary for users
10. Integrate push notifications (FCM) — mobile alert delivery
11. Add portfolio gain/loss and sector allocation computation

### Phase 3: Advanced Features (P2 — Make It Competitive)
12. Add stock screener with technical filters — stock discovery tool
13. Add backtesting module — validate signal accuracy historically
14. Add multi-model LLM fallback — ✅ **COMPLETED**: reliability improvement with OpenRouter, OpenCode, Ollama integration
15. Add user onboarding/tutorial — reduce learning curve
16. Replace in-memory signal store with persistent registry (Postgres/Redis)
17. Add production IHSG data provider connectors
18. Add event bus (NATS/Kafka/SQS) for publish/fanout decoupling
19. Add runbook docs for each alert code

## Design Principles

1. Keep the critical path deterministic before LLM usage
2. Prefer verifiable data contracts over opaque model outputs
3. Fail closed on stale or invalid market signals
4. Optimize cost by limiting LLM synthesis to shortlisted symbols
5. Keep all execution traceable through Paperclip issue/run history

## Quick Reference

### API Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing/invalid auth) |
| 404 | Signal not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 502 | Bad gateway (upstream failure) |
| 503 | Service unavailable (stale signal / unconfigured) |

### Signal Status Values

| Status | Meaning |
|--------|---------|
| `fresh` | Signal is within TTL, safe to use |
| `stale` | Signal has expired, do not trade |
| `missing` | No signal exists for symbol |

### Risk Levels

| Level | Confidence Threshold |
|-------|---------------------|
| LOW | > 0.7 |
| MEDIUM | > 0.4 |
| HIGH | > 0.2 |
| CRITICAL | <= 0.2 |
