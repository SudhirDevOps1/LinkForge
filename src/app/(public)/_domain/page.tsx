// 🌐 Custom domain renderer — middleware pointed domains ko yahan rewrite karta
// hai; host header se profile resolve hota hai.
import { headers, cookies } from "next/headers";
import { after } from "next/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { BioRenderer } from "@/components/bio-renderer";
import { ProfilePasswordGate } from "@/components/profile-password-gate";
import { FloatingActionBar } from "@/components/floating-action-bar";
import { NewsletterSubscribe } from "@/components/newsletter-subscribe";
import { ShareButton } from "@/components/share-button";
import { QRCodeButton } from "@/components/qr-code";
import { VCardButton } from "@/components/vcard-button";
import { trackEvent } from "@/lib/analytics";
import { parseDesign } from "@/lib/design";
import { getBioByDomain } from "@/lib/queries";
import { triggerWebhooks } from "@/lib/webhooks";
import { getTheme } from "@/lib/themes";

export const dynamic = "force-dynamic";

export default async function CustomDomainPage() {
  const hdrs = await headers();
  const host = (hdrs.get("host") ?? "").split(":")[0].toLowerCase();
  const bio = host ? await getBioByDomain(host) : null;
  if (!bio || !bio.profile.isPublished) notFound();

  const { profile, links } = bio;

  // 🔒 Password gate check for custom domain
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
      linkCount: visibleLinks.length,
    });
  });

  const theme = getTheme(profile.theme);
  const ann = profile.announcement as { text: string; emoji?: string; url?: string; expiresAt?: string } | null;
  const showAnnouncement = ann && (!ann.expiresAt || new Date(ann.expiresAt) > now);
  const profileUrl = `https://${host}`;

  return (
    <>
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

      {profile.metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${profile.metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
      {profile.tiktokPixelId && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${profile.tiktokPixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}
      {profile.googleAnalyticsId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${profile.googleAnalyticsId}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${profile.googleAnalyticsId}');
            `}
          </Script>
        </>
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
          upiId: profile.upiId,
        }}
        links={visibleLinks}
        footerSlot={
          <div key="custom-domain-footer-slot" className="w-full flex flex-col gap-4 mt-6">
            <NewsletterSubscribe
              key="newsletter-subscribe-widget-custom"
              slug={profile.slug}
              displayName={profile.displayName}
              accentColor={theme.vars.accent}
            />
            <div key="social-share-dock-custom" className="flex items-center gap-2 mt-2">
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
            {/* 💼 Creator Media Kit & Sponsorships */}
            <div className="w-full text-center pt-1">
              <Link
                href={`/${profile.slug}/mediakit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Verified Media Kit & Sponsorships →</span>
              </Link>
            </div>
          </div>
        }
      />
      <FloatingActionBar
        displayName={profile.displayName}
        slug={profile.slug}
        bio={profile.bio ?? undefined}
        avatarUrl={profile.avatarUrl}
        links={visibleLinks}
        accentColor={theme.vars.accent}
      />
    </>
  );
}
