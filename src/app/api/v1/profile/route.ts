// 🌐 GET /api/v1/profile — public REST API (Bearer lfk_... key se)
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { links } from "@/db/schema";
import { authenticateApiKey, v1CorsHeaders, v1Options } from "@/lib/api-key-auth";
import { json } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export const OPTIONS = () => v1Options();

export const GET = async (req: Request) => {
  const ctx = await authenticateApiKey(req);
  if (!ctx) {
    return json({ error: "Invalid or missing API key" }, { status: 401, headers: v1CorsHeaders() });
  }
  const rl = await rateLimit(`v1:${ctx.apiKey.prefix}`, 60);
  if (!rl.success) {
    return json({ error: "Rate limited" }, { status: 429, headers: v1CorsHeaders() });
  }
  const [linkCount] = await db
    .select({ count: count() })
    .from(links)
    .where(eq(links.profileId, ctx.profile.id));
  return json(
    {
      profile: {
        slug: ctx.profile.slug,
        displayName: ctx.profile.displayName,
        bio: ctx.profile.bio,
        avatarUrl: ctx.profile.avatarUrl,
        theme: ctx.profile.theme,
        layout: ctx.profile.layout,
        isPublished: ctx.profile.isPublished,
        linkCount: linkCount?.count ?? 0,
      },
    },
    { headers: v1CorsHeaders() },
  );
};
