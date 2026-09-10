// =============================================================================
// 🔒 /api/storage/file/[...key] — Authenticated Server Proxy / Streaming Route
// Streams private B2 objects safely without exposing storage credentials.
// Supports local PUT direct upload during local testing/development.
// =============================================================================
import { ApiError, guardRateLimit, handle, json } from "@/lib/api";
import { getStorageAdapter, sanitizeKey } from "@/lib/storage";

type RouteCtx = { params: Promise<{ key: string[] }> };

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

  const adapter = await getStorageAdapter();
  const file = await adapter.getObject(safeKey);

  if (!file) {
    return json({ error: "File not found" }, { status: 404 });
  }

  const filename = safeKey.split("/").pop() ?? "file";
  const cleanFilename = filename.replace(/["\r\n]/g, "");

  const headers: Record<string, string> = {
    "Content-Type": file.contentType || "application/octet-stream",
    "Cache-Control": "private, max-age=3600",
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
