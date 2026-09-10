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
  if (!profile) throw new ApiError(404, "Profile not found");
  if (!isS3Compatible) {
    throw new ApiError(
      501,
      "Presigned uploads are only supported on S3-compatible providers (B2, R2, S3, MinIO)",
    );
  }

  const { fileName, mime, size } = parseOrThrow(
    presignSchema,
    await req.json().catch(() => ({})),
  );
  if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(mime)) {
    throw new ApiError(400, "File type not allowed");
  }
  if (!Number.isInteger(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
    throw new ApiError(400, "Invalid size");
  }
  const safeName = sanitizeFileName(fileName || "file");
  if (!extensionMatchesMime(safeName, mime)) {
    throw new ApiError(400, "Filename extension does not match MIME type");
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
    throw new ApiError(501, "Storage provider does not support presigned URLs");
  }

  // Best-effort auto-apply Backblaze B2 S3 CORS rules with s3_put for direct browser uploads
  if (storage.provider === "b2") {
    import("@/lib/storage").then(({ getStorageAdapter }) => {
      getStorageAdapter().then((adapter) => {
        if (typeof (adapter as unknown as { ensureCorsRules?: () => Promise<unknown> }).ensureCorsRules === "function") {
          void (adapter as unknown as { ensureCorsRules: () => Promise<unknown> }).ensureCorsRules().catch(() => {});
        }
      }).catch(() => {});
    }).catch(() => {});
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
