// 🌍 Public bio page — /[slug]
// Open Graph + Twitter Cards + JSON-LD + privacy-first view tracking.
// Edge caches ke liye stale-while-revalidate headers; runtime dynamic rehta
// hai taake har view track ho (fully static prerender se tracking break hoti).
import type { Metadata } from "next";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { BioRenderer } from "@/components/bio-renderer";
import { trackEvent } from "@/lib/analytics";
import { getBioBySlug } from "@/lib/queries";
import { triggerWebhooks } from "@/lib/webhooks";
import { getTheme } from "@/lib/themes";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params;
  const bio = await getBioBySlug(slug);
  if (!bio || !bio.profile.isPublished) return {};
  const { profile } = bio;
  const title = profile.seoTitle || `${profile.displayName} | LinkForge`;
  const description = profile.seoDescription || profile.bio || `${profile.displayName} ke saare links ek jagah.`;
  return {
    title,
    description,
    alternates: { canonical: `/${profile.slug}` },
    openGraph: {
      type: "profile",
      title,
      description,
      url: `/${profile.slug}`,
      images: profile.ogImageUrl ? [{ url: profile.ogImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: profile.ogImageUrl ? [profile.ogImageUrl] : undefined,
    },
  };
}

export default async function PublicBioPage({ params }: Ctx) {
  const { slug } = await params;
  const bio = await getBioBySlug(slug);
  if (!bio || !bio.profile.isPublished) notFound();

  const { profile, links } = bio;

  // Non-blocking view tracking + webhooks
  const hdrs = await headers();
  after(async () => {
    await trackEvent({
      profileId: profile.id,
      type: "view",
      headers: hdrs,
      analyticsEnabled: profile.analyticsEnabled,
    });
    await triggerWebhooks(profile.id, "view", {
      profileSlug: profile.slug,
      linkCount: links.length,
    });
  });

  const theme = getTheme(profile.theme);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: profile.displayName,
      description: profile.bio || undefined,
      image: profile.avatarUrl || undefined,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <meta name="theme-color" content={theme.swatch[0]} />
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
    </>
  );
}
