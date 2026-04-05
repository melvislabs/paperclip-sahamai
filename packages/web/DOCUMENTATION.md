# Saham AI Web Client — Frontend Documentation

## Overview

Saham AI is a **single-page application (SPA)** for analyzing Indonesian Stock Exchange (IHSG) data with AI-powered trading signals. The app is built with **React 19**, **TypeScript**, **Vite 6**, **Tailwind CSS v4**, **TanStack React Query v5**, **Zustand v5**, and **Recharts v3**.

### Architecture

- **Monorepo** — lives in `packages/web/` alongside `packages/api/`, `packages/shared/`, `packages/worker/`
- **No router library** — navigation uses URL hash routing (`#?tab=signals&symbol=BBCA&timeRange=1W`) synced with a Zustand store
- **Dark theme** — slate color palette with cyan (`#06b6d4`) accent, emerald for bullish, red for bearish
- **Polling-based real-time** — data refreshes every 15s–300s depending on endpoint
- **Error boundary per section** — individual widget failures don't crash the page

### Tech Stack

| Category | Technology |
|---|---|
| Framework | React 19 (SPA) |
| Build | Vite 6 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Server State | TanStack React Query v5 |
| Client State | Zustand v5 |
| Charts | Recharts v3 |
| Testing | Vitest + Testing Library |

---

## Routing & Navigation

Navigation is handled via **URL hash parameters** synced with a Zustand store.

### URL Parameters

| Parameter | Values | Default | Description |
|---|---|---|---|
| `tab` | `dashboard`, `signals`, `analysis`, `ops` | `dashboard` | Active view |
| `symbol` | Any stock symbol (e.g., `BBCA`) | `null` | Selected stock |
| `timeRange` | `1D`, `1W`, `1M`, `3M`, `1Y` | `1D` | Chart time range |

### URL Sync Module (`src/lib/url-sync.ts`)

- `parseUrlHash()` — reads current hash into `{ tab, symbol, timeRange }` with validation
- `updateUrlHash(partial)` — merges new state and updates `window.history.replaceState`
- `subscribeToHashChanges(callback)` — listens to `hashchange` events for browser back/forward

### Zustand Store (`src/store/dashboard-store.ts`)

```ts
interface DashboardState {
  activeTab: Tab;
  selectedSymbol: string | null;
  selectedTimeRange: TimeRange;
  watchlist: string[];        // default: ['BBCA', 'TLKM', 'BBRI', 'ASII', 'UNVR']
  searchQuery: string;
  setActiveTab(tab: Tab): void;
  setSelectedSymbol(symbol: string | null): void;
  setSelectedTimeRange(range: TimeRange): void;
  setWatchlist(symbols: string[]): void;
  addToWatchlist(symbol: string): void;
  removeFromWatchlist(symbol: string): void;
  setSearchQuery(query: string): void;
}
```

Every state mutation calls `updateUrlHash()` to keep the URL in sync.

---

## Pages / Views

### 1. Dashboard (Default View)

**Component:** `MainDashboard` in `App.tsx`

The main overview screen with a 3-column grid layout.

#### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Portfolio Summary (2 cols)  │  Market Overview     │
├─────────────────────────────────────────────────────┤
│  Price Chart (2 cols)        │  Stock Watchlist     │
├─────────────────────────────────────────────────────┤
│  AI Insights                 │  Alerts Panel        │
└─────────────────────────────────────────────────────┘
```

#### Data Sources

| Widget | API Endpoint | Refetch Interval |
|---|---|---|
| Signals | `/v1/signals/latest` | 30s |
| Portfolio | `/v1/portfolio/summary` | 60s |
| Market Overview | `/v1/market/overview` | 60s |
| Watchlist Quotes | `/v1/stocks/{symbol}/quote` × 5 | 15s |
| Chart Data | `/v1/stocks/{symbol}/history` | 15s |
| AI Insights | `/v1/analysis/{symbol}/latest` × 3 | 300s |
| Alerts | `/v1/ops/alerts/latest` | 60s |

#### Components

| Component | File | Purpose |
|---|---|---|
| `PortfolioSummaryCard` | `src/components/PortfolioSummaryCard.tsx` | Total value, gain/loss %, sector allocation bars |
| `MarketOverviewCard` | `src/components/MarketOverviewCard.tsx` | Indices, top gainers/losers, market status |
| `PriceChart` | `src/components/PriceChart.tsx` | Recharts area chart + volume bars, time range selector |
| `StockWatchlist` | `src/components/StockWatchlist.tsx` | Sortable stock list with price, change %, signal badges |
| `AIInsights` | `src/components/AIInsights.tsx` | AI insight cards with recommendation, confidence, risk, key points |
| `AlertsPanel` | `src/components/AlertsPanel.tsx` | Operational alerts with severity badges |

---

### 2. Signals View

**Component:** `SignalsDashboard` in `src/components/SignalsDashboard.tsx`

Grid of trading signal cards categorized by freshness.

#### Layout

```
┌─────────────────────────────────────────────────────┐
│  Trading Signals          [Fresh] [Stale] [Missing] │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Signal   │  │ Signal   │  │ Signal   │          │
│  │ Card     │  │ Card     │  │ Card     │  ...     │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
```

#### Components

| Component | File | Purpose |
|---|---|---|
| `SignalsDashboard` | `src/components/SignalsDashboard.tsx` | Grid layout with Fresh/Stale/Missing count badges |
| `SignalCard` | `src/components/SignalCard.tsx` | Individual signal: symbol, BUY/SELL/HOLD, confidence bar, timestamps, reason codes |

---

### 3. Analysis View

**Component:** `AIAnalysisReportPage` in `src/components/AIAnalysisReportPage.tsx`

Deep-dive AI analysis for a selected stock symbol.

#### Layout

```
┌─────────────────────────────────────────────────────┐
│  ← BBCA  [BUY]  [LOW]              85% Confidence   │
│  TECHNICAL Analysis • Updated ...                   │
├─────────────────────────────────────────────────────┤
│  Summary + Key Points                               │
├─────────────────────────────────────────────────────┤
│  Price History (Area Chart + Volume)                │
├─────────────────────────────────────────────────────┤
│  [Technical] [AI Analysis] [Sentiment]              │
├──────────────────────────────┬──────────────────────┤
│  Main Content (2 cols)       │  Sidebar (1 col)     │
│  • Technical Indicators      │  • Analysis Metadata │
│  • Bollinger Bands           │  • Price Target      │
│  • AI Analysis               │  • Signal Summary    │
│  • Key Insights              │                      │
│  • Catalysts / Risks         │                      │
│  • Sentiment Fusion          │                      │
└──────────────────────────────┴──────────────────────┘
```

#### Section Tabs

| Tab | Content |
|---|---|
| Technical | RSI, MACD, SMA 20/50, Trend, Volatility, Bollinger Bands |
| AI Analysis | LLM summary, reasoning, key insights, catalysts, risks |
| Sentiment | Composite score, recommendation, technical/sentiment contribution breakdown |

#### Sub-components (internal to file)

| Component | Purpose |
|---|---|
| `TechnicalSection` | Grid of indicator cards + Bollinger Bands display |
| `LLMSection` | AI summary, reasoning, insights, catalysts, risks |
| `SentimentSection` | Score gauge, recommendation, contribution bars |
| `IndicatorCard` | Small card showing indicator label, value, signal |
| `EmptySection` | Fallback when a section has no data |

#### Data Sources

| Query | API Endpoint | Refetch Interval |
|---|---|---|
| Analysis Report | `/v1/analysis/{symbol}/latest` | 300s |
| Price Chart | `/v1/stocks/{symbol}/history` | 60s |

---

### 4. Ops View

**Component:** `OpsDashboard` in `src/components/OpsDashboard.tsx`

Operational monitoring dashboard.

#### Layout

```
┌─────────────────────────────────────────────────────┐
│  Service Level Objectives                           │
│  [API Error Rate] [Avg Latency] [Stale Rate]        │
├─────────────────────────────────────────────────────┤
│  HTTP Metrics                                       │
│  [Requests] [5xx Errors] [Error Rate] [Avg Latency] │
├─────────────────────────────────────────────────────┤
│  Signal Freshness                                   │
│  [Total Signals] [Stale Signals] [Stale Rate]       │
├─────────────────────────────────────────────────────┤
│  Delivery Channels                                  │
│  [Webhook] [Email] [SMS] ...                        │
├─────────────────────────────────────────────────────┤
│  Model Usage (1h)                                   │
│  [Cost] [Prompt Tokens] [Completion Tokens]         │
├─────────────────────────────────────────────────────┤
│  Active Alerts (N)                                  │
│  [Alert Item] [Alert Item] ...                      │
└─────────────────────────────────────────────────────┘
```

#### Components

| Component | File | Purpose |
|---|---|---|
| `OpsDashboard` | `src/components/OpsDashboard.tsx` | Sections for SLOs, HTTP, freshness, delivery, model usage, alerts |
| `MetricCard` | `src/components/MetricCard.tsx` | Stat card with title, value, subtitle, status dot |
| `AlertItem` | `src/components/AlertItem.tsx` | Alert with severity border, code, message, timestamp |

#### Data Sources

| Query | API Endpoint | Refetch Interval |
|---|---|---|
| Ops Metrics | `/v1/ops/metrics` | 30s |
| Ops Alerts | `/v1/ops/alerts/latest` | 60s |
| Dashboard SLO | `/v1/ops/dashboard/latest` | 60s |

---

## Shared Components

### Header (`src/components/Header.tsx`)

Sticky top navigation bar with:
- Logo ("S" icon) + "Saham AI" title + "IHSG Analyzer" subtitle
- Tab navigation (Dashboard / Signals / Analysis / Ops) — shows labels on desktop, icons on mobile
- `LiveIndicator` component (desktop only)

### LiveIndicator (`src/components/LiveIndicator.tsx`)

Pulsing green dot showing "Live" or "Stale" status.
- Accepts `lastUpdated` date and `staleThresholdMs` (default 30s)
- Checks every 5s whether data is stale
- Exports `useDataFreshness()` hook for tracking freshness in components

### ErrorBoundary (`src/components/ErrorBoundary.tsx`)

Class-based React error boundary wrapping each major widget.
- Shows error message with "Try again" button
- Accepts optional `fallback` prop

### Skeleton (`src/components/Skeleton.tsx`)

Reusable loading skeleton with variants:
- `Skeleton` — `variant: 'text' | 'rect' | 'circle'`
- `CardSkeleton` — pre-built card skeleton with N lines

---

## API Client (`src/lib/api.ts`)

All API calls go through a typed `fetchApi` helper with relative URLs (proxied to `localhost:3000` by Vite).

| Function | Endpoint | Returns |
|---|---|---|
| `fetchSignals()` | `/v1/signals/latest` | `SignalData[]` |
| `fetchStockQuote(symbol)` | `/v1/stocks/{symbol}/quote` | `StockQuote` |
| `fetchStockHistory(symbol, interval)` | `/v1/stocks/{symbol}/history` | `{ data: [...] }` |
| `fetchAIAnalysis(symbol)` | `/v1/analysis/{symbol}/latest` | `AIInsight` |
| `fetchAIAnalysisReport(symbol)` | `/v1/analysis/{symbol}/latest` | `AIAnalysisReport` |
| `fetchPortfolioSummary()` | `/v1/portfolio/summary` | `PortfolioSummary` |
| `fetchMarketOverview()` | `/v1/market/overview` | `MarketOverview` |
| `fetchOpsMetrics()` | `/v1/ops/metrics` | `OpsMetrics` |
| `fetchOpsAlerts()` | `/v1/ops/alerts/latest` | `{ alerts: OpsAlert[] }` |
| `fetchDashboardSLO()` | `/v1/ops/dashboard/latest` | `{ slo: DashboardSLO }` |
| `searchStocks(query)` | `/v1/stocks/search` | `StockQuote[]` |

---

## Type Definitions (`src/types.ts`)

| Type | Purpose |
|---|---|
| `StockQuote` | Single stock price data |
| `SignalData` | Trading signal with status (fresh/stale/missing) |
| `PortfolioHolding` | Individual portfolio position |
| `PortfolioSummary` | Total value, gain/loss, holdings, sector allocation |
| `PricePoint` | OHLCV data point for charts |
| `AIInsight` | Compact AI analysis for dashboard cards |
| `AIAnalysisReport` | Full analysis report with technical, LLM, and sentiment sections |
| `MarketIndex` | Stock index data |
| `MarketOverview` | Indices, gainers, losers, market status |
| `OpsMetrics` | HTTP, freshness, delivery, model usage metrics |
| `OpsAlert` | Operational alert with severity |
| `DashboardSLO` | API error rate, latency, stale rate targets |
| `TimeRange` | `'1D' | '1W' | '1M' | '3M' | '1Y'` |

---

## React Query Configuration (`src/lib/query-client.ts`)

```ts
{
  staleTime: 30_000,       // Data considered fresh for 30s
  gcTime: 5 * 60 * 1000,   // Cache kept for 5 minutes
  retry: 2,                // Retry failed requests twice
  refetchOnWindowFocus: false,
}
```

---

## Vite Configuration

- React plugin for JSX/TSX
- Tailwind CSS v4 plugin (`@tailwindcss/vite`)
- Proxy: `/v1` and `/health` → `http://localhost:3000`

---

## Testing

Test files in `test/`:
- `PriceChart.test.tsx`
- `StockWatchlist.test.tsx`
- `SignalsDashboard.test.tsx`

Framework: Vitest + Testing Library (happy-dom environment).

---

## File Structure

```
packages/web/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx                        # App entry: QueryClientProvider + App
│   ├── App.tsx                         # Root: tab routing, data fetching, layout
│   ├── index.css                       # Tailwind CSS imports
│   ├── types.ts                        # All TypeScript interfaces
│   ├── components/
│   │   ├── Header.tsx                  # Navigation header with tabs
│   │   ├── LiveIndicator.tsx           # Live/stale status + useDataFreshness hook
│   │   ├── Skeleton.tsx                # Loading skeleton components
│   │   ├── ErrorBoundary.tsx           # React error boundary
│   │   ├── PortfolioSummaryCard.tsx    # Portfolio value + sector allocation
│   │   ├── MarketOverviewCard.tsx      # Market indices, gainers, losers
│   │   ├── PriceChart.tsx              # Recharts area + volume chart
│   │   ├── StockWatchlist.tsx          # Sortable stock list with signals
│   │   ├── AIInsights.tsx              # AI insight cards
│   │   ├── AlertsPanel.tsx             # Operational alerts list
│   │   ├── SignalsDashboard.tsx        # Signals grid view
│   │   ├── SignalCard.tsx              # Individual signal card
│   │   ├── OpsDashboard.tsx            # Ops monitoring dashboard
│   │   ├── MetricCard.tsx              # Stat metric card
│   │   ├── AlertItem.tsx               # Individual alert item
│   │   ├── AIAnalysisReportPage.tsx    # Full analysis report (active)
│   │   └── AIAnalysisReport.tsx        # Alternate analysis report (unused)
│   ├── store/
│   │   └── dashboard-store.ts          # Zustand store for tab, symbol, timeRange
│   └── lib/
│       ├── api.ts                      # Typed API client
│       ├── query-client.ts             # React Query client config
│       └── url-sync.ts                 # URL hash parsing/updating/subscribing
└── test/
    ├── setup.ts
    ├── PriceChart.test.tsx
    ├── StockWatchlist.test.tsx
    └── SignalsDashboard.test.tsx
```
