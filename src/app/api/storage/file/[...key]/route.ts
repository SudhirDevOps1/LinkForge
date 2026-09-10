// =============================================================================
// 🔒 /api/storage/file/[...key] — Authenticated Server Proxy / Streaming Route
// Streams private B2 objects safely without exposing storage credentials.
// Supports local PUT direct upload during local testing/development.
// =============================================================================
import { ApiError, guardRateLimit, handle, json } from "@/lib/api";
import { decryptFilePayload, encryptFilePayload, isPayloadEncrypted } from "@/lib/file-cipher";
import { getStorageAdapter, sanitizeKey } from "@/lib/storage";

type RouteCtx = { params: Promise<{ key: string[] }> };

// Fast in-memory cache for hot files (images, avatars, thumbnails) to prevent repeated B2 downloads
interface CachedFile {
  data: Buffer;
  contentType: string;
  contentEncoding?: string;
  expiresAt: number;
}
const MEMORY_CACHE = new Map<string, CachedFile>();
const MAX_CACHEABLE_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Hour

export const GET = handle(async (req: Request, ctx: RouteCtx) => {
  await guardRateLimit(req, "storage:download", 120);

  const { key } = await ctx.params;
  const rawKey = (key ?? []).join("/");
  let safeKey: string;
  try {
    safeKey = sanitizeKey(rawKey);
  } catch {
    throw new ApiError(400, "Invalid storage key");
  }

  const ifNoneMatch = req.headers.get("if-none-match");
  const etag = `"${Buffer.from(safeKey).toString("base64").slice(0, 27)}"`;

  // 🚀 1. Browser 304 Not Modified: ZERO bytes sent from server or B2!
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        "ETag": etag,
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable",
      },
    });
  }

  // 🚀 2. Server In-Memory Cache: ZERO B2 download calls & pre-decrypted!
  let file: { data: Buffer; contentType: string; contentEncoding?: string } | null = null;
  const cached = MEMORY_CACHE.get(safeKey);
  if (cached && cached.expiresAt > Date.now()) {
    file = cached;
  } else {
    const adapter = await getStorageAdapter();
    const fetched = await adapter.getObject(safeKey);
    if (fetched) {
      // 🔐 Zero-Knowledge Decryption: Decrypt B2 ciphertext if encrypted
      let data = fetched.data;
      if (isPayloadEncrypted(data)) {
        data = decryptFilePayload(data);
      }
      file = {
        data,
        contentType: fetched.contentType,
        contentEncoding: fetched.contentEncoding || (safeKey.endsWith(".gz") ? "gzip" : undefined),
      };
      if (file.data.length <= MAX_CACHEABLE_FILE_SIZE) {
        MEMORY_CACHE.set(safeKey, {
          ...file,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
      }
    }
  }

  if (!file) {
    return json({ error: "File not found" }, { status: 404 });
  }

  const urlObj = new URL(req.url);
  const isDownload = urlObj.searchParams.get("download") === "1";
  const customName = urlObj.searchParams.get("name");

  const filename = safeKey.split("/").pop() ?? "file";
  const rawName = customName || filename;
  const cleanFilename = rawName.replace(/["\r\n]/g, "").replace(/\.gz$/i, "");
  const disposition = isDownload
    ? `attachment; filename="${cleanFilename}"`
    : `inline; filename="${cleanFilename}"`;

  // 🚀 3. Vercel Edge CDN Caching (s-maxage=31536000):
  const headers: Record<string, string> = {
    "Content-Type": file.contentType || "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable",
    "ETag": etag,
    "Content-Disposition": disposition,
    "Content-Length": String(file.data.length),
    "X-Content-Type-Options": "nosniff",
  };
  if (file.contentEncoding) {
    headers["Content-Encoding"] = file.contentEncoding;
  }

  return new Response(new Uint8Array(file.data), {
    status: 200,
    headers,
  });
});

export const PUT = handle(async (req: Request, ctx: RouteCtx) => {
  const { key } = await ctx.params;
  const rawKey = (key ?? []).join("/");
  const safeKey = sanitizeKey(rawKey);

  const contentType = req.headers.get("content-type") || "application/octet-stream";
  const contentEncoding = req.headers.get("content-encoding") ?? undefined;
  const arrayBuf = await req.arrayBuffer();
  const rawBuf = Buffer.from(arrayBuf);
  const buf: Buffer = isPayloadEncrypted(rawBuf) ? rawBuf : encryptFilePayload(rawBuf);

  const adapter = await getStorageAdapter();
  await adapter.putObject(safeKey, buf, contentType, { contentEncoding });

  return json({ success: true, key: safeKey });
});
