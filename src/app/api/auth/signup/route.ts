import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { createSession, setSessionCookie, signUp } from "@/lib/auth";
import { autoMigrate } from "@/db/auto-migrate";
import { clientIp } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validations";
import { verifyAltchaSolution } from "@/lib/altcha";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  // Strict signup rate limit: max 5 accounts per 15 minutes per IP
  await guardRateLimit(req, "auth:signup", 5, 15 * 60_000);
  await autoMigrate(); // Guarantees tables exist before running query
  const input = parseOrThrow(signupSchema, await req.json().catch(() => ({})));

  // Verify Proof-of-Work anti-bot protection
  const altchaRes = verifyAltchaSolution(input.altcha);
  if (!altchaRes.verified) {
    throw new ApiError(400, altchaRes.error || "Security verification failed. Please complete the challenge.");
  }

  const user = await signUp({
    name: input.name,
    email: input.email,
    password: input.password,
  });
  const session = await createSession(user.id, {
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  await setSessionCookie(session.id, session.expiresAt);
  return json(
    { user: { id: user.id, email: user.email, name: user.name } },
    { status: 201 },
  );
});
