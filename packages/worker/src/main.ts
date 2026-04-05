import { StockApiClient, buildStockApiConfig } from '@sahamai/shared';
import { runDigestEmailBatch } from '@sahamai/api/digest-batch';
import { JobScheduler } from './scheduler.js';
import { QuoteIngestionJob } from './jobs/ingest-quotes.js';
import { HistoryIngestionJob } from './jobs/ingest-history.js';
import { NewsIngestionJob } from './jobs/ingest-news.js';
import { PriceAlertMonitorJob } from './jobs/price-alert-monitor.js';

const SYMBOLS = ['BBCA', 'BBRI', 'BMRI', 'BBNI', 'TLKM', 'ASII', 'UNVR', 'GOTO', 'BUKA', 'ANTM', 'PGAS', 'INDF'];

async function main() {
  console.log('[worker] Starting Sahamai worker...');

  const stockApiConfig = buildStockApiConfig({
    provider: (process.env.STOCK_API_PROVIDER as any) ?? 'finnhub',
    apiKey: process.env.STOCK_API_KEY ?? '',
  });

  const client = new StockApiClient(stockApiConfig);
  const scheduler = new JobScheduler();

  const quoteJob = new QuoteIngestionJob(client, SYMBOLS);
  const historyJob = new HistoryIngestionJob(client, SYMBOLS);
  const newsJob = new NewsIngestionJob(client, SYMBOLS);
  const alertJob = new PriceAlertMonitorJob(client, { symbols: SYMBOLS });

  scheduler.register({
    name: 'ingest-quotes',
    schedule: { expression: '*/5 * * * *', timezone: 'Asia/Jakarta' },
    enabled: true,
  });

  scheduler.register({
    name: 'ingest-history',
    schedule: { expression: '0 * * * *', timezone: 'Asia/Jakarta' },
    enabled: true,
  });

  scheduler.register({
    name: 'ingest-news',
    schedule: { expression: '*/30 * * * *', timezone: 'Asia/Jakarta' },
    enabled: true,
  });

  scheduler.register({
    name: 'price-alert-monitor',
    schedule: { expression: '* * * * *', timezone: 'Asia/Jakarta' },
    enabled: true,
  });

  scheduler.register({
    name: 'digest-email',
    schedule: { expression: '* * * * *', timezone: 'Asia/Jakarta' },
    enabled: process.env.DIGEST_EMAIL_ENABLED !== 'false',
  });

  await scheduler.start('ingest-quotes', async () => {
    console.log('[worker] Running quote ingestion...');
    const results = await quoteJob.execute();
    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`[worker] Quote ingestion complete: ${successCount}/${results.length} successful`);
  });

  await scheduler.start('ingest-history', async () => {
    console.log('[worker] Running history ingestion...');
    const results = await historyJob.execute();
    const totalBars = results.reduce((sum, r) => sum + r.barsIngested, 0);
    console.log(`[worker] History ingestion complete: ${totalBars} bars ingested`);
  });

  await scheduler.start('ingest-news', async () => {
    console.log('[worker] Running news ingestion...');
    const results = await newsJob.execute();
    const totalArticles = results.reduce((sum, r) => sum + r.articlesIngested, 0);
    console.log(`[worker] News ingestion complete: ${totalArticles} articles ingested`);
  });

  await scheduler.start('price-alert-monitor', async () => {
    console.log('[worker] Running price alert monitor...');
    const results = await alertJob.execute();
    const totalTriggered = results.reduce((sum, r) => sum + r.alertsTriggered, 0);
    if (totalTriggered > 0) {
      console.log(`[worker] Price alerts triggered: ${totalTriggered}`);
    }
  });

  await scheduler.start('digest-email', async () => {
    const stats = await runDigestEmailBatch();
    if (stats.sent > 0 || stats.failed > 0) {
      console.log(`[worker] Digest batch: sent=${stats.sent} failed=${stats.failed} skipped=${stats.skipped}`);
    }
  });

  console.log('[worker] All jobs started. Listening for signals...');

  const shutdown = async () => {
    console.log('[worker] Received shutdown signal, stopping jobs...');
    scheduler.stopAll();
    console.log('[worker] All jobs stopped. Exiting.');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('[worker] Failed to start:', error);
  process.exit(1);
});
