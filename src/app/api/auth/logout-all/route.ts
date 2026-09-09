// 🚪 POST /api/auth/logout-all — saare sessions revoke (danger zone)
import { assertSameOrigin, handle, json } from "@/lib/api";
import { clearSessionCookie, requireUser, signOutEverywhere } from "@/lib/auth";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  const { user } = await requireUser();
  await signOutEverywhere(user.id);
  await clearSessionCookie();
  return json({ ok: true });
});
