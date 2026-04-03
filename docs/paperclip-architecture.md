# Saham AI Paperclip Architecture

## Objective
Build a reliable, low-latency AI stock analyzer for Indonesian equities (IHSG) using Paperclip as the control plane for orchestration, delegation, and auditability.

## Design Principles
- Keep the critical path deterministic before LLM usage.
- Prefer verifiable data contracts over opaque model outputs.
- Fail closed on stale or invalid market signals.
- Optimize cost by limiting LLM synthesis to shortlisted symbols.
- Keep all execution traceable through Paperclip issue/run history.

## System Overview

```text
Market/Fundamental/News Sources
  -> Ingestion + Snapshot Storage
  -> Feature Pipeline + Data Quality Gates
  -> Deterministic Scoring Engine
  -> Risk Overlay (liquidity/exposure/confidence)
  -> Signal Registry (versioned + TTL)
  -> Delivery API + Fanout (telegram/slack/email)
  -> Ops Dashboard + Alerts

Paperclip Control Plane
  -> Agent task routing, approvals, delegation, audit logs, run-level traceability
```

## Paperclip Platform Reference Stack

The control-plane architecture for this project follows the stack requested in [SAHA-18](/SAHA/issues/SAHA-18):

```text
┌─────────────────────────────────────┐
│  React UI (Vite)                    │
│  Dashboard, org management, tasks   │
├─────────────────────────────────────┤
│  Express.js REST API (Node.js)      │
│  Routes, services, auth, adapters   │
├─────────────────────────────────────┤
│  PostgreSQL (Drizzle ORM)           │
│  Schema, migrations, embedded mode  │
├─────────────────────────────────────┤
│  Adapters                           │
│  Claude, Codex, Gemini, Cursor,     │
│  OpenCode, OpenClaw, Hermes,        │
│  Process, HTTP                      │
└─────────────────────────────────────┘
```

Saham AI consumes this platform as the orchestration/control layer while the service runtime in this repository handles domain APIs (`/v1/signals/*`, `/v1/ops/*`) and delivery execution.

## Runtime Components in This Repo
- `src/server.ts`
  - `/v1/signals/latest/:symbol`: single-symbol latest signal with freshness guard.
  - `/v1/signals/latest`: batch latest signals with stale/missing status.
  - `/v1/signals/summary/latest`: aggregate freshness summary.
  - `/v1/ops/metrics`: operational metrics payload.
  - `/v1/ops/dashboard/latest`: SLO-focused dashboard payload.
  - `/v1/ops/alerts/latest`: active alert evaluation output.
- `src/store.ts`
  - In-memory signal registry with stale detection via `expiresAt`.
- `src/cache.ts`
  - TTL cache to reduce hot-path read latency.
- `src/fanout.ts`
  - Multi-channel delivery worker with idempotency, retry/backoff, dead-letter support, and optional rate limits.
- `src/observability.ts`
  - HTTP, delivery, freshness, and model-usage telemetry.
  - Alert evaluation for error-rate, freshness degradation, channel health, and cost spikes.

## Paperclip Orchestration Model
- CEO defines priorities and milestones.
- CTO converts priorities into architecture and execution tracks.
- Engineer agents implement bounded subtasks with contract tests.
- Analyst/Trader agents consume outputs for market decisions.
- Paperclip issue hierarchy maps architecture layers into executable work with dependencies.

## Data Contracts and Validation Rules
- Latest signal contract includes:
  - `symbol`, `action`, `confidence`, `generatedAt`, `expiresAt`, `version`, `reasonCodes`.
- Freshness rule:
  - `expiresAt <= now` means stale; stale signal should not be treated as tradable.
- API behavior:
  - Missing symbol -> 404.
  - Stale symbol -> 503 for symbol endpoint.
  - Summary endpoint reports stale surface area for runbook triggers.

## Reliability and Observability
- API reliability SLOs (initial):
  - 5xx error rate <= 5% over 5m window.
  - Low-latency latest reads via cache for repeated symbol queries.
- Delivery reliability:
  - Success rate tracking per channel in 15m window.
  - Dead-letter records preserved for remediation.
- Cost controls:
  - Hourly model token/cost aggregation.
  - Configurable cost-spike threshold alerts.

## Operating Workflow (Heartbeat-Aligned)
1. Agent wakes from assignment/comment/approval event.
2. Agent checks out issue and reads heartbeat context.
3. Agent executes scoped work in shared/local workspace.
4. Agent updates issue with status, links, and blockers.
5. If blocked, status is explicitly set to `blocked` with an unblock owner.

## Technical Roadmap (Next Iteration)
1. Replace seeded in-memory signal store with persistent registry (Postgres/Redis).
2. Add ingestion connectors for production IHSG data providers.
3. Add scoring/risk modules as first-class services with versioned inputs/outputs.
4. Add event bus (NATS/Kafka/SQS) for publish/fanout decoupling.
5. Add runbook docs for each alert code (`runbook://*` mapping).

## Acceptance Criteria
- Architecture is documented and maps directly to implemented modules.
- API/delivery/observability boundaries are explicit and testable.
- Paperclip execution model and ownership boundaries are clear for delegation.
