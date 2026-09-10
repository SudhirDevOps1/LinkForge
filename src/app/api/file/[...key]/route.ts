// 📁 GET /api/file/[...key] — private-bucket proxy (B2 free tier)
// Public B2 bucket 403 dega private files par — isliye app server credentials
// se laakar stream karta hai. Upload/complete flows `storage.getUrl()` se yehi
// URL banate hain (koi code change unme nahi). Edge cache (immutable) lagao
// taaki B2 transactions/egress bachein.
import { sanitizeKey } from "@/lib/storage";
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
  // Seamlessly forward to the unified cached and decrypted storage streaming route
  const targetUrl = new URL(`/api/storage/file/${safe}`, req.url);
  return Response.redirect(targetUrl.toString(), 307);
});
