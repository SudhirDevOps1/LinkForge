// =============================================================================
// 🤝 Public Creator Media Kit & Sponsorship Portal — /[slug]/mediakit
// -----------------------------------------------------------------------------
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MediaKitView } from "@/components/mediakit-view";
import { getAnalyticsSummary } from "@/lib/analytics";
import { getBioBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params;
  const bio = await getBioBySlug(slug);
  if (!bio || !bio.profile.isPublished) return {};
  const { profile } = bio;
  const title = `${profile.displayName} — Verified Creator Media Kit & Rate Card`;
  const description = `Official audience demographics, 30-day verified metrics, and brand sponsorship packages for ${profile.displayName}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/${profile.slug}/mediakit`,
      images: profile.ogImageUrl ? [{ url: profile.ogImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function MediaKitPage({ params }: Ctx) {
  const { slug } = await params;
  const bio = await getBioBySlug(slug);
  if (!bio || !bio.profile.isPublished) notFound();

  const { profile } = bio;

  // Retrieve last 30 days telemetry
  let summary = {
    views: 0,
    clicks: 0,
    uniqueVisitors: 0,
    ctr: 0,
    countries: [] as Array<{ name: string; value: number }>,
    devices: [] as Array<{ name: string; value: number }>,
  };

  try {
    const raw = await getAnalyticsSummary(profile.id, 30);
    summary = {
      views: raw.totals.views,
      clicks: raw.totals.clicks,
      uniqueVisitors: raw.totals.uniqueVisitors,
      ctr: raw.totals.ctr,
      countries: raw.countries,
      devices: raw.devices,
    };
  } catch {}

  // Real creator telemetry (no fake/fabricated metrics)
  const totalViews = summary.views;
  const uniqueVisitors = summary.uniqueVisitors;
  const totalClicks = summary.clicks;
  const ctr = summary.ctr;
  const countries = summary.countries;
  const devices = summary.devices;

  return (
    <MediaKitView
      profile={{
        slug: profile.slug,
        displayName: profile.displayName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        theme: profile.theme,
      }}
      stats={{
        totalViews,
        totalClicks,
        uniqueVisitors,
        ctr,
        countries,
        devices,
      }}
    />
  );
}
