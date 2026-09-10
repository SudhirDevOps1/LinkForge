// 📤 GET /api/profile/export — profile + links JSON download
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { links } from "@/db/schema";
import { ApiError, guardRateLimit, handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const GET = handle(async (req: Request) => {
  await guardRateLimit(req, "profile:export", 10);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");

  const profileLinks = await db
    .select()
    .from(links)
    .where(eq(links.profileId, profile.id))
    .orderBy(asc(links.position));

  const payload = {
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    profile: {
      slug: profile.slug,
      displayName: profile.displayName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl ?? "",
      theme: profile.theme,
      layout: profile.layout,
      seoTitle: profile.seoTitle ?? "",
      seoDescription: profile.seoDescription ?? "",
      ogImageUrl: profile.ogImageUrl ?? "",
      analyticsEnabled: profile.analyticsEnabled,
      isPublished: profile.isPublished,
    },
    // Design block (forward-compat): import isko preference deta hai.
    // Full custom-design JSON column P1 me aayega (migration ke saath).
    design: {
      theme: profile.theme,
      layout: profile.layout,
    },
    links: profileLinks.map((l) => ({
      title: l.title,
      url: l.url,
      description: l.description,
      icon: l.icon,
      type: l.type,
      size: l.size,
      position: l.position,
      isActive: l.isActive,
      thumbnailUrl: l.thumbnailUrl ?? "",
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="linkforge-${profile.slug}.json"`,
    },
  });
});
