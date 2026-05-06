import 'server-only';

/**
 * Rate limit en memoria (per-process). Para deploy multi-instance hay que mover
 * a Redis (`apps/web/src/server/redis.ts` ya tiene `rateLimit` en Redis para
 * contribuciones).
 *
 * Uso:
 *   const rl = await checkRateLimit(`register:${ip}`, { window: 60_000, max: 5 });
 *   if (!rl.allowed) return tooManyRequests(rl.retryAfter);
 */

interface Bucket {
  /** Timestamps de los hits dentro de la ventana actual. */
  hits: number[];
}

const STORE = new Map<string, Bucket>();
const MAX_KEYS = 50_000; // hard cap para evitar OOM

function gc() {
  if (STORE.size <= MAX_KEYS) return;
  const cutoff = Date.now() - 5 * 60_000;
  for (const [k, v] of STORE) {
    v.hits = v.hits.filter((t) => t > cutoff);
    if (v.hits.length === 0) STORE.delete(k);
  }
}

export interface RateLimitOptions {
  /** Ventana en ms. */
  window: number;
  /** Máximo de hits permitidos en la ventana. */
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Segundos hasta reset (cuando expira el hit más antiguo). */
  retryAfter: number;
}

export function checkRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const start = now - opts.window;
  let b = STORE.get(key);
  if (!b) {
    b = { hits: [] };
    STORE.set(key, b);
    gc();
  }
  // Purga hits viejos
  b.hits = b.hits.filter((t) => t > start);

  if (b.hits.length >= opts.max) {
    const oldest = b.hits[0]!;
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((oldest + opts.window - now) / 1000)),
    };
  }
  b.hits.push(now);
  return { allowed: true, remaining: opts.max - b.hits.length, retryAfter: 0 };
}

/** Helper para route handlers REST. Si excede, devuelve `Response 429`. */
export function rateLimitOr429(
  key: string,
  opts: RateLimitOptions,
): { Response: typeof Response; response?: Response } {
  const r = checkRateLimit(key, opts);
  if (!r.allowed) {
    return {
      Response,
      response: new Response(
        JSON.stringify({ error: 'Too many requests', retryAfter: r.retryAfter }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(r.retryAfter),
          },
        },
      ),
    };
  }
  return { Response };
}

/** Helper canónico: aplica rate-limit y lanza 429 si se excede. */
export function enforceRateLimit(key: string, opts: RateLimitOptions): Response | null {
  const r = checkRateLimit(key, opts);
  if (r.allowed) return null;
  return new Response(
    JSON.stringify({ error: 'Demasiadas peticiones. Intenta de nuevo en unos segundos.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(r.retryAfter),
      },
    },
  );
}

/** Extrae IP de un Request, con fallback. */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}
