// 🔁 POST /api/auth/reset — token se naya password set karo
import { assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { resetPassword } from "@/lib/auth";
import { resetSchema } from "@/lib/validations";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "auth:reset", 10);
  const { token, password } = parseOrThrow(
    resetSchema,
    await req.json().catch(() => ({})),
  );
  await resetPassword(token, password);
  return json({ ok: true });
});
