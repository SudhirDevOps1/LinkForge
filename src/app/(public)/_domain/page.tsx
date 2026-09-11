// 🌐 Custom domain renderer — middleware pointed domains ko yahan rewrite karta
// hai; host header se profile resolve hota hai.
import { headers } from "next/headers";
import { after } from "next/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import { BioRenderer } from "@/components/bio-renderer";
import { trackEvent } from "@/lib/analytics";
import { parseDesign } from "@/lib/design";
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
    <>
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
        links={links}
      />
    </>
  );
}
