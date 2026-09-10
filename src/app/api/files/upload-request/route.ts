// =============================================================================
// 🎟️ POST /api/files/upload-request — Direct Browser-to-B2 Presigned PUT
// -----------------------------------------------------------------------------
// Bypasses Vercel's 4.5 MB request body limit by issuing a presigned PUT URL
// directly to Backblaze B2 (or active storage provider).
// =============================================================================
import { z } from "zod";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  storageDriver,
} from "@/config/storage.config";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getFileEncryptionKey } from "@/lib/file-cipher";
import { sanitizeFileName } from "@/lib/media";
import { getStorageAdapter, sanitizeKey } from "@/lib/storage";

const uploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(3).max(120),
  fileSize: z.number().int().min(1).max(MAX_UPLOAD_BYTES),
  isGzip: z.boolean().optional().default(false),
});

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "files:upload-request", 30);

  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");

  const { fileName, mimeType, fileSize, isGzip } = parseOrThrow(
    uploadRequestSchema,
    await req.json().catch(() => ({})),
  );

  const cleanName = sanitizeFileName(fileName || "file");
  const ext = cleanName.split(".").pop()?.toLowerCase() || "bin";
  const uniqueId = crypto.randomUUID();
  const rawStorageKey = sanitizeKey(
    `files/${profile.id}/${Date.now()}-${uniqueId}.${ext}${isGzip ? ".gz" : ""}`,
  );

  const adapter = await getStorageAdapter();
  const presigned = await adapter.getPresignedPutUrl(
    rawStorageKey,
    mimeType,
    600, // 10 minutes expiry
  );

  const encryptionKey = getFileEncryptionKey().toString("hex");

  return json({
    uploadUrl: presigned.url,
    method: presigned.method,
    rawStorageKey,
    expiresInSeconds: presigned.expiresInSeconds,
    headers: presigned.headers ?? {},
    storageProvider: storageDriver,
    encryptionKey,
  });
});
