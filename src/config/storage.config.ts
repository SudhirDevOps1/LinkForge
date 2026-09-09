// =============================================================================
// 📦 Storage Provider Configuration (स्टोरेज प्रोवाइडर कॉन्फ़िग)
// -----------------------------------------------------------------------------
// `STORAGE_PROVIDER` env var ke basis par file storage select hota hai:
//   local       → Self-hosted disk (default, zero-config, Docker-friendly)
//   b2          → Backblaze B2 (S3-compatible, 10 GB free)
//   r2          → Cloudflare R2 (S3-compatible, zero egress fees)
//   s3          → AWS S3
//   minio       → MinIO (self-hosted S3)
//   vercel-blob → Vercel Blob storage
// =============================================================================

export type StorageProvider =
  | "local"
  | "b2"
  | "r2"
  | "s3"
  | "minio"
  | "vercel-blob";

const envProvider = (process.env.STORAGE_PROVIDER ?? "local")
  .trim()
  .toLowerCase();

export const storageProvider: StorageProvider = (
  ["local", "b2", "r2", "s3", "minio", "vercel-blob"].includes(envProvider)
    ? envProvider
    : "local"
) as StorageProvider;

/** S3-compatible providers — sab ek hi AWS SDK factory share karte hain */
export const isS3Compatible = ["b2", "r2", "s3", "minio"].includes(
  storageProvider,
);

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

// ---- Generic file uploads (Media Library) --------------------------------------
// Koi bhi file (PDF, docs, audio, video, zip) configured storage provider
// (local / B2 / R2 / S3 / MinIO / Vercel Blob) par jati hai.

/** Max upload size — env se override (bytes). Default 10 MB. */
export const MAX_UPLOAD_BYTES = Number(
  process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024,
);

/**
 * Whitelisted MIME types — executables, scripts aur SVG (XSS vector) kabhi
 * allow nahi. Server har upload par dobara verify karta hai.
 */
export const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
  "audio/webm",
  "video/mp4",
  "video/webm",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

/** Ek profile max kitni files rakh sakta hai (abuse protection) */
export const MAX_FILES_PER_PROFILE = 100;
