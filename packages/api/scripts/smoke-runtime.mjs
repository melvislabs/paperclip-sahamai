import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const PORT = Number(process.env.SMOKE_PORT ?? 3300);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const START_TIMEOUT_MS = 20_000;

async function waitForHealth(timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Server not ready yet.
    }
    await delay(300);
  }

  throw new Error(`Timed out waiting for health endpoint on ${BASE_URL}`);
}

async function runSmoke() {
  const child = spawn(process.execPath, ['dist/server.js'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForHealth(START_TIMEOUT_MS);

    const health = await fetch(`${BASE_URL}/health`);
    if (!health.ok) {
      throw new Error(`Health check failed with status ${health.status}`);
    }

    const summary = await fetch(`${BASE_URL}/v1/signals/summary/latest`);
    if (!summary.ok) {
      throw new Error(`Summary endpoint failed with status ${summary.status}`);
    }
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
  }

  if (stderr.trim()) {
    console.error(stderr.trim());
  }

  if (stdout.trim()) {
    console.log(stdout.trim());
  }
}

runSmoke().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
