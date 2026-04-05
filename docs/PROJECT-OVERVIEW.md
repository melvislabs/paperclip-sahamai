# Saham AI - Project Documentation

> AI stock analyzer for Indonesian equities (IHSG) with comprehensive broker information platform  
> Version: 1.0.0 | Last Updated: 2026-04-05

## 🎯 Project Overview

Saham AI is a comprehensive stock analysis platform for Indonesian investors that combines:
- **Real-time AI-powered trading signals** with freshness guarantees
- **Multi-source data ingestion** and quality gating  
- **Multi-provider LLM-powered analysis** with intelligent fallback (OpenAI, OpenRouter, OpenCode, Ollama) combining technical indicators, sentiment, and reasoning
- **Multi-channel signal delivery** (Telegram, Slack, email)
- **Operational observability** with SLO tracking and alerting
- **Comprehensive broker information** system for informed trading decisions

## 🏗️ Architecture

### Monorepo Structure
```
paperclip-sahamai/
├── packages/
│   ├── shared/       # @sahamai/shared — Core types, AI analysis, stock API client, cache, store, fanout, observability
│   ├── api/          # @sahamai/api    — Fastify HTTP server with signal, analysis, stock, auth, and broker endpoints
│   ├── worker/       # @sahamai/worker — Data ingestion worker with job scheduling
│   └── web/          # @sahamai/web    — React/Vite frontend dashboard
├── docs/             # This consolidated documentation
├── Dockerfile        # Main service image
└── Dockerfile.worker # Worker image
```

### Runtime Components

#### @sahamai/shared ✅ DONE
Core library consumed by all packages.

| Module | Status | Purpose |
|--------|--------|---------|
| `types.ts` | ✅ DONE | Signal types: `LatestSignal`, `SignalWithFreshness`, `SignalAction` |
| `ai-analysis/` | ✅ DONE | AI analysis service: technical indicators (RSI, MACD, Bollinger Bands, SMA/EMA), multi-provider LLM integration with fallback, sentiment fusion |
| `stock-api/` | ✅ DONE | Stock data API client with rate limiting and response caching. Supports Alpha Vantage, Polygon, Finnhub |
| `cache.ts` | ✅ DONE | TTL cache for reducing hot-path read latency |
| `store.ts` | ✅ DONE | In-memory signal registry with stale detection via `expiresAt` |
| `fanout.ts` | ✅ DONE | Multi-channel delivery worker with idempotency, retry/backoff, dead-letter support, rate limits |
| `observability.ts` | ✅ DONE | HTTP, delivery, freshness, and model-usage telemetry. Alert evaluation for error-rate, freshness degradation, channel health, cost spikes |
| `config.ts` | ✅ DONE | Environment-configurable TTLs (`SIGNAL_TTL_MS`, `CACHE_TTL_MS`) |

#### @sahamai/api ✅ DONE
Fastify HTTP server. Runs on `PORT` (default `3000`).

**Core Endpoints:**
- `GET /v1/signals/latest/:symbol` — Single symbol signal (404 if missing, 503 if stale) ✅ DONE
- `GET /v1/signals/latest?symbols=BBCA,TLKM` — Batch signals with stale/missing status ✅ DONE
- `GET /v1/signals/summary/latest` — Aggregate freshness summary ✅ DONE
- `POST /v1/analysis/:symbol` — Run AI analysis ✅ DONE
- `GET /v1/analysis/:symbol/latest` — Get latest cached analysis result ✅ DONE
- `GET /v1/stocks/:symbol/quote` — Real-time quote ✅ DONE
- `GET /v1/stocks/:symbol/history` — Historical OHLCV data ✅ DONE
- `GET /v1/stocks/:symbol/news` — Stock-related news ✅ DONE
- `GET /v1/stocks/search?q=...` — Search stocks ✅ DONE

**Authentication & User Management:** ✅ DONE
- `POST /v1/auth/register` — User registration
- `POST /v1/auth/login` — User login  
- `POST /v1/auth/refresh` — Token refresh
- JWT-based auth with role hierarchy (user < admin)

**Broker Information System:** ✅ DONE
- `GET /v1/brokers` — List brokers with filtering
- `GET /v1/brokers/:id` — Detailed broker info
- `GET /v1/brokers/search` — Search brokers
- `POST /v1/brokers/compare` — Side-by-side comparison
- `POST /v1/brokers/fees/calculator` — Fee calculator
- `GET /v1/brokers/:id/reviews` — Broker reviews
- `POST /v1/brokers/:id/reviews` — Submit review (auth)
- `POST /v1/brokers/recommend` — Personalized recommendations (auth)
- `GET /v1/brokers/:id/real-time-status` — Live status

**Portfolio & Alerts:** ✅ DONE
- `GET /v1/portfolios` — List portfolios
- `POST /v1/portfolios` — Create portfolio
- `GET /v1/portfolios/:id` — Portfolio + holdings
- `POST /v1/alerts` — Create price alert
- `GET /v1/alerts` — List user alerts

**Operations:** ✅ DONE
- `GET /health` — Health check
- `GET /v1/ops/metrics` — Operational metrics
- `GET /v1/ops/dashboard/latest` — SLO dashboard payload
- `GET /v1/ops/alerts/latest` — Active alerts

**Security:** ✅ DONE
- Helmet (CSP, HSTS, frameguard), CORS, rate limiting (100 req/min)

#### @sahamai/worker ❌ NOT IMPLEMENTED
Data ingestion and scheduled jobs.

| Module | Status | Purpose |
|--------|--------|---------|
| `ingestion.ts` | ❌ NOT STARTED | `DataIngestionWorker` — Fetches signals from adapters, tracks ingestion metrics |
| `scheduler.ts` | ❌ NOT STARTED | `JobScheduler` — Cron-based job scheduling with start/stop/unregister |
| `jobs/` | ❌ NOT STARTED | Scheduled job definitions |
| `processors/` | ❌ NOT STARTED | Data processing pipelines |
| `utils/` | ❌ NOT STARTED | Shared utilities |

#### @sahamai/web ✅ PARTIALLY DONE
React + Vite frontend dashboard.

| Component | Status | Purpose |
|-----------|--------|---------|
| `SignalsDashboard` | ✅ DONE | Displays trading signals with freshness status |
| `OpsDashboard` | ✅ DONE | Operational metrics, SLOs, and alerts |
| `AIAnalysisReportPage` | ✅ DONE | Full AI analysis report with price chart, technical indicators, multi-provider LLM analysis, sentiment fusion |
| `PriceChart` | ✅ DONE | Recharts area chart with volume bars and time range selector |
| `StockWatchlist` | ⚠️ BROKEN | Sortable watchlist with quotes and signal badges (missing auth headers) |
| `AIInsights` | ⚠️ BROKEN | AI insight cards with recommendation, confidence, risk, key points (missing auth headers) |
| `PortfolioSummaryCard` | ⚠️ BROKEN | Portfolio value, gain/loss, sector allocation (missing `/v1/portfolio/summary` endpoint) |
| `AlertsPanel` | ✅ DONE | Operational alerts display |

**Known Issues:** 🚨 HIGH PRIORITY
- Calls `/v1/portfolio/summary` and `/v1/market/overview` which do NOT exist as API endpoints (404)
- Watchlist quotes and AI insights use raw `fetch()` without auth headers (will 401)

## 🚀 CI/CD & Deployment

### CI/CD Pipeline ✅ DONE
Uses GitHub Actions with three main workflows:

1. **CI Workflow** (`.github/workflows/ci.yml`) ✅ DONE
   - Triggered on push to `main`/`develop` or PR to `main`
   - Jobs: `lint-and-typecheck` → `test` → `build`
   - Environment: Node.js 22 on `ubuntu-latest`

2. **Docker Build & Push** (`.github/workflows/docker.yml`) ✅ DONE
   - Multi-platform builds with Docker Buildx
   - Registry: GitHub Container Registry (`ghcr.io`)
   - Images: `{repo}-api` and `{repo}-worker`
   - Comprehensive tagging strategy (branch, PR, semantic version, SHA)

3. **Deploy Workflow** (`.github/workflows/deploy.yml`) ✅ DONE
   - Staging deployment on Docker workflow success
   - Production deployment after staging succeeds
   - Required secrets: `DEPLOY_TOKEN`, `STAGING_HOST`, `PRODUCTION_HOST`

### Docker Configuration ✅ DONE
- **Main API Image** (`Dockerfile`): Multi-stage build (build → runtime)
- **Worker Image** (`Dockerfile.worker`): Separate image for data ingestion
- **Local Development** (`docker-compose.yml`): PostgreSQL 16 for local dev

### Deployment Runbook ✅ DONE
```bash
# 1. Install and verify
npm ci && npm run build && npm test && npm run smoke:runtime

# 2. Build image
docker build -t paperclip-sahamai:latest .

# 3. Run locally
docker run --rm -p 3000:3000 -e PORT=3000 paperclip-sahamai:latest

# 4. Verify health
curl -sS http://127.0.0.1:3000/health

# 5. Deploy smoke check
SMOKE_BASE_URL=https://<host> npm run smoke:deploy
```

## 📊 Broker Information System ✅ DONE

### Database Schema ✅ DONE
- **Broker** model with OJK compliance tracking
- **BrokerFees** model with detailed fee structures  
- **BrokerFeatures** model with platform capabilities
- **BrokerReview** model with user ratings system
- **BrokerPerformance** model with metrics tracking
- **OjkLicenseStatus** enum for regulatory compliance

### Shared Package Services ✅ DONE
- **BrokerService** - Complete CRUD operations, comparisons, fee calculations
- **BrokerDataIngestionService** - Automated data collection from OJK and websites
- **TypeScript Interfaces** - Full type safety for all broker data structures
- **Database Client Abstraction** - Clean separation from Prisma dependencies

### Frontend Components ✅ DONE
- **BrokerListPage** - Browse and filter brokers
- **BrokerDetailPage** - Comprehensive broker information
- **BrokerComparisonTool** - Side-by-side comparison with fee calculator

### Key Features Working ✅ DONE
- **Broker Discovery**: Search by name/legal name, filter by OJK status/features/fees
- **Smart Comparison**: Side-by-side feature comparison, interactive fee calculator, performance metrics
- **User Reviews**: Multi-criteria rating system, pros/cons feedback, verification badges
- **Personalized Recommendations**: AI-powered scoring, experience-based matching
- **Real-time Monitoring**: System uptime tracking, performance metrics, status alerts
- **Automated Data Ingestion**: OJK license verification, web scraping, data quality validation

## 🐛 Critical Issues & Gaps

### P0 - Critical Issues 🚨
| Issue | Impact | Fix Status |
|-------|--------|------------|
| `/v1/portfolio/summary` endpoint missing | Portfolio card shows nothing | ❌ NOT STARTED |
| `/v1/market/overview` endpoint missing | Market overview panel broken | ❌ NOT STARTED |
| Web API client lacks auth headers | All stock/watchlist calls return 401 | ❌ NOT STARTED |
| Worker has no entry point | No automated data ingestion, stale signals | ❌ NOT STARTED |

### P1 - High Priority Issues
| Issue | Impact | Fix Status |
|-------|--------|------------|
| No watchlist backend | Users cannot save favorite stocks | ❌ NOT STARTED |
| Redis not wired | No shared caching, slower responses | ❌ NOT STARTED |
| Push notifications stubbed | No mobile alerts | ❌ NOT STARTED |
| Digest email never sent | Users get no daily summary | ❌ NOT STARTED |

### P2 - Medium Priority Issues
| Issue | Impact | Fix Status |
|-------|--------|------------|
| News sentiment pre-classified | No NLP analysis of news text | ❌ NOT STARTED |
| No stock screener | Cannot discover stocks by criteria | ❌ NOT STARTED |
| No backtesting | Cannot validate signal accuracy | ❌ NOT STARTED |
| No user onboarding | Steep learning curve | ❌ NOT STARTED |

## 📈 Data Contracts

### LatestSignal ✅ DONE
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

### AIAnalysisResult ✅ DONE
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

## 🛠️ Environment Variables

| Variable | Context | Purpose | Status |
|----------|---------|---------|--------|
| `PORT` | Runtime | HTTP server port (default: 3000) | ✅ DONE |
| `NODE_ENV` | Build/Runtime | Environment mode | ✅ DONE |
| `DATABASE_URL` | Runtime | PostgreSQL connection string | ✅ DONE |
| `STOCK_API_PROVIDER` | Runtime | Data provider selection | ✅ DONE |
| `STOCK_API_KEY` | Runtime | Stock data API key | ✅ DONE |
| `OPENAI_API_KEY` | Runtime | OpenAI LLM analysis API key | ✅ DONE |
| `OPENROUTER_API_KEY` | Runtime | OpenRouter multi-model API key (optional) | ✅ DONE |
| `OPENCODE_API_KEY` | Runtime | OpenCode developer AI API key (optional) | ✅ DONE |
| `OLLAMA_BASE_URL` | Runtime | Ollama local LLM endpoint (default: http://localhost:11434) | ✅ DONE |
| `OLLAMA_MODEL` | Runtime | Ollama model name (default: llama3.2:3b) | ✅ DONE |
| `LLM_FALLBACK_ENABLED` | Runtime | Enable multi-provider LLM fallback (default: true) | ✅ DONE |
| `LLM_PROVIDER_PRIORITY` | Runtime | Provider priority order (default: openai,openrouter,opencode,ollama,mock) | ✅ DONE |
| `ALLOWED_ORIGINS` | Runtime | CORS configuration | ✅ DONE |

## 📋 Package Scripts

| Script | Package | Purpose | Status |
|--------|---------|---------|--------|
| `build` | Root | Build all packages | ✅ DONE |
| `test` | Root | Run all tests | ✅ DONE |
| `test:coverage` | shared | Generate coverage report | ✅ DONE |
| `smoke:runtime` | api | Runtime smoke check | ✅ DONE |
| `smoke:deploy` | api | Deploy smoke validation | ✅ DONE |
| `dev` | api | Start API dev server | ✅ DONE |
| `dev:web` | web | Start web dev server | ✅ DONE |

## 🌿 Branching Strategy ✅ DONE

| Branch | Purpose | CI | Docker | Deploy |
|--------|---------|----|--------|--------|
| `main` | Production | ✓ | ✓ (push) | ✓ |
| `develop` | Development | ✓ | ✓ (push) | — |
| `v*` tags | Releases | — | ✓ (push) | — |
| PR → `main` | Review | ✓ | ✓ (no push) | — |

## 🎯 Next Steps

### Immediate (P0)
1. **Implement `/v1/portfolio/summary` endpoint** with computed metrics
2. **Implement `/v1/market/overview` endpoint** with IHSG index, gainers/losers  
3. **Add Bearer token to web API client** fetch calls
4. **Add worker entry point** (`src/main.ts`) and start script

### Short-term (P1)
1. **Add watchlist CRUD + Prisma model**
2. **Wire Redis client** into cache layer
3. **Integrate FCM or OneSignal** for push notifications
4. **Implement digest generation + scheduler**

### Medium-term (P2)
1. **Add text-based sentiment analysis** for news
2. **Add screener with technical filters**
3. **Add historical signal replay module** for backtesting
4. **Add guided tour, tooltips, help docs** for onboarding

---

## 📞 Support & Operations

### Health Checks ✅ DONE
- `/health` - Basic service health
- `/v1/signals/summary/latest` - Signal freshness status
- `/v1/ops/metrics` - Operational metrics

### Monitoring ✅ DONE
- HTTP, delivery, freshness, and model-usage telemetry
- Alert evaluation for error-rate, freshness degradation, channel health, cost spikes
- SLO dashboard with real-time metrics

### Rollback Procedures ✅ DONE
1. Keep previous stable image tag (`paperclip-sahamai:<stable-tag>`)
2. Redeploy using stable image tag
3. Re-run deploy smoke checks against restored deployment
4. If rollback caused by data-contract breakage, freeze release promotion

---

**Status:** Core platform ✅ **COMPLETE** | Broker system ✅ **COMPLETE** | Worker ❌ **MISSING** | Frontend ⚠️ **NEEDS FIXES**

**Ready for production with critical fixes for portfolio/summary endpoints and web API authentication! 🚀**
