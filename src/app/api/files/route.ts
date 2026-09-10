// =============================================================================
// 📂 GET /api/files — Lists authenticated user's files with transparent decryption
// -----------------------------------------------------------------------------
// Reads ciphertext fields from Neon DB, automatically applies `decryptField()`,
// and returns plain decrypted records to authorized client sessions.
// =============================================================================
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaFiles } from "@/db/schema";
import { ApiError, handle, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { decryptField, isEncrypted } from "@/lib/db-cipher";
import { formatBytes } from "@/lib/media";

export const GET = handle(async () => {
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");

  const rows = await db
    .select()
    .from(mediaFiles)
    .where(eq(mediaFiles.profileId, profile.id))
    .orderBy(desc(mediaFiles.createdAt))
    .limit(300);

  // Transparently decrypt each record before returning to the frontend
  const decryptedFiles = rows.map((r) => {
    const rawName = r.fileName;
    const rawKey = r.storageKey;
    const decryptedName = decryptField(rawName);
    const decryptedKey = decryptField(rawKey);

    return {
      id: r.id,
      fileName: decryptedName,
      mimeType: r.mimeType,
      sizeBytes: r.sizeBytes,
      storageProvider: r.storageProvider,
      storageKey: decryptedKey,
      url: r.url.startsWith("http") ? r.url : `/api/storage/file/${decryptedKey}`,
      isEncryptedAtRest: isEncrypted(rawName),
      createdAt: r.createdAt.toISOString(),
    };
  });

  const totalBytes = decryptedFiles.reduce((sum, f) => sum + (f.sizeBytes ?? 0), 0);

  return json({
    files: decryptedFiles,
    totalBytes,
    totalLabel: formatBytes(totalBytes),
  });
});
