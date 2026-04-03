# paperclip-sahamai

AI stock analyzer backend for Indonesian equities (IHSG), orchestrated via Paperclip.

## Monorepo Structure

| Package | Description |
|---------|-------------|
| `@sahamai/shared` | Shared types, config, cache, store, fanout worker, observability |
| `@sahamai/api` | Fastify HTTP server with signal endpoints |
| `@sahamai/worker` | Data ingestion worker for real-time market data |

## Quick Start

```bash
npm install
npm run build
npm run test
npm run smoke:runtime
npm run dev
```

Server runs on `PORT` (default `3000`).

## Main Endpoints
- `GET /health`
- `GET /v1/signals/latest/:symbol`
- `GET /v1/signals/latest?symbols=BBCA,TLKM`
- `GET /v1/signals/summary/latest`
- `GET /v1/ops/metrics`
- `GET /v1/ops/dashboard/latest`
- `GET /v1/ops/alerts/latest`

## Deploy Smoke Check

Run this against a deployed host after rollout:

```bash
SMOKE_BASE_URL=https://<deployment-host> npm run smoke:deploy -w @sahamai/api
```

`smoke:deploy` validates:
- `/health` is reachable and returns `status: "ok"`
- `/v1/signals/summary/latest` returns the expected contract (`status` is `ok` or `all_stale`)

## Architecture
See [docs/paperclip-architecture.md](docs/paperclip-architecture.md).

## Deploy + Rollback
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment and rollback steps.
