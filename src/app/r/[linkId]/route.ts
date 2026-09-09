// 🖱️ GET /r/[linkId] — click tracking redirect
// Flow: click record (non-blocking, after()) → webhooks fire → 302 redirect
import { and, eq } from "drizzle-orm";
import { after } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { links, profiles } from "@/db/schema";
import { trackEvent } from "@/lib/analytics";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { triggerWebhooks } from "@/lib/webhooks";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ linkId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { linkId } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(linkId)) {
    return NextResponse.redirect(new URL("/", req.url), 302);
  }

  const [row] = await db
    .select({ link: links, profile: profiles })
    .from(links)
    .innerJoin(profiles, eq(profiles.id, links.profileId))
    .where(and(eq(links.id, linkId), eq(links.isActive, true)))
    .limit(1);

  if (!row || !row.profile.isPublished) {
    return NextResponse.redirect(new URL("/", req.url), 302);
  }

  const target = row.link.url;
  // Open-redirect safe: sirf http(s)/mailto allow
  if (!/^(https?:|mailto:)/i.test(target)) {
    return NextResponse.redirect(new URL(`/${row.profile.slug}`, req.url), 302);
  }

  // Rate limit: 120 clicks/min per IP (abuse protection)
  const rl = await rateLimit(`track:${clientIp(req)}`, 120);
  if (!rl.success) {
    return NextResponse.redirect(target, 302); // user ko block mat karo, sirf tracking skip
  }

  // Non-blocking analytics + webhooks (response pehle, kaam baad me)
  const headers = new Headers(req.headers);
  after(async () => {
    await trackEvent({
      profileId: row.profile.id,
      linkId: row.link.id,
      type: "click",
      headers,
      analyticsEnabled: row.profile.analyticsEnabled,
    });
    await triggerWebhooks(row.profile.id, "click", {
      linkId: row.link.id,
      title: row.link.title,
      url: row.link.url,
      profileSlug: row.profile.slug,
    });
  });

  return NextResponse.redirect(target, 302);
}
