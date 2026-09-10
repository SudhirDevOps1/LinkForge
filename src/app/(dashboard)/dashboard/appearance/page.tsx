import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AppearanceEditor } from "@/components/appearance-editor";
import { db } from "@/db";
import { links } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { parseDesign } from "@/lib/design";

export const dynamic = "force-dynamic";

export default async function AppearancePage() {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/login");
  const { profile } = ctx;
  if (!profile) redirect("/dashboard/settings");

  const profileLinks = await db
    .select()
    .from(links)
    .where(eq(links.profileId, profile.id))
    .orderBy(asc(links.position));

  return (
    <div className="space-y-8">
      <AppearanceEditor
        profile={{
          displayName: profile.displayName,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          theme: profile.theme,
          layout: profile.layout,
          slug: profile.slug,
          design: parseDesign(profile.design),
          hidePublicStats: profile.hidePublicStats ?? false,
        }}
        links={profileLinks}
      />
    </div>
  );
}

