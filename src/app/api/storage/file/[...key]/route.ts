// =============================================================================
// 🔒 /api/storage/file/[...key] — Authenticated Server Proxy / Streaming Route
// Streams private B2 objects safely without exposing storage credentials.
// Supports local PUT direct upload during local testing/development.
// =============================================================================
import { ApiError, guardRateLimit, handle, json } from "@/lib/api";
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

  // 🚀 2. Server In-Memory Cache: ZERO B2 download calls!
  let file: { data: Buffer; contentType: string; contentEncoding?: string } | null = null;
  const cached = MEMORY_CACHE.get(safeKey);
  if (cached && cached.expiresAt > Date.now()) {
    file = cached;
  } else {
    const adapter = await getStorageAdapter();
    file = await adapter.getObject(safeKey);
    if (file && file.data.length <= MAX_CACHEABLE_FILE_SIZE) {
      MEMORY_CACHE.set(safeKey, {
        ...file,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
    }
  }

  if (!file) {
    return json({ error: "File not found" }, { status: 404 });
  }

  const filename = safeKey.split("/").pop() ?? "file";
  const cleanFilename = filename.replace(/["\r\n]/g, "");

  // 🚀 3. Vercel Edge CDN Caching (s-maxage=31536000):
  // Vercel's global CDN caches the response at the edge! Works on *.vercel.app without custom domain!
  const headers: Record<string, string> = {
    "Content-Type": file.contentType || "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable",
    "ETag": etag,
    "Content-Disposition": `inline; filename="${cleanFilename}"`,
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
  const buf = Buffer.from(arrayBuf);

  const adapter = await getStorageAdapter();
  await adapter.putObject(safeKey, buf, contentType, { contentEncoding });

  return json({ success: true, key: safeKey });
});
