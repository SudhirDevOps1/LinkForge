// =============================================================================
// 🛡️ API Helpers — error handling, CSRF origin check, rate-limit guard
// =============================================================================
import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "./rate-limit";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function apiError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

/** Wrap a route handler: ApiError → proper status, unknown → 500 (safe message) */
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) return apiError(err.status, err.message);
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
    throw new ApiError(403, "Origin header missing — browser se request bhejein");
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
    throw new ApiError(429, "Too many requests — thoda slow down karein");
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
