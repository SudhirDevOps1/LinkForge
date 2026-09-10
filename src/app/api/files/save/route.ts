// =============================================================================
// 🔒 POST /api/files/save — Saves file metadata with Neon DB AES-256-GCM Encryption
// -----------------------------------------------------------------------------
// Transparently encrypts `rawFileName` and `rawStorageKey` with `encryptField()`
// before inserting into the Neon PostgreSQL / SQLite database.
// Database console and backups will store only unreadable ciphertext `enc:v1:...`.
// =============================================================================
import { z } from "zod";
import { count, eq } from "drizzle-orm";
import { MAX_FILES_PER_PROFILE, storageDriver } from "@/config/storage.config";
import { db } from "@/db";
import { mediaFiles } from "@/db/schema";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { encryptField } from "@/lib/db-cipher";
import { sanitizeFileName } from "@/lib/media";
import { sanitizeKey } from "@/lib/storage";

const saveFileSchema = z.object({
  rawFileName: z.string().trim().min(1).max(255),
  rawStorageKey: z.string().trim().min(1).max(500),
  fileSize: z.number().int().min(1),
  mimeType: z.string().trim().min(3).max(120),
  originalSize: z.number().int().optional(),
  isCompressed: z.boolean().optional().default(false),
});

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "files:save", 30);

  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");

  const [agg] = await db
    .select({ count: count() })
    .from(mediaFiles)
    .where(eq(mediaFiles.profileId, profile.id));

  if ((agg?.count ?? 0) >= MAX_FILES_PER_PROFILE) {
    throw new ApiError(400, `Storage limit reached (max ${MAX_FILES_PER_PROFILE} files)`);
  }

  const { rawFileName, rawStorageKey, fileSize, mimeType } = parseOrThrow(
    saveFileSchema,
    await req.json().catch(() => ({})),
  );

  const cleanName = sanitizeFileName(rawFileName);
  const cleanKey = sanitizeKey(rawStorageKey);

  // 🔐 Transparent AES-256-GCM Encryption at rest
  const encryptedFileName = encryptField(cleanName);
  const encryptedStorageKey = encryptField(cleanKey);

  // Public proxy URL for playback / viewing
  const publicUrl = `/api/storage/file/${cleanKey}`;

  const fileId = crypto.randomUUID();

  const [created] = await db
    .insert(mediaFiles)
    .values({
      id: fileId,
      profileId: profile.id,
      fileName: encryptedFileName,
      storageKey: encryptedStorageKey,
      mimeType,
      sizeBytes: fileSize,
      storageProvider: storageDriver,
      url: publicUrl,
    })
    .returning();

  return json(
    {
      success: true,
      file: {
        id: created.id,
        fileName: cleanName, // Return decrypted for immediate UI display
        mimeType: created.mimeType,
        sizeBytes: created.sizeBytes,
        storageProvider: created.storageProvider,
        storageKey: cleanKey,
        url: created.url,
        createdAt: created.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
});
