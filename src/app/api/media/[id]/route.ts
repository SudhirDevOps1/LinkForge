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
  parseOrThrow,
} from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { mediaFileUpdateSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "media:update", 30);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");
  const { id } = await ctx.params;
  const input = parseOrThrow(mediaFileUpdateSchema, await req.json().catch(() => ({})));

  const [row] = await db
    .select()
    .from(mediaFiles)
    .where(and(eq(mediaFiles.id, id), eq(mediaFiles.profileId, profile.id)))
    .limit(1);
  if (!row) throw new ApiError(404, "File not found");

  const [updated] = await db
    .update(mediaFiles)
    .set({ fileName: input.fileName.trim() })
    .where(eq(mediaFiles.id, id))
    .returning();

  return json({ file: updated });
});

export const DELETE = handle(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "media:delete", 30);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");
  const { id } = await ctx.params;

  const [row] = await db
    .select()
    .from(mediaFiles)
    .where(and(eq(mediaFiles.id, id), eq(mediaFiles.profileId, profile.id)))
    .limit(1);
  if (!row) throw new ApiError(404, "File not found");

  // Guard 1: provider mismatch — galat backend par delete se orphan banta hai
  const storage = await getStorage();
  if (row.storageProvider !== storage.provider) {
    throw new ApiError(
      400,
      `Storage provider mismatch (file: ${row.storageProvider}, current: ${storage.provider})`,
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
        error: "File is currently in use by active links — please unlink first",
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
