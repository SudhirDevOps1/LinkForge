import { ApiError, assertSameOrigin, guardRateLimitDual, handle, json, parseOrThrow } from "@/lib/api";
import { signIn } from "@/lib/auth";
import { autoMigrate } from "@/db/auto-migrate";
import { clientIp } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";
import { verifyAltchaSolution } from "@/lib/altcha";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await autoMigrate(); // Guarantees tables exist before running query
  const input = parseOrThrow(loginSchema, await req.json().catch(() => ({})));

  // 1. Dual-bucket rate limiting (IP: max 10/15min, Account: max 5/15min)
  await guardRateLimitDual(req, "auth:login", input.email, 10, 5, 15 * 60_000);

  // 2. Proof-of-Work anti-bot protection
  const altchaRes = verifyAltchaSolution(input.altcha);
  if (!altchaRes.verified) {
    throw new ApiError(400, altchaRes.error || "Security verification failed. Please complete the challenge.");
  }

  const res = await signIn({
    email: input.email,
    password: input.password,
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  if (res.twoFactorRedirect) {
    return json({ twoFactorRedirect: true, email: res.user.email });
  }

  const response = json({ user: { id: res.user.id, email: res.user.email, name: res.user.name } });

  // Forward Better Auth session headers for full compatibility with client plugins
  try {
    const { auth } = await import("@/lib/auth/better-auth");
    const baRes = await auth.api.signInEmail({
      body: { email: input.email, password: input.password },
      asResponse: true,
    });
    const setCookies = baRes.headers.getSetCookie ? baRes.headers.getSetCookie() : [baRes.headers.get("set-cookie")].filter(Boolean) as string[];
    for (const cookie of setCookies) {
      if (cookie) response.headers.append("set-cookie", cookie);
    }
  } catch (baErr) {
    console.warn("[login] Better Auth cookie bridge notice:", (baErr as Error).message);
  }

  return response;
});
