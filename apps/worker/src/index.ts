import { ocrWorker } from './jobs/ocr.js';
import { aiWorker } from './jobs/ai.js';
import { embedWorker } from './jobs/embed.js';
import { lockWorker } from './jobs/lock.js';

const workers = [ocrWorker, aiWorker, embedWorker, lockWorker];

for (const w of workers) {
  w.on('completed', (job) => console.log(`[${w.name}] done`, job.id));
  w.on('failed', (job, err) => console.error(`[${w.name}] failed`, job?.id, err.message));
}

console.log(`[worker] ${workers.length} queues running`);

async function shutdown() {
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
