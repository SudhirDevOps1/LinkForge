// =============================================================================
// 🚦 Rate Limiting — 100 req/min default (spec), tumhari marzi ke buckets
// -----------------------------------------------------------------------------
// Default: in-memory sliding window (single instance / self-hosted ke liye).
// Upstash Redis REST env set hai to distributed mode automatically on ho jata
// hai (Vercel/Cloudflare/Netlify jaise multi-instance platforms ke liye sahi).
// =============================================================================

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // epoch ms
  retryAfterSeconds: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();
let lastSweep = Date.now();

/** Memory GC — stale buckets ko har ~60s me sweep karta hai */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt < now) store.delete(key);
  }
}

function checkMemory(key: string, limit: number, windowMs: number, now: number): RateLimitResult {
  sweep(now);
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetAt,
      retryAfterSeconds: 0,
    };
  }
  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  const isSuccess = existing.count <= limit;
  const retryAfterSeconds = isSuccess ? 0 : Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    success: isSuccess,
    limit,
    remaining,
    resetAt: existing.resetAt,
    retryAfterSeconds,
  };
}

/** Upstash Redis REST adapter (env: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_URL) */
async function checkUpstash(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult | null> {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ??
    (process.env.UPSTASH_REDIS_URL?.startsWith("https")
      ? process.env.UPSTASH_REDIS_URL
      : undefined);
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_TOKEN;
  if (!url || !token) return null;

  const windowSec = Math.ceil(windowMs / 1000);
  const redisKey = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSec, "NX"],
      ]),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result: number }>;
    const count = Number(data?.[0]?.result ?? 1);
    const isSuccess = count <= limit;
    const resetAt = (Math.floor(Date.now() / windowMs) + 1) * windowMs;
    const retryAfterSeconds = isSuccess ? 0 : Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
    return {
      success: isSuccess,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt,
      retryAfterSeconds,
    };
  } catch {
    return null; // Redis down → memory fallback (availability > strictness)
  }
}

/**
 * Fixed-window rate limiter.
 * @param key  unique bucket key, e.g. `login:${ip}` ya `api:${userId}`
 * @param limit max requests per window (default 100)
 * @param windowMs window size (default 60s = 100 req/min per spec)
 */
export async function rateLimit(
  key: string,
  limit = 100,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  const now = Date.now();
  const upstash = await checkUpstash(key, limit, windowMs);
  if (upstash) return upstash;
  return checkMemory(key, limit, windowMs, now);
}

/**
 * Dual-bucket rate limiter: enforces both IP-level and account-level limits.
 * Protects against distributed botnets rotating IPs against a single targeted email.
 */
export async function rateLimitDual(
  ipKey: string,
  accountKey?: string | null,
  ipLimit = 10,
  accountLimit = 5,
  windowMs = 15 * 60_000, // 15-minute brute-force window
): Promise<RateLimitResult> {
  // 1. Enforce IP-level rate limit
  const ipResult = await rateLimit(ipKey, ipLimit, windowMs);
  if (!ipResult.success) {
    return ipResult;
  }

  // 2. Enforce Account-level rate limit (if target account key provided)
  if (accountKey) {
    const accResult = await rateLimit(accountKey, accountLimit, windowMs);
    if (!accResult.success) {
      return accResult;
    }
  }

  return ipResult;
}

/** Request se best-effort client IP nikaalo */
export function clientIp(req: Request): string {
  const h = (n: string) => req.headers.get(n);
  const fwd = h("x-forwarded-for");
  return (
    fwd?.split(",")[0]?.trim() ||
    h("x-real-ip") ||
    h("cf-connecting-ip") ||
    "0.0.0.0"
  );
}
