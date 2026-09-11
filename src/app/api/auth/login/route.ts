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

  return json({ user: { id: res.user.id, email: res.user.email, name: res.user.name } });
});
