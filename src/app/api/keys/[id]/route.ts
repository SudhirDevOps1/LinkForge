// 🔌 DELETE /api/keys/[id] — API key revoke (soft-delete)
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = handle(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "keys:write", 20);
  const { user } = await requireUser();
  const { id } = await ctx.params;
  const [revoked] = await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id)))
    .returning({ id: apiKeys.id });
  if (!revoked) throw new ApiError(404, "API key not found");
  return json({ ok: true });
});
