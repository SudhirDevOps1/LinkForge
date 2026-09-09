// 👋 POST /api/auth/logout — current session revoke
import { assertSameOrigin, handle, json } from "@/lib/api";
import { signOut } from "@/lib/auth";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await signOut();
  return json({ ok: true });
});
