// 🎟️ POST /api/media/presign — S3 direct-upload ticket (general files)
// Browser: ticket lo → storage par PUT → POST /api/media/complete.
// Local/vercel-blob providers par 501 (multipart POST /api/media fallback).
// Ticket single-use, 60s TTL, owner-bound.
import { count, eq } from "drizzle-orm";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_FILES_PER_PROFILE,
  MAX_UPLOAD_BYTES,
  isS3Compatible,
} from "@/config/storage.config";
import { db } from "@/db";
import { mediaFiles, uploadTickets } from "@/db/schema";
import {
  ApiError,
  assertSameOrigin,
  guardRateLimit,
  handle,
  json,
  parseOrThrow,
} from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { sanitizeFileName } from "@/lib/media";
import { getStorage, newKey } from "@/lib/storage";
import { extensionMatchesMime, TICKET_TTL_MS } from "@/lib/upload-validation";
import { presignSchema } from "@/lib/validations";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "media:presign", 20);
  const { user, profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");
  if (!isS3Compatible) {
    throw new ApiError(
      501,
      "Presigned uploads sirf S3-compatible providers (b2/r2/s3/minio) par — multipart upload use karein",
    );
  }

  const { fileName, mime, size } = parseOrThrow(
    presignSchema,
    await req.json().catch(() => ({})),
  );
  if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(mime)) {
    throw new ApiError(400, "Yeh file type allowed nahi");
  }
  if (!Number.isInteger(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
    throw new ApiError(400, "Invalid size");
  }
  const safeName = sanitizeFileName(fileName || "file");
  if (!extensionMatchesMime(safeName, mime)) {
    throw new ApiError(400, "Filename extension MIME se match nahi karti");
  }

  const [agg] = await db
    .select({ count: count() })
    .from(mediaFiles)
    .where(eq(mediaFiles.profileId, profile.id));
  if ((agg?.count ?? 0) >= MAX_FILES_PER_PROFILE) {
    throw new ApiError(400, `Max ${MAX_FILES_PER_PROFILE} files allowed`);
  }

  const storage = await getStorage();
  if (!storage.getPresignedUploadUrl) {
    throw new ApiError(501, "Provider presign support nahi karta");
  }
  const ext = safeName.split(".").pop() ?? "bin";
  const key = newKey(`files/${user.id}`, ext);
  const [ticket] = await db
    .insert(uploadTickets)
    .values({
      id: crypto.randomUUID(),
      profileId: profile.id,
      provider: storage.provider,
      storageKey: key,
      expectedMime: mime,
      expectedSize: size,
      fileName: safeName,
      expiresAt: new Date(Date.now() + TICKET_TTL_MS),
    })
    .returning({ id: uploadTickets.id });

  const signed = await storage.getPresignedUploadUrl(key, mime);
  return json(
    {
      ticketId: ticket?.id,
      url: signed.url,
      key: signed.key,
      publicUrl: signed.publicUrl,
      expiresAt: new Date(Date.now() + TICKET_TTL_MS).toISOString(),
    },
    { status: 201 },
  );
});
