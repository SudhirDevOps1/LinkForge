// =============================================================================
// 👤 /api/account — User account management & permanent deletion
// -----------------------------------------------------------------------------
// - PATCH: Update account name and change password
// - DELETE: Permanently delete user account, cascade DB records, and purge
//           all user's media files from Backblaze B2 / storage bucket.
// =============================================================================
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaFiles, profiles, users } from "@/db/schema";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { hashPassword, requireUser, signOut, verifyPassword } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { accountDeleteSchema, accountUpdateSchema } from "@/lib/validations";

export const PATCH = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "account:update", 20);
  const { user, profile } = await requireUser();
  const input = parseOrThrow(accountUpdateSchema, await req.json().catch(() => ({})));

  const updates: Record<string, unknown> = {};

  // 1. Name update
  if (input.name) {
    updates.name = input.name;
    if (profile) {
      await db
        .update(profiles)
        .set({ displayName: input.name, updatedAt: new Date() })
        .where(eq(profiles.id, profile.id));
    }
  }

  // 2. Password change
  if (input.newPassword) {
    if (user.passwordHash) {
      if (!input.currentPassword) {
        throw new ApiError(400, "Current password daalna zaroori hai");
      }
      const matches = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!matches) {
        throw new ApiError(401, "Current password galat hai");
      }
    }
    updates.passwordHash = await hashPassword(input.newPassword);
  }

  if (Object.keys(updates).length > 0) {
    await db.update(users).set(updates).where(eq(users.id, user.id));
  }

  return json({ ok: true, message: "Account update ho gaya" });
});

export const DELETE = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "account:delete", 5);
  const { user, profile } = await requireUser();
  parseOrThrow(accountDeleteSchema, await req.json().catch(() => ({})));

  // 1. Purge all uploaded files from storage (Backblaze B2 / local storage)
  if (profile) {
    try {
      const files = await db
        .select()
        .from(mediaFiles)
        .where(eq(mediaFiles.profileId, profile.id));

      if (files.length > 0) {
        const storage = await getStorage();
        for (const file of files) {
          try {
            await storage.delete(file.storageKey);
          } catch (storageErr) {
            console.warn(
              `[account:delete] storage deletion failed for ${file.storageKey}:`,
              (storageErr as Error).message,
            );
          }
        }
      }
    } catch (err) {
      console.warn("[account:delete] file cleanup error:", (err as Error).message);
    }
  }

  // 2. Delete user from database (cascades to profiles, links, events, media_files, etc.)
  await db.delete(users).where(eq(users.id, user.id));

  // 3. Clear session cookie
  await signOut();

  return json({
    ok: true,
    message: "Aapka account aur sabhi data permanently delete ho gaya.",
  });
});
