// 🗑️ DELETE /api/media/[id] — storage + DB dono se delete (owner-only)
// Guards: provider-mismatch refuse + published links me referenced file
// par 409 (taaki live links accidentally na tootein).
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { links, mediaFiles } from "@/db/schema";
import {
  ApiError,
  assertSameOrigin,
  guardRateLimit,
  handle,
  json,
} from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = handle(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "media:delete", 30);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");
  const { id } = await ctx.params;

  const [row] = await db
    .select()
    .from(mediaFiles)
    .where(and(eq(mediaFiles.id, id), eq(mediaFiles.profileId, profile.id)))
    .limit(1);
  if (!row) throw new ApiError(404, "File nahi mili");

  // Guard 1: provider mismatch — galat backend par delete se orphan banta hai
  const storage = await getStorage();
  if (row.storageProvider !== storage.provider) {
    throw new ApiError(
      400,
      `Provider mismatch (file: ${row.storageProvider}, current: ${storage.provider}) — STORAGE_PROVIDER wapas karke delete karein`,
    );
  }

  // Guard 2: live links me referenced file — pehle link hatao/unlink karo
  const refs = await db
    .select({ id: links.id, title: links.title })
    .from(links)
    .where(and(eq(links.profileId, profile.id), eq(links.url, row.url)))
    .limit(10);
  if (refs.length > 0) {
    return json(
      {
        error: "File active links me use ho rahi hai — pehle unlink karein",
        referencedBy: refs,
      },
      { status: 409 },
    );
  }

  // Storage se delete — fail ho to bhi DB row hatao (orphan cleanup best-effort)
  try {
    await storage.delete(row.storageKey);
  } catch (err) {
    console.warn("[media] storage delete failed:", (err as Error).message);
  }
  await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
  return json({ ok: true });
});
