// 🔗 Dashboard — Links editor page (server data → client editor)
import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { LinksEditor } from "@/components/links-editor";
import { db } from "@/db";
import { links } from "@/db/schema";
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

  return (
    <LinksEditor
      profile={{
        displayName: profile.displayName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        theme: profile.theme,
        layout: profile.layout,
      }}
      initialLinks={profileLinks}
    />
  );
}
