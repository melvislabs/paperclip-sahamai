const BASE_URL = (process.env.SMOKE_BASE_URL ?? '').replace(/\/$/, '');
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 20000);
const RETRY_INTERVAL_MS = Number(process.env.SMOKE_RETRY_INTERVAL_MS ?? 500);

if (!BASE_URL) {
  console.error('SMOKE_BASE_URL is required (example: https://api.example.com)');
  process.exit(1);
}

function ensureObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object`);
  }
}

async function waitUntil(check, timeoutMs) {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      return await check();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
    }
  }

  throw new Error(`Timed out after ${timeoutMs}ms: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

async function fetchJson(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  const text = await response.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${path} returned non-JSON response (status ${response.status})`);
  }

  return { response, json };
}

async function runSmokeDeploy() {
  const healthResult = await waitUntil(async () => {
    const { response, json } = await fetchJson('/health');
    if (!response.ok) {
      throw new Error(`/health returned status ${response.status}`);
    }

    ensureObject(json, '/health payload');
    if (json.status !== 'ok') {
      throw new Error(`/health status expected "ok", received "${String(json.status)}"`);
    }
    if (typeof json.service !== 'string' || json.service.length === 0) {
      throw new Error('/health payload missing non-empty "service" field');
    }

    return { status: response.status, json };
  }, TIMEOUT_MS);

  const summaryResult = await fetchJson('/v1/signals/summary/latest');
  ensureObject(summaryResult.json, '/v1/signals/summary/latest payload');

  const summary = summaryResult.json;
  const allowedStatuses = new Set(['ok', 'all_stale']);
  if (!allowedStatuses.has(summary.status)) {
    throw new Error(`summary status must be one of ${[...allowedStatuses].join(', ')}, got "${String(summary.status)}"`);
  }

  for (const key of ['total', 'freshCount', 'staleCount']) {
    if (typeof summary[key] !== 'number') {
      throw new Error(`summary payload missing numeric field "${key}"`);
    }
  }

  const output = {
    baseUrl: BASE_URL,
    health: {
      httpStatus: healthResult.status,
      status: healthResult.json.status,
      service: healthResult.json.service
    },
    summary: {
      httpStatus: summaryResult.response.status,
      status: summary.status,
      total: summary.total,
      freshCount: summary.freshCount,
      staleCount: summary.staleCount
    }
  };

  console.log(JSON.stringify(output, null, 2));

  if (summary.status === 'all_stale') {
    console.error('WARNING: summary status is all_stale (service reachable but fresh signal set is empty).');
  }
}

runSmokeDeploy().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
