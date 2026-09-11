// =============================================================================
// 🛡️ API Helpers — error handling, CSRF origin check, rate-limit guard
// =============================================================================
import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "./rate-limit";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function apiError(status: number, message: string, retryAfter?: number) {
  const headers: Record<string, string> = {};
  if (retryAfter && retryAfter > 0) {
    headers["Retry-After"] = String(retryAfter);
  }
  return NextResponse.json(
    { error: message, ...(retryAfter ? { retryAfter } : {}) },
    { status, headers },
  );
}

/** Wrap a route handler: ApiError → proper status, unknown → 500 (safe message) */
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) return apiError(err.status, err.message, err.retryAfter);
      console.error("[api] unexpected error:", err);
      const message = err instanceof Error ? err.message : "Internal server error";
      return apiError(500, message);
    }
  };
}

/**
 * CSRF protection — cookie-based mutations par Origin/Host match enforce karta hai.
 * SameSite=Lax cookies ke saath mil kar cross-site form/POST attacks block.
 *
 * STRICT: mutation (POST/PUT/PATCH/DELETE) par `Origin` header missing ho to
 * bhi 403 — browsers hamesha Origin bhejte hain, isliye missing Origin ka
 * matlab non-browser client (curl/script) hai jo cookie-session routes par
 * allowed nahi. Bearer-key wale `/api/v1/*` routes is function ko call nahi
 * karte (unke liye api-key-auth.ts ka CORS hai), isliye wahan koi break nahi.
 */
export function assertSameOrigin(req: Request): void {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origin = req.headers.get("origin");
  if (!origin) {
    throw new ApiError(403, "Origin header missing — request must originate from the browser");
  }
  const originHost = new URL(origin).host;
  const host = req.headers.get("host");
  if (!host || originHost !== host) {
    throw new ApiError(403, "Cross-origin request blocked (CSRF check failed)");
  }
}

/**
 * Rate-limit guard — throws 429 with Retry-After semantics.
 * Default: 100 req/min per IP (spec ke mutabik).
 */
export async function guardRateLimit(
  req: Request,
  bucket: string,
  limit = 100,
  windowMs = 60_000,
): Promise<void> {
  const id = clientIp(req);
  const result = await rateLimit(`${bucket}:${id}`, limit, windowMs);
  if (!result.success) {
    throw new ApiError(
      429,
      `Too many requests. Please try again in ${result.retryAfterSeconds} seconds.`,
      result.retryAfterSeconds,
    );
  }
}

/**
 * Dual-bucket rate limit guard — checks both IP and specific account.
 */
export async function guardRateLimitDual(
  req: Request,
  bucket: string,
  accountKey?: string | null,
  ipLimit = 10,
  accountLimit = 5,
  windowMs = 15 * 60_000,
): Promise<void> {
  const id = clientIp(req);
  const { rateLimitDual } = await import("./rate-limit");
  const result = await rateLimitDual(
    `${bucket}:ip:${id}`,
    accountKey ? `${bucket}:acc:${accountKey.toLowerCase().trim()}` : null,
    ipLimit,
    accountLimit,
    windowMs,
  );
  if (!result.success) {
    throw new ApiError(
      429,
      `Too many attempts. Please try again in ${result.retryAfterSeconds} seconds.`,
      result.retryAfterSeconds,
    );
  }
}

/** Zod safe-parse helper → 400 with first issue message */
export function parseOrThrow<T>(
  schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: { issues: Array<{ message: string; path: PropertyKey[] }> } } },
  body: unknown,
): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path?.join(".") || "body";
    throw new ApiError(400, `${field}: ${issue?.message ?? "Invalid input"}`);
  }
  return parsed.data;
}
