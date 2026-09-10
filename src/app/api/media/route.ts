// 📁 /api/media — GET (list) / POST (multipart upload → storage provider)
// Koi bhi file (PDF, images, audio, video, docs, zip) configured storage
// provider (local / B2 / R2 / S3 / MinIO / Vercel Blob) par jati hai.
import { count, desc, eq } from "drizzle-orm";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_FILES_PER_PROFILE,
  MAX_UPLOAD_BYTES,
} from "@/config/storage.config";
import { db } from "@/db";
import { mediaFiles } from "@/db/schema";
import {
  ApiError,
  assertSameOrigin,
  guardRateLimit,
  handle,
  json,
} from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { fileCategory, formatBytes, sanitizeFileName } from "@/lib/media";
import { getStorage, newKey } from "@/lib/storage";

import { decryptField, encryptField } from "@/lib/db-cipher";
import { encryptFilePayload } from "@/lib/file-cipher";

export const GET = handle(async () => {
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");
  const rows = await db
    .select()
    .from(mediaFiles)
    .where(eq(mediaFiles.profileId, profile.id))
    .orderBy(desc(mediaFiles.createdAt))
    .limit(200);

  const decryptedRows = rows.map((r) => {
    const decKey = decryptField(r.storageKey);
    return {
      ...r,
      fileName: decryptField(r.fileName),
      storageKey: decKey,
      url: r.url.startsWith("http") ? r.url : `/api/storage/file/${decKey}`,
    };
  });

  const totalBytes = decryptedRows.reduce((sum, r) => sum + (r.sizeBytes ?? 0), 0);
  return json({ files: decryptedRows, totalBytes, totalLabel: formatBytes(totalBytes) });
});

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "media:upload", 20);
  const { user, profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");

  const [agg] = await db
    .select({ count: count() })
    .from(mediaFiles)
    .where(eq(mediaFiles.profileId, profile.id));
  if ((agg?.count ?? 0) >= MAX_FILES_PER_PROFILE) {
    throw new ApiError(
      400,
      `Max ${MAX_FILES_PER_PROFILE} files allowed — purani files delete karein`,
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "file field zaroori hai");

  if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(file.type)) {
    throw new ApiError(400, "Yeh file type allowed nahi (images, PDF, audio, video, docs, zip)");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(400, `File ${formatBytes(MAX_UPLOAD_BYTES)} se chhoti honi chahiye`);
  }
  if (file.size === 0) throw new ApiError(400, "Empty file upload nahi ho sakti");

  const safeName = sanitizeFileName(file.name || "file");
  const ext = safeName.includes(".") ? (safeName.split(".").pop() as string) : "bin";

  const storage = await getStorage();
  const rawData = Buffer.from(await file.arrayBuffer());
  const data = encryptFilePayload(rawData);
  const { key, url } = await storage.upload(data, newKey(`files/${user.id}`, ext), file.type);

  const [created] = await db
    .insert(mediaFiles)
    .values({
      profileId: profile.id,
      fileName: encryptField(safeName),
      mimeType: file.type,
      sizeBytes: file.size,
      storageProvider: storage.provider,
      storageKey: encryptField(key),
      url,
    })
    .returning();

  return json({
    file: {
      ...created,
      fileName: safeName,
      storageKey: key,
    },
    category: fileCategory(file.type),
  }, { status: 201 });
});
