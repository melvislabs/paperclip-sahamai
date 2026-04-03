# Deployment Runbook

This service ships as a Docker image and exposes HTTP on `PORT` (default `3000`).

## Deploy

1. Install and verify:
```bash
npm ci
npm run build
npm test
npm run smoke:runtime
```

2. Build image:
```bash
docker build -t paperclip-sahamai:latest .
```

3. Run locally as release candidate:
```bash
docker run --rm -p 3000:3000 -e PORT=3000 paperclip-sahamai:latest
```

4. Verify runtime contract:
```bash
curl -sS http://127.0.0.1:3000/health
curl -sS http://127.0.0.1:3000/v1/signals/summary/latest
```

5. Deploy to your runtime platform and run the deploy smoke check against the live host:
```bash
SMOKE_BASE_URL=https://<deployment-host> npm run smoke:deploy
```

`smoke:deploy` validates:
- `/health` returns HTTP 200 and `status: "ok"`
- `/v1/signals/summary/latest` matches the expected response contract

## Smoke Check Interpretation

- `status: "ok"` means at least one latest signal is still fresh.
- `status: "all_stale"` means the service is reachable but all latest signals are stale. This currently appears after the in-memory seed expiry window and can return HTTP 503 by contract.
- Treat `all_stale` as a release risk signal, not an immediate runtime crash. Open a follow-up issue and link it from the deployment timeline if this appears during handoff validation.

## Rollback

1. Keep the previous stable image tag (for example `paperclip-sahamai:<stable-tag>`).
2. Redeploy using the stable image tag in your runtime platform.
3. Re-run deploy smoke checks against the restored deployment:
```bash
SMOKE_BASE_URL=https://<deployment-host> npm run smoke:deploy
```
4. If rollback was caused by data-contract breakage, freeze release promotion and open a follow-up issue linked from the incident timeline.
