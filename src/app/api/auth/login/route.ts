// 🔑 POST /api/auth/login — email + password sign-in
import { assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { signIn } from "@/lib/auth";
import { clientIp } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "auth:login", 10); // brute-force protection
  const input = parseOrThrow(loginSchema, await req.json().catch(() => ({})));
  const { user } = await signIn({
    ...input,
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  return json({ user: { id: user.id, email: user.email, name: user.name } });
});
