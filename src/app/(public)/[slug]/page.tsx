// 🌍 Public bio page — /[slug]
// Open Graph + Twitter Cards + JSON-LD + privacy-first view tracking.
// Edge caches ke liye stale-while-revalidate headers; runtime dynamic rehta
// hai taake har view track ho (fully static prerender se tracking break hoti).
import type { Metadata } from "next";
import { after } from "next/server";
import { notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { BioRenderer } from "@/components/bio-renderer";
import { NewsletterSubscribe } from "@/components/newsletter-subscribe";
import { ShareButton } from "@/components/share-button";
import { ProfilePasswordGate } from "@/components/profile-password-gate";
import { QRCodeButton } from "@/components/qr-code";
import { VCardButton } from "@/components/vcard-button";
import { trackEvent } from "@/lib/analytics";
import { parseDesign } from "@/lib/design";
import { getBioBySlug } from "@/lib/queries";
import { triggerWebhooks } from "@/lib/webhooks";
import { getTheme } from "@/lib/themes";
import { getBlogManifest } from "@/lib/blog";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params;
  const bio = await getBioBySlug(slug);
  if (!bio || !bio.profile.isPublished) return {};
  const { profile } = bio;
  const title = profile.seoTitle || `${profile.displayName} | LinkForge`;
  const description = profile.seoDescription || profile.bio || `All links and updates from ${profile.displayName} in one place.`;
  return {
    title,
    description,
    alternates: { canonical: `/${profile.slug}` },
    // 🔍 noIndex support
    robots: profile.noIndex ? "noindex,nofollow" : "index,follow",
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

  // 🔒 Password gate check
  if (profile.profilePassword) {
    const jar = await cookies();
    const unlocked = jar.get(`pf_unlock_${profile.id}`);
    if (!unlocked) {
      return (
        <ProfilePasswordGate
          slug={profile.slug}
          displayName={profile.displayName}
          avatarUrl={profile.avatarUrl}
        />
      );
    }
  }

  // 🗓️ Filter out expired / not-yet-scheduled links
  const now = new Date();
  const visibleLinks = links.filter((link) => {
    if (!link.isActive) return false;
    if (link.scheduledAt && new Date(link.scheduledAt) > now) return false;
    if (link.expiresAt && new Date(link.expiresAt) <= now) return false;
    return true;
  });

  // 📌 Pinned links first, then by position
  visibleLinks.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.position - b.position;
  });

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
      linkCount: visibleLinks.length,
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

  // 📢 Announcement banner — expired ones skip
  const ann = profile.announcement as { text: string; emoji?: string; url?: string; expiresAt?: string } | null;
  const showAnnouncement = ann && (!ann.expiresAt || new Date(ann.expiresAt) > now);

  // 📝 Daily Micro-Blog & Journal integration
  let blogManifest = await getBlogManifest(profile.id);
  if (!blogManifest.posts || blogManifest.posts.length === 0) {
    blogManifest = await getBlogManifest(profile.slug);
  }
  const publishedBlogPosts = blogManifest.posts || [];
  const latestBlogPost = publishedBlogPosts[0] || null;
  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/${profile.slug}`;

  return (

    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <meta name="theme-color" content={theme.swatch[0]} />

      {/* 📢 Announcement Banner */}
      {showAnnouncement && (
        <div className="w-full bg-violet-600 px-4 py-2.5 text-center text-sm font-medium text-white">
          {ann!.emoji && <span className="mr-1.5">{ann!.emoji}</span>}
          {ann!.url ? (
            <a href={ann!.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {ann!.text}
            </a>
          ) : (
            ann!.text
          )}
        </div>
      )}

      <BioRenderer
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
        links={visibleLinks}
        footerSlot={
          <div className="w-full flex flex-col gap-4 mt-6">
            {/* 📰 Featured Daily Micro-Blog Showcase */}
            {publishedBlogPosts.length > 0 && (
              <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition hover:border-violet-500/40 hover:bg-white/[0.08]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30 shrink-0">
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
                          Daily Micro-Blog
                        </span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                          {publishedBlogPosts.length} {publishedBlogPosts.length === 1 ? "entry" : "entries"}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white truncate mt-0.5">
                        {latestBlogPost?.title}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/${profile.slug}/blog`}
                    className="shrink-0 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-violet-500 shadow-md shadow-violet-600/20 flex items-center gap-1"
                  >
                    <span>Read Blog</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            )}

            <NewsletterSubscribe
              slug={profile.slug}
              displayName={profile.displayName}
              accentColor={theme.vars.accent}
            />
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1">
                <ShareButton
                  url={profileUrl}
                  title={`${profile.displayName} | LinkForge`}
                />
              </div>
              <QRCodeButton url={profileUrl} displayName={profile.displayName} />
              <VCardButton
                displayName={profile.displayName}
                slug={profile.slug}
                bio={profile.bio}
                avatarUrl={profile.avatarUrl}
              />
            </div>
          </div>
        }
      />
    </>
  );
}
