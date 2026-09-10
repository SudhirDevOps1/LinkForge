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

function resolveStorageProvider(): StorageProvider {
  const envProvider = (
    process.env.STORAGE_DRIVER ??
    process.env.STORAGE_PROVIDER ??
    ""
  )
    .trim()
    .toLowerCase();

  if (["local", "b2", "r2", "s3", "minio", "vercel-blob"].includes(envProvider)) {
    return envProvider as StorageProvider;
  }

  // Auto-detection based on environment variables for seamless deployment
  if (
    process.env.B2_APPLICATION_KEY_ID ||
    process.env.B2_KEY_ID ||
    process.env.B2_BUCKET_NAME ||
    process.env.B2_BUCKET
  ) {
    return "b2";
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return "vercel-blob";
  }
  if (process.env.R2_ACCOUNT_ID || process.env.R2_BUCKET_NAME) {
    return "r2";
  }
  if (process.env.AWS_BUCKET_NAME || process.env.AWS_ACCESS_KEY_ID) {
    return "s3";
  }

  return "local";
}

export const storageProvider: StorageProvider = resolveStorageProvider();
export const storageDriver: StorageProvider = storageProvider;

export const B2_PRESIGN_PUT_EXPIRY_SEC = Number(process.env.B2_PRESIGN_PUT_EXPIRY_SEC ?? 600);
export const B2_PRESIGN_GET_EXPIRY_SEC = Number(process.env.B2_PRESIGN_GET_EXPIRY_SEC ?? 300);

/**
 * Returns allowed browser origins for Backblaze B2 direct upload CORS rules.
 * Automatically combines env configuration (B2_CORS_ALLOWED_ORIGINS / API_CORS_ORIGINS)
 * with deployment URLs.
 */
export function getCorsAllowedOrigins(): string[] {
  const envOrigins = (
    process.env.B2_CORS_ALLOWED_ORIGINS ??
    process.env.CORS_ALLOWED_ORIGINS ??
    process.env.ALLOWED_ORIGINS ??
    process.env.API_CORS_ORIGINS ??
    ""
  )
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const defaults = [
    "*",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  if (process.env.NEXT_PUBLIC_APP_URL) {
    defaults.push(process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, ""));
  }
  if (process.env.APP_DOMAIN) {
    defaults.push(`https://${process.env.APP_DOMAIN.trim().replace(/\/+$/, "")}`);
  }

  // Pre-configure domains requested by user
  defaults.push("https://linkforge-delta.vercel.app");
  defaults.push("https://inkorge-demo.vercel.app");
  defaults.push("https://linkforge-demo.vercel.app");

  const combined = Array.from(new Set([...defaults, ...envOrigins]));
  return combined;
}

/**
 * Generates the exact Backblaze B2 Console CORS JSON format for easy copy/paste.
 */
export function getB2CorsRulesJson(customOrigins?: string[]): string {
  const origins = customOrigins ?? getCorsAllowedOrigins();
  const b2Origins = origins.includes("*") ? ["*"] : origins;
  return JSON.stringify(
    [
      {
        corsRuleName: "AllowDirectUpload",
        allowedOrigins: b2Origins,
        allowedOperations: ["s3_put", "s3_head", "s3_get", "s3_delete"],
        allowedHeaders: ["*"],
        exposeHeaders: ["ETag"],
        maxAgeSeconds: 3600,
      },
    ],
    null,
    2,
  );
}

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

/** Max upload size in MB — env se override (default 50 MB) */
export const MAX_UPLOAD_MB = Number(
  process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ??
    process.env.MAX_UPLOAD_MB ??
    50,
);

/** Max upload size in bytes — env se override (default 50 MB). */
export const MAX_UPLOAD_BYTES = Number(
  process.env.MAX_UPLOAD_BYTES ?? MAX_UPLOAD_MB * 1024 * 1024,
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
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
  "audio/x-aac",
  "audio/flac",
  "audio/webm",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

/** Ek profile max kitni files rakh sakta hai (abuse protection) */
export const MAX_FILES_PER_PROFILE = 100;
