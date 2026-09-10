// 🪝 /api/webhooks/[id] — PATCH (toggle/edit) / DELETE — owner-only
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { webhooks } from "@/db/schema";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { webhookSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = webhookSchema.partial();

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "webhooks:write", 30);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");
  const { id } = await ctx.params;
  const input = parseOrThrow(patchSchema, await req.json().catch(() => ({})));

  const patch: Record<string, unknown> = {};
  if (input.url !== undefined) patch.url = input.url;
  if (input.isActive !== undefined) patch.isActive = input.isActive;
  if (input.events !== undefined) patch.events = input.events.join(",");

  const [updated] = await db
    .update(webhooks)
    .set(patch)
    .where(and(eq(webhooks.id, id), eq(webhooks.profileId, profile.id)))
    .returning();
  if (!updated) throw new ApiError(404, "Webhook not found");
  return json({
    webhook: {
      id: updated.id,
      url: updated.url,
      events: updated.events.split(","),
      isActive: updated.isActive,
    },
  });
});

export const DELETE = handle(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "webhooks:write", 30);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");
  const { id } = await ctx.params;
  const [deleted] = await db
    .delete(webhooks)
    .where(and(eq(webhooks.id, id), eq(webhooks.profileId, profile.id)))
    .returning({ id: webhooks.id });
  if (!deleted) throw new ApiError(404, "Webhook not found");
  return json({ ok: true });
});
