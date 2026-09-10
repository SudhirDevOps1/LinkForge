// 📝 /api/blog/[postSlug] — Fetch single post from Object Storage
import { ApiError, handle, json } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getBlogPost } from "@/lib/blog";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = handle(async (req: Request, context: { params: Promise<{ postSlug: string }> }) => {
  const { postSlug } = await context.params;
  const url = new URL(req.url);
  const profileIdParam = url.searchParams.get("profileId")?.trim();
  const rawUserSlug = url.searchParams.get("userSlug")?.trim();
  const profileSlugParam = rawUserSlug ? rawUserSlug.toLowerCase() : null;

  let targetProfileId = profileIdParam;

  if (!targetProfileId && profileSlugParam) {
    const prof = await db.query.profiles.findFirst({
      where: eq(profiles.slug, profileSlugParam),
      columns: { id: true },
    });
    if (prof) targetProfileId = prof.id;
  }

  if (!targetProfileId) {
    const ctx = await getSessionUser();
    if (ctx?.profile) targetProfileId = ctx.profile.id;
  }

  if (!targetProfileId) {
    throw new ApiError(400, "profileId or userSlug parameter is required");
  }

  const post = await getBlogPost(targetProfileId, postSlug);
  if (!post) {
    throw new ApiError(404, "Blog post not found");
  }

  return new Response(JSON.stringify({ ok: true, post }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
});
