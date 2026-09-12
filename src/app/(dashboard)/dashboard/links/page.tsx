// 🔗 Dashboard — Links editor page (server data → client editor)
import { and, asc, count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { LinksEditor } from "@/components/links-editor";
import { db } from "@/db";
import { events, links } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/login");
  const { profile } = ctx;
  if (!profile) redirect("/dashboard/settings");

  const profileLinks = await db
    .select()
    .from(links)
    .where(eq(links.profileId, profile.id))
    .orderBy(asc(links.position));

  // Query clicks count per link
  const clicksMap = new Map<string, number>();
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
    // Graceful fallback
  }

  const enrichedLinks = profileLinks.map((l) => ({
    ...l,
    clicks: clicksMap.get(l.id) ?? 0,
  }));

  return (
    <LinksEditor
      profile={{
        displayName: profile.displayName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        theme: profile.theme,
        layout: profile.layout,
      }}
      initialLinks={enrichedLinks}
    />
  );
}
