// 🎨 Dashboard — Appearance (themes + layout + customization)
import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AppearanceEditor } from "@/components/appearance-editor";
import { BrandCustomization } from "@/components/customization";
import { db } from "@/db";
import { links } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

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
      <BrandCustomization />
      <AppearanceEditor
        profile={{
          displayName: profile.displayName,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          theme: profile.theme,
          layout: profile.layout,
        }}
        links={profileLinks}
      />
    </div>
  );
}
