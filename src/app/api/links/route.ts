// 🔗 /api/links — profile ke links: GET (list) / POST (create)
import { and, asc, count, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { events, links } from "@/db/schema";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { linkCreateSchema } from "@/lib/validations";

export const GET = handle(async () => {
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");

  const rows = await db
    .select()
    .from(links)
    .where(eq(links.profileId, profile.id))
    .orderBy(asc(links.position));

  // Query clicks count per link
  let clicksMap = new Map<string, number>();
  try {
    const clickCounts = await db
      .select({
        linkId: events.linkId,
        clicks: count(),
      })
      .from(events)
      .where(and(eq(events.profileId, profile.id), eq(events.type, "click")))
      .groupBy(events.linkId);

    for (const c of clickCounts) {
      if (c.linkId) clicksMap.set(c.linkId, Number(c.clicks));
    }
  } catch {
    // Graceful fallback if events table is empty or indexing
  }

  const enrichedLinks = rows.map((l) => ({
    ...l,
    clicks: clicksMap.get(l.id) ?? 0,
  }));

  return json({ links: enrichedLinks });
});

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "links:create", 60);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");
  const input = parseOrThrow(linkCreateSchema, await req.json().catch(() => ({})));

  // Naya link sabse neeche (max position + 1)
  const [agg] = await db
    .select({ max: max(links.position) })
    .from(links)
    .where(eq(links.profileId, profile.id));
  const position = (agg?.max ?? -1) + 1;

  const [created] = await db
    .insert(links)
    .values({
      id: crypto.randomUUID(),
      profileId: profile.id,
      title: input.title,
      url: input.url,
      description: input.description ?? "",
      icon: input.icon ?? "link",
      type: input.type ?? "link",
      size: input.size ?? "standard",
      position,
      thumbnailUrl: input.thumbnailUrl || null,
      isPinned: input.isPinned ?? false,
      badge: input.badge || null,
      isSpotlight: input.isSpotlight ?? false,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning();
  return json({ link: created }, { status: 201 });
});
