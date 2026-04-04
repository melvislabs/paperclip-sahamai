# CI/CD Documentation

This document describes the CI/CD pipelines, Docker configuration, and deployment workflows for Saham AI.

## Overview

Saham AI uses GitHub Actions for continuous integration and deployment. The pipeline consists of three main workflows:

1. **CI** — Lint, typecheck, test, and build verification
2. **Docker Build & Push** — Container image build and registry push
3. **Deploy** — Staging and production deployment

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

Triggered on:
- Push to `main` or `develop` branches
- Pull requests targeting `main`

**Environment:** Node.js 22 on `ubuntu-latest`

#### Jobs

| Job | Purpose | Dependencies |
|-----|---------|-------------|
| `lint-and-typecheck` | TypeScript type checking across all packages | None |
| `test` | Unit tests with coverage + runtime smoke check | `lint-and-typecheck` |
| `build` | Full monorepo build + output verification | `test` |

**Job details:**

- **lint-and-typecheck:** Runs `tsc --noEmit` against `shared`, `api`, and `worker` packages
- **test:** Builds all packages, runs `npm test`, generates coverage reports, and executes `smoke:runtime`
- **build:** Runs full `npm run build` and verifies `dist/` directories exist for `shared`, `api`, and `worker`

**Pipeline flow:**
```
push/PR → lint-and-typecheck → test → build
```

### 2. Docker Build & Push Workflow (`.github/workflows/docker.yml`)

Triggered on:
- Push to `main`, `develop`, or version tags (`v*`)
- Pull requests targeting `main`

**Registry:** GitHub Container Registry (`ghcr.io`)

#### Jobs

| Job | Image | Dockerfile |
|-----|-------|-----------|
| `docker-api` | `{repo}-api` | `Dockerfile` |
| `docker-worker` | `{repo}-worker` | `Dockerfile.worker` |

**Image tagging strategy:**

| Tag Type | Pattern | Example |
|----------|---------|---------|
| Branch | `type=ref,event=branch` | `main`, `develop` |
| PR | `type=ref,event=pr` | `pr-123` |
| Semantic version | `type=semver,pattern={{version}}` | `v1.2.3` |
| Major.Minor | `type=semver,pattern={{major}}.{{minor}}` | `1.2` |
| SHA | `type=sha` | `abc1234` |

**Build configuration:**
- Uses Docker Buildx for multi-platform support
- GitHub Actions cache (`type=gha`) for layer caching
- Push disabled for pull requests
- Multi-stage builds with `runtime` target

### 3. Deploy Workflow (`.github/workflows/deploy.yml`)

Triggered on:
- Successful completion of "Docker Build & Push" workflow on `main`

#### Jobs

| Job | Environment | Condition |
|-----|------------|-----------|
| `deploy-staging` | `staging` | Docker workflow succeeded |
| `deploy-production` | `production` | `deploy-staging` succeeded + `refs/heads/main` |

**Required secrets:**

| Secret | Purpose |
|--------|---------|
| `DEPLOY_TOKEN` | Authentication for deployment |
| `STAGING_HOST` | Staging server hostname |
| `PRODUCTION_HOST` | Production server hostname |

**Deployment flow:**
```
Docker success → deploy-staging → deploy-production
```

## Docker Configuration

### Main API Image (`Dockerfile`)

Multi-stage build with two stages:

| Stage | Purpose |
|-------|---------|
| `build` | Install dependencies, compile TypeScript |
| `runtime` | Production image with compiled output only |

**Build stage:**
- Base: `node:22-alpine`
- Installs all dependencies via `npm ci`
- Builds `shared`, `worker`, and `api` packages
- Prunes dev dependencies

**Runtime stage:**
- Base: `node:22-alpine`
- `NODE_ENV=production`
- Copies only production `node_modules` and compiled `dist/`
- Exposes port `3000`
- Entrypoint: `node packages/api/dist/server.js`

### Worker Image (`Dockerfile.worker`)

Separate Dockerfile for the data ingestion worker (structure mirrors API image).

### Local Development (`docker-compose.yml`)

Provides PostgreSQL 16 for local development:

| Service | Image | Port | Credentials |
|---------|-------|------|-------------|
| `postgres` | `postgres:16-alpine` | 5432 | `sahamai`/`sahamai_dev_pass` |

**Health check:** `pg_isready` every 10s

## Deployment Runbook

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full deployment runbook including:

- Local build and verification steps
- Docker image building
- Runtime smoke checks
- Deploy smoke validation
- Rollback procedures

### Quick Deploy Commands

```bash
# Install and verify
npm ci && npm run build && npm test

# Build Docker image
docker build -t paperclip-sahamai:latest .

# Run locally
docker run --rm -p 3000:3000 -e PORT=3000 paperclip-sahamai:latest

# Verify health
curl -sS http://127.0.0.1:3000/health

# Deploy smoke check
SMOKE_BASE_URL=https://<host> npm run smoke:deploy
```

## Environment Variables

| Variable | Context | Purpose |
|----------|---------|---------|
| `PORT` | Runtime | HTTP server port (default: 3000) |
| `NODE_ENV` | Build/Runtime | Environment mode |
| `DATABASE_URL` | Runtime | PostgreSQL connection string |
| `STOCK_API_PROVIDER` | Runtime | Data provider selection |
| `STOCK_API_KEY` | Runtime | Stock data API key |
| `OPENAI_API_KEY` | Runtime | LLM analysis API key |
| `ALLOWED_ORIGINS` | Runtime | CORS configuration |

## Package Scripts

| Script | Package | Purpose |
|--------|---------|---------|
| `build` | Root | Build all packages |
| `test` | Root | Run all tests |
| `test:coverage` | shared | Generate coverage report |
| `smoke:runtime` | api | Runtime smoke check |
| `smoke:deploy` | api | Deploy smoke validation |
| `dev` | api | Start API dev server |
| `dev:web` | web | Start web dev server |

## Branching Strategy

| Branch | Purpose | CI | Docker | Deploy |
|--------|---------|----|--------|--------|
| `main` | Production | ✓ | ✓ (push) | ✓ |
| `develop` | Development | ✓ | ✓ (push) | — |
| `v*` tags | Releases | — | ✓ (push) | — |
| PR → `main` | Review | ✓ | ✓ (no push) | — |
