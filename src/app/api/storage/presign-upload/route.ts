// =============================================================================
// 🎟️ POST /api/storage/presign-upload — Direct Browser Upload Presigning
// Authenticated route that issues short-lived presigned PUT URLs for direct
// upload to private Backblaze B2 (bypassing Vercel 4.5MB serverless limits).
// =============================================================================
import crypto from "crypto";
import {
  ALLOWED_UPLOAD_TYPES,
  B2_PRESIGN_PUT_EXPIRY_SEC,
  MAX_UPLOAD_BYTES,
} from "@/config/storage.config";
import {
  ApiError,
  assertSameOrigin,
  guardRateLimit,
  handle,
  json,
} from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { sanitizeFileName } from "@/lib/media";
import { getStorageAdapter } from "@/lib/storage";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "storage:presign-upload", 30);

  const { user } = await requireUser();
  if (!user) throw new ApiError(401, "Unauthorized");

  const body = (await req.json().catch(() => ({}))) as {
    filename?: string;
    contentType?: string;
    sizeBytes?: number;
  };

  const filename = sanitizeFileName(body.filename || "upload");
  const contentType = (body.contentType || "").trim().toLowerCase();
  const sizeBytes = Number(body.sizeBytes);

  if (!contentType || !(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(contentType)) {
    throw new ApiError(
      400,
      `Invalid content type "${contentType}". Images, docs, audio, video, and zip files are allowed.`,
    );
  }

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new ApiError(400, "sizeBytes must be a positive number");
  }

  if (sizeBytes > MAX_UPLOAD_BYTES) {
    throw new ApiError(
      400,
      `File size exceeds limit (${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB max)`,
    );
  }

  const uniqueId = crypto.randomUUID();
  const storageKey = `uploads/${user.id}/${uniqueId}-${filename}`;

  const adapter = await getStorageAdapter();
  const presigned = await adapter.getPresignedPutUrl(
    storageKey,
    contentType,
    B2_PRESIGN_PUT_EXPIRY_SEC,
  );

  return json(
    {
      uploadUrl: presigned.url,
      storageKey,
      expiresInSeconds: presigned.expiresInSeconds,
      method: presigned.method,
      driver: adapter.driver,
    },
    { status: 201 },
  );
});
