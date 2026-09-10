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
  // Atomic batch if driver supports transactions; fallback loop for stateless HTTP drivers (e.g. Neon HTTP)
  try {
    if (typeof db.transaction === "function") {
      await db.transaction(async (tx) => {
        for (let i = 0; i < ids.length; i++) {
          await tx
            .update(links)
            .set({ position: i })
            .where(and(eq(links.id, ids[i]), eq(links.profileId, profile.id)));
        }
      });
      return json({ ok: true, count: ids.length });
    }
  } catch (txErr: unknown) {
    const msg = txErr instanceof Error ? txErr.message : String(txErr);
    if (!msg.toLowerCase().includes("transaction")) {
      throw txErr;
    }
  }

  // Fallback sequential execution for transactionless drivers
  for (let i = 0; i < ids.length; i++) {
    await db
      .update(links)
      .set({ position: i })
      .where(and(eq(links.id, ids[i]), eq(links.profileId, profile.id)));
  }

  return json({ ok: true, count: ids.length });
});
