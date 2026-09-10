// 📁 GET /api/file/[...key] — private-bucket proxy (B2 free tier)
// Public B2 bucket 403 dega private files par — isliye app server credentials
// se laakar stream karta hai. Upload/complete flows `storage.getUrl()` se yehi
// URL banate hain (koi code change unme nahi). Edge cache (immutable) lagao
// taaki B2 transactions/egress bachein.
import { getStorage, sanitizeKey } from "@/lib/storage";
import { guardRateLimit, handle } from "@/lib/api";

type Ctx = { params: Promise<{ key: string[] }> };

const ALLOWED_PREFIXES = ["files/", "avatars/", "thumbs/", "uploads/"];

export const GET = handle(async (req: Request, ctx: Ctx) => {
  // Hotlink abuse guard (public route hai)
  await guardRateLimit(req, "file:proxy", 120);
  const { key } = await ctx.params;
  const joined = (key ?? []).join("/");
  let safe: string;
  try {
    safe = sanitizeKey(joined);
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (!ALLOWED_PREFIXES.some((p) => safe.startsWith(p))) {
    return new Response("Forbidden", { status: 403 });
  }
  const storage = await getStorage();
  if (!storage.stream) {
    return new Response("Not available on this provider", { status: 501 });
  }
  const range = req.headers.get("range") ?? undefined;
  try {
    const out = await storage.stream(safe, range);
    const fileName = safe.split("/").pop() ?? "file";
    const headers: Record<string, string> = {
      "Content-Type": out.contentType ?? "application/octet-stream",
      // Edge cache: immutable content (keys me timestamp hai) — B2 cost bachta hai
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
      "Content-Disposition": `inline; filename="${fileName.replace(/"/g, "")}"`,
    };
    if (out.contentRange) {
      headers["Content-Range"] = out.contentRange;
    }
    if (out.sizeBytes != null) {
      headers["Content-Length"] = String(out.sizeBytes);
    }
    return new Response(out.body, {
      status: out.contentRange ? 206 : 200,
      headers,
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
});
