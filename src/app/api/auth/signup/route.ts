// 📝 POST /api/auth/signup — account banao + auto-login
import { assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { createSession, setSessionCookie, signUp } from "@/lib/auth";
import { clientIp } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validations";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "auth:signup", 10); // 10/min per IP
  const input = parseOrThrow(signupSchema, await req.json().catch(() => ({})));
  const user = await signUp(input);
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
