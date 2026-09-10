// 📝 /api/blog — B2 Object Storage Daily Blog API
import { z } from "zod";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { getSessionUser, requireUser } from "@/lib/auth";
import { deleteBlogPost, getBlogManifest, saveBlogPost } from "@/lib/blog";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

const postSchema = z.object({
  title: z.string().trim().min(2).max(200),
  content: z.string().trim().min(5),
  slug: z.string().trim().max(100).optional(),
  excerpt: z.string().trim().max(500).optional(),
  tags: z.array(z.string().trim().max(40)).max(10).optional().default([]),
  format: z.enum(["markdown", "html", "txt"]).optional().default("markdown"),
  coverImage: z.string().trim().url().optional().or(z.literal("")),
});

// GET /api/blog?profileId=... or ?slug=...
export const GET = handle(async (req: Request) => {
  const url = new URL(req.url);
  const profileIdParam = url.searchParams.get("profileId");
  const slugParam = url.searchParams.get("slug");

  let targetProfileId = profileIdParam;

  if (!targetProfileId && slugParam) {
    const prof = await db.query.profiles.findFirst({
      where: eq(profiles.slug, slugParam),
      columns: { id: true },
    });
    if (prof) targetProfileId = prof.id;
  }

  if (!targetProfileId) {
    const ctx = await getSessionUser();
    if (ctx?.profile) targetProfileId = ctx.profile.id;
  }

  if (!targetProfileId) {
    throw new ApiError(400, "profileId ya slug parameter zaroori hai");
  }

  const manifest = await getBlogManifest(targetProfileId);
  return json({ ok: true, manifest });
});

// POST /api/blog — publish or update daily blog to B2 storage
export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "blog:post", 20);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");

  const body = parseOrThrow(postSchema, await req.json().catch(() => ({})));

  const header = await saveBlogPost(profile.id, {
    title: body.title,
    content: body.content,
    slug: body.slug,
    excerpt: body.excerpt,
    tags: body.tags,
    format: body.format,
    coverImage: body.coverImage || undefined,
  });

  return json({ ok: true, post: header });
});

// DELETE /api/blog?slug=...
export const DELETE = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "blog:delete", 20);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) throw new ApiError(400, "slug parameter zaroori hai");

  const ok = await deleteBlogPost(profile.id, slug);
  return json({ ok });
});
