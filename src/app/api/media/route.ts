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
  if (!profile) throw new ApiError(404, "Profile not found");
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
  if (!profile) throw new ApiError(404, "Profile not found");

  const [agg] = await db
    .select({ count: count() })
    .from(mediaFiles)
    .where(eq(mediaFiles.profileId, profile.id));
  if ((agg?.count ?? 0) >= MAX_FILES_PER_PROFILE) {
    throw new ApiError(
      400,
      `Maximum ${MAX_FILES_PER_PROFILE} files allowed — please delete unused files`,
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "file field is required");

  if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(file.type)) {
    throw new ApiError(400, "File type not allowed (allowed: images, PDF, audio, video, docs, zip)");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(400, `File size must be under ${formatBytes(MAX_UPLOAD_BYTES)}`);
  }
  if (file.size === 0) throw new ApiError(400, "Cannot upload empty file");

  const safeName = sanitizeFileName(file.name || "file");
  const ext = safeName.includes(".") ? (safeName.split(".").pop() as string) : "bin";

  const storage = await getStorage();
  const rawData = Buffer.from(await file.arrayBuffer());

  // 🗜️ In-flight GZIP compression for compressible file types (PDF, text, docs, svg, json)
  // Reduces 10MB raw documents to 2-4MB before encryption and B2 upload
  let payloadBuffer = rawData;
  const isCompressible =
    file.type === "application/pdf" ||
    file.type.startsWith("text/") ||
    file.type.includes("json") ||
    file.type.includes("xml") ||
    file.type.includes("svg") ||
    ["pdf", "txt", "md", "json", "csv", "svg", "html", "doc", "docx", "xml"].includes(ext);

  if (isCompressible && rawData.length > 512) {
    try {
      const { gzipSync } = await import("node:zlib");
      const gzipped = gzipSync(rawData, { level: 9 });
      if (gzipped.length < rawData.length) {
        payloadBuffer = gzipped;
      }
    } catch {
      payloadBuffer = rawData;
    }
  }

  const data = encryptFilePayload(payloadBuffer);
  const { key, url } = await storage.upload(data, newKey(`files/${user.id}`, ext), file.type);

  const [created] = await db
    .insert(mediaFiles)
    .values({
      profileId: profile.id,
      fileName: encryptField(safeName),
      mimeType: file.type,
      sizeBytes: payloadBuffer.length,
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
