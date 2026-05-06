import { Queue, Worker, type WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

export const QUEUES = {
  ocr: 'hilo.ocr',
  ai: 'hilo.ai',
  embed: 'hilo.embed',
  export: 'hilo.export',
  lock: 'hilo.lock',
} as const;

export function makeQueue<T = unknown>(name: string) {
  return new Queue<T>(name, { connection });
}

export function makeWorker<T = unknown>(
  name: string,
  processor: (job: { data: T; id?: string }) => Promise<unknown>,
  opts: Partial<WorkerOptions> = {},
) {
  return new Worker<T>(name, async (job) => processor({ data: job.data, id: job.id }), {
    connection,
    concurrency: 4,
    ...opts,
  });
}
