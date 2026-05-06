import Redis from 'ioredis';

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

export const redis =
  globalThis.__redis ??
  new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', { lazyConnect: true });

if (process.env.NODE_ENV !== 'production') globalThis.__redis = redis;

export async function rateLimit(key: string, windowSec: number, max: number): Promise<boolean> {
  const k = `rl:${key}`;
  const count = await redis.incr(k);
  if (count === 1) await redis.expire(k, windowSec);
  return count <= max;
}
