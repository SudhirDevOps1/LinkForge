// =============================================================================
// 🗑️ DELETE /api/storage/file — Authenticated Object Removal
// Validates user session and ownership before deleting the object from storage
// and cleaning up corresponding metadata from the database.
// =============================================================================
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaFiles } from "@/db/schema";
import { ApiError, assertSameOrigin, handle, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getStorageAdapter, sanitizeKey } from "@/lib/storage";

export const DELETE = handle(async (req: Request) => {
  assertSameOrigin(req);
  const { user, profile } = await requireUser();
  if (!user) throw new ApiError(401, "Unauthorized");

  const url = new URL(req.url);
  let key: string | undefined = url.searchParams.get("key") ?? undefined;

  if (!key) {
    const body = (await req.json().catch(() => ({}))) as { key?: string };
    key = body.key;
  }

  if (!key) {
    throw new ApiError(400, "storageKey zaroori hai");
  }

  const safeKey = sanitizeKey(key);

  // Strict multi-tenant security:
  // User ONLY allowed to delete files inside their own user folder:
  // 1) uploads/${user.id}/*
  // 2) files/${user.id}/*
  // 3) avatars/${user.id}/*
  // 4) Or files explicitly owned in mediaFiles (profileId === profile.id)
  // 5) Or their current profile avatar
  const isUserScoped =
    safeKey.startsWith(`uploads/${user.id}/`) ||
    safeKey.startsWith(`files/${user.id}/`) ||
    safeKey.startsWith(`avatars/${user.id}/`);

  let isOwnedInDb = false;
  if (profile) {
    const [existing] = await db
      .select()
      .from(mediaFiles)
      .where(and(eq(mediaFiles.storageKey, safeKey), eq(mediaFiles.profileId, profile.id)))
      .limit(1);

    if (existing) {
      isOwnedInDb = true;
      await db.delete(mediaFiles).where(eq(mediaFiles.id, existing.id));
    }

    if (profile.avatarUrl && profile.avatarUrl.includes(safeKey)) {
      isOwnedInDb = true;
    }
  }

  if (!isUserScoped && !isOwnedInDb) {
    throw new ApiError(403, "Aap sirf apni files delete kar sakte hain (Permission denied)");
  }

  const adapter = await getStorageAdapter();
  const deleted = await adapter.deleteObject(safeKey);

  return json({ success: deleted, key: safeKey });
});
