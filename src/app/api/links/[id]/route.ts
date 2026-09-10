// ✏️ /api/links/[id] — PATCH (update) / DELETE (remove) — owner-only
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { links } from "@/db/schema";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { linkUpdateSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "links:update", 60);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");
  const { id } = await ctx.params;
  const input = parseOrThrow(linkUpdateSchema, await req.json().catch(() => ({})));

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    // Null & date cleanup for nullable date/url fields
    if (["scheduledAt", "expiresAt"].includes(key)) {
      if (value === "" || value === null) {
        patch[key] = null;
      } else {
        const d = new Date(value as string | number);
        patch[key] = isNaN(d.getTime()) ? null : d;
      }
    } else if (key === "thumbnailUrl") {
      patch[key] = value === "" || value === null ? null : value;
    } else {
      patch[key] = value;
    }
  }

  const [updated] = await db
    .update(links)
    .set(patch)
    .where(and(eq(links.id, id), eq(links.profileId, profile.id)))
    .returning();
  if (!updated) throw new ApiError(404, "Link nahi mila");
  return json({ link: updated });
});

export const DELETE = handle(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "links:delete", 60);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");
  const { id } = await ctx.params;
  const [deleted] = await db
    .delete(links)
    .where(and(eq(links.id, id), eq(links.profileId, profile.id)))
    .returning({ id: links.id });
  if (!deleted) throw new ApiError(404, "Link nahi mila");
  return json({ ok: true });
});
