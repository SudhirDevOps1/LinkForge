// =============================================================================
// 🔍 Shared bio-page queries — public page aur custom-domain page dono use
// =============================================================================
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { links, profiles, type Link, type Profile } from "@/db/schema";

export interface BioBundle {
  profile: Profile;
  links: Link[];
}

export async function getBioBySlug(slug: string): Promise<BioBundle | null> {
  try {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.slug, slug.toLowerCase().trim()))
      .limit(1);
    if (!profile) return null;
    const profileLinks = await db
      .select()
      .from(links)
      .where(eq(links.profileId, profile.id))
      .orderBy(asc(links.position));
    return { profile, links: profileLinks };
  } catch (err: unknown) {
    const msg = ((err as Error)?.message || "").toLowerCase();
    if (msg.includes("does not exist") || msg.includes("column") || msg.includes("relation") || msg.includes("no such column")) {
      try {
        const { autoMigrate } = await import("@/db/auto-migrate");
        await autoMigrate(true);
        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.slug, slug.toLowerCase().trim()))
          .limit(1);
        if (!profile) return null;
        const profileLinks = await db
          .select()
          .from(links)
          .where(eq(links.profileId, profile.id))
          .orderBy(asc(links.position));
        return { profile, links: profileLinks };
      } catch (retryErr) {
        console.warn("[queries] auto-heal retry failed:", (retryErr as Error).message);
      }
    }
    throw err;
  }
}

export async function getBioByDomain(domain: string): Promise<BioBundle | null> {
  try {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.customDomain, domain.toLowerCase().trim()))
      .limit(1);
    if (!profile) return null;
    const profileLinks = await db
      .select()
      .from(links)
      .where(eq(links.profileId, profile.id))
      .orderBy(asc(links.position));
    return { profile, links: profileLinks };
  } catch (err: unknown) {
    const msg = ((err as Error)?.message || "").toLowerCase();
    if (msg.includes("does not exist") || msg.includes("column") || msg.includes("relation") || msg.includes("no such column")) {
      try {
        const { autoMigrate } = await import("@/db/auto-migrate");
        await autoMigrate(true);
        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.customDomain, domain.toLowerCase().trim()))
          .limit(1);
        if (!profile) return null;
        const profileLinks = await db
          .select()
          .from(links)
          .where(eq(links.profileId, profile.id))
          .orderBy(asc(links.position));
        return { profile, links: profileLinks };
      } catch (retryErr) {
        console.warn("[queries] auto-heal retry failed:", (retryErr as Error).message);
      }
    }
    throw err;
  }
}
