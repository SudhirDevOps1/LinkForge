// 🌐 /api/v1/links — third-party REST API
// GET: active links list | POST: naya link create (Bearer lfk_... key se)
import { asc, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { links } from "@/db/schema";
import { authenticateApiKey, v1CorsHeaders, v1Options } from "@/lib/api-key-auth";
import { json, parseOrThrow } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { linkCreateSchema } from "@/lib/validations";

export const OPTIONS = () => v1Options();

async function guard(req: Request) {
  const ctx = await authenticateApiKey(req);
  if (!ctx) return { error: json({ error: "Invalid or missing API key" }, { status: 401, headers: v1CorsHeaders() }) };
  const rl = await rateLimit(`v1:${ctx.apiKey.prefix}`, 60);
  if (!rl.success) return { error: json({ error: "Rate limited" }, { status: 429, headers: v1CorsHeaders() }) };
  return { ctx };
}

export const GET = async (req: Request) => {
  const { ctx, error } = await guard(req);
  if (error) return error;
  const rows = await db
    .select()
    .from(links)
    .where(eq(links.profileId, ctx.profile.id))
    .orderBy(asc(links.position));
  return json(
    {
      links: rows.map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        description: l.description,
        type: l.type,
        size: l.size,
        position: l.position,
        isActive: l.isActive,
      })),
    },
    { headers: v1CorsHeaders() },
  );
};

export const POST = async (req: Request) => {
  const { ctx, error } = await guard(req);
  if (error) return error;
  let input;
  try {
    input = parseOrThrow(linkCreateSchema, await req.json().catch(() => ({})));
  } catch {
    return json({ error: "Invalid link payload" }, { status: 400, headers: v1CorsHeaders() });
  }
  const [agg] = await db
    .select({ max: max(links.position) })
    .from(links)
    .where(eq(links.profileId, ctx.profile.id));
  const [created] = await db
    .insert(links)
    .values({
      id: crypto.randomUUID(),
      profileId: ctx.profile.id,
      title: input.title,
      url: input.url,
      description: input.description ?? "",
      icon: input.icon ?? "link",
      type: input.type ?? "link",
      size: input.size ?? "standard",
      position: (agg?.max ?? -1) + 1,
    })
    .returning();
  return json({ link: created }, { status: 201, headers: v1CorsHeaders() });
};
