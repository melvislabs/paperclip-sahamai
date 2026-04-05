import 'dotenv/config';
import { runDigestEmailBatch } from './digest-batch.js';

runDigestEmailBatch()
  .then((stats) => {
    console.log('[digest] batch complete', stats);
    process.exit(0);
  })
  .catch((err) => {
    console.error('[digest] batch failed', err);
    process.exit(1);
  });
