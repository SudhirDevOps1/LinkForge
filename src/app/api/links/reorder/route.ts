// ↕️ POST /api/links/reorder — drag-and-drop order persist (atomic batch)
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { links } from "@/db/schema";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { reorderSchema } from "@/lib/validations";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "links:reorder", 120);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");
  const { ids } = parseOrThrow(reorderSchema, await req.json().catch(() => ({})));

  // Sirf apne profile ke links hi reorder ho sakte hain (ownership enforced)
  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx
        .update(links)
        .set({ position: i })
        .where(and(eq(links.id, ids[i]), eq(links.profileId, profile.id)));
    }
  });

  return json({ ok: true, count: ids.length });
});
