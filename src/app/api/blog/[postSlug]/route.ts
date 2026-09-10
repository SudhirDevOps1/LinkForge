// 📝 /api/blog/[postSlug] — Fetch single post from B2 Object Storage
import { ApiError, handle, json } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getBlogPost } from "@/lib/blog";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const GET = handle(async (req: Request, context: { params: Promise<{ postSlug: string }> }) => {
  const { postSlug } = await context.params;
  const url = new URL(req.url);
  const profileIdParam = url.searchParams.get("profileId");
  const profileSlugParam = url.searchParams.get("userSlug");

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

  return json({ ok: true, post });
});
