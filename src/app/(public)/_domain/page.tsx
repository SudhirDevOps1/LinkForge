// 🌐 Custom domain renderer — middleware pointed domains ko yahan rewrite karta
// hai; host header se profile resolve hota hai.
import { headers } from "next/headers";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { BioRenderer } from "@/components/bio-renderer";
import { trackEvent } from "@/lib/analytics";
import { getBioByDomain } from "@/lib/queries";
import { triggerWebhooks } from "@/lib/webhooks";

export const dynamic = "force-dynamic";

export default async function CustomDomainPage() {
  const hdrs = await headers();
  const host = (hdrs.get("host") ?? "").split(":")[0].toLowerCase();
  const bio = host ? await getBioByDomain(host) : null;
  if (!bio || !bio.profile.isPublished) notFound();

  const { profile, links } = bio;
  after(async () => {
    await trackEvent({
      profileId: profile.id,
      type: "view",
      headers: hdrs,
      analyticsEnabled: profile.analyticsEnabled,
    });
    await triggerWebhooks(profile.id, "view", {
      profileSlug: profile.slug,
      via: "custom-domain",
      host,
    });
  });

  return (
    <BioRenderer
      profile={{
        displayName: profile.displayName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        theme: profile.theme,
        layout: profile.layout,
        slug: profile.slug,
      }}
      links={links}
    />
  );
}
