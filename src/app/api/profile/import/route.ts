// 📥 POST /api/profile/import — JSON se profile + links restore (validated)
// Default `?mode=merge`: manual links preserve + duplicate URLs skip
// (idempotent re-import). Sirf `?mode=replace` par purana delete+insert.
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { links, profiles } from "@/db/schema";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { splitNewLinks } from "@/lib/import-merge";import { importSchema } from "@/lib/validations";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "profile:import", 10);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");

  const payload = parseOrThrow(importSchema, await req.json().catch(() => ({})));
  const mode = new URL(req.url).searchParams.get("mode") === "replace" ? "replace" : "merge";

  // Design block (theme/layout) — top-level `design` ko preference do,
  // warna legacy `profile.theme/layout` fields use karo.
  const designTheme = payload.design?.theme ?? payload.profile.theme;
  const designLayout = payload.design?.layout ?? payload.profile.layout;

  // Profile fields update (slug ko chhod kar — collision se bachne ke liye
  // sirf tab update karo jab explicitly different na ho)
  const { slug: _ignoredSlug, ...profilePatch } = payload.profile;
  void _ignoredSlug;
  await db
    .update(profiles)
    .set({
      ...(profilePatch.displayName ? { displayName: profilePatch.displayName } : {}),
      ...(profilePatch.bio !== undefined ? { bio: profilePatch.bio } : {}),
      ...(profilePatch.avatarUrl !== undefined
        ? { avatarUrl: profilePatch.avatarUrl || null }
        : {}),
      ...(designTheme ? { theme: designTheme } : {}),
      ...(designLayout ? { layout: designLayout } : {}),
      ...(profilePatch.analyticsEnabled !== undefined
        ? { analyticsEnabled: profilePatch.analyticsEnabled }
        : {}),
      ...(profilePatch.isPublished !== undefined
        ? { isPublished: profilePatch.isPublished }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profile.id));

  const toRow = (l: (typeof payload.links)[number], i: number, positionBase: number) => ({
    id: crypto.randomUUID(),
    profileId: profile.id,
    title: l.title,
    url: l.url,
    description: l.description ?? "",
    icon: l.icon ?? "link",
    type: l.type ?? "link",
    size: l.size ?? "standard",
    position: l.position ?? positionBase + i,
    isActive: l.isActive ?? true,
    thumbnailUrl: l.thumbnailUrl || null,
  });

  if (mode === "replace") {
    // Links replace: purane delete → naye insert (positions preserve)
    await db.delete(links).where(eq(links.profileId, profile.id));
    const inserted =
      payload.links.length > 0
        ? await db
            .insert(links)
            .values(payload.links.map((l, i) => toRow(l, i, 0)))
            .returning({ id: links.id })
        : [];
    return json({ ok: true, mode, linksImported: inserted.length, linksSkipped: 0 });
  }

  // Merge (default): existing URLs nikalo, sirf fresh links insert karo
  const existing = await db
    .select({ url: links.url, position: links.position })
    .from(links)
    .where(eq(links.profileId, profile.id))
    .orderBy(asc(links.position));
  const base = existing.length > 0 ? Math.max(...existing.map((r) => r.position)) + 1 : 0;
  const { fresh, skipped } = splitNewLinks(
    existing.map((r) => r.url),
    payload.links,
  );
  const inserted =
    fresh.length > 0
      ? await db
          .insert(links)
          .values(fresh.map((l, i) => toRow(l, i, base)))
          .returning({ id: links.id })
      : [];

  return json({ ok: true, mode, linksImported: inserted.length, linksSkipped: skipped });
});
