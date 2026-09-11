// =============================================================================
// 📬 POST /api/subscribe — Public Profile Newsletter / Email Subscription
// -----------------------------------------------------------------------------
// Validates email syntax, checks temporary email blocklist, verifies MX DNS,
// and saves subscriber to Neon DB.
// =============================================================================
import { createHash } from "crypto";
import { and, eq, or } from "drizzle-orm";
import { encryptEmail } from "@/lib/db-cipher";
import { z } from "zod";
import { db } from "@/db";
import { autoMigrate } from "@/db/auto-migrate";
import { profiles, subscribers } from "@/db/schema";
import { ApiError, guardRateLimitDual, handle, json, parseOrThrow } from "@/lib/api";
import { verifyEmailMx } from "@/lib/email-verifier";
import { verifyAltchaSolution } from "@/lib/altcha";
import { triggerWebhooks } from "@/lib/webhooks";

const subscribeSchema = z.object({
  slug: z.string().trim().min(1).max(100),
  email: z.string().trim().email().min(5).max(254),
  altcha: z.string().trim().optional(),
});

export const POST = handle(async (req: Request) => {
  // Auto-migrate ensures subscribers table exists on Neon / Postgres / SQLite
  await autoMigrate();

  const { slug, email, altcha } = parseOrThrow(
    subscribeSchema,
    await req.json().catch(() => ({}))
  );

  // Dual-bucket rate limit: max 10 per 15min per IP, max 5 per 15min per target email/creator
  await guardRateLimitDual(req, "subscribe:rate", `${slug}:${email}`, 10, 5, 15 * 60_000);

  // 0. Proof-of-Work anti-bot protection (ALTCHA)
  if (altcha) {
    const altchaRes = verifyAltchaSolution(altcha);
    if (!altchaRes.verified) {
      throw new ApiError(400, altchaRes.error || "Security verification failed. Please complete the challenge.");
    }
  }

  // 1. Check profile exists and is published
  const [profile] = await db
    .select({
      id: profiles.id,
      isPublished: profiles.isPublished,
      displayName: profiles.displayName,
      mailchimpApiKey: profiles.mailchimpApiKey,
    })
    .from(profiles)
    .where(eq(profiles.slug, slug))
    .limit(1);

  if (!profile || !profile.isPublished) {
    throw new ApiError(404, "Profile not found or currently unpublished");
  }

  // 2. Comprehensive MX DNS & Disposable Verification
  const verification = await verifyEmailMx(email);
  if (!verification.valid) {
    throw new ApiError(400, verification.reason || "Invalid email address");
  }

  // 3. Privacy-preserving IP hash
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const ipHash = createHash("sha256").update(`sub::${ip}`).digest("hex").slice(0, 24);
  const userAgent = req.headers.get("user-agent")?.slice(0, 255) || "unknown";

  // 4. Check if already subscribed with self-healing retry
  const encEmail = encryptEmail(verification.email);
  let existing: { id: string } | undefined;
  try {
    const [row] = await db
      .select({ id: subscribers.id })
      .from(subscribers)
      .where(and(eq(subscribers.profileId, profile.id), or(eq(subscribers.email, encEmail), eq(subscribers.email, verification.email))))
      .limit(1);
    existing = row;
  } catch (dbErr: unknown) {
    const msg = (dbErr as Error)?.message || "";
    if (msg.includes("relation \"subscribers\" does not exist") || msg.includes("subscribers") || msg.includes("no such table")) {
      await autoMigrate(true);
      const [row] = await db
        .select({ id: subscribers.id })
        .from(subscribers)
        .where(and(eq(subscribers.profileId, profile.id), or(eq(subscribers.email, encEmail), eq(subscribers.email, verification.email))))
        .limit(1);
      existing = row;
    } else {
      throw dbErr;
    }
  }

  if (existing) {
    return json({
      success: true,
      alreadySubscribed: true,
      message: `${verification.email} is already subscribed to ${profile.displayName}'s newsletter! 🎉`,
    });
  }

  // 5. Insert new subscriber
  await db.insert(subscribers).values({
    profileId: profile.id,
    email: encEmail,
    status: "active",
    ipHash,
    userAgent,
  });

  // 5.1 Trigger Webhook notification to Stoat, Discord, Slack, and Google Sheets
  triggerWebhooks(profile.id, "subscribe", {
    subscriberEmail: verification.email,
    profileSlug: slug,
    profileName: profile.displayName,
    subscribedAt: new Date().toISOString(),
  }).catch(() => {});

  // 6. Automatic Mailchimp Audience Sync if configured by creator
  if (profile.mailchimpApiKey && profile.mailchimpApiKey.includes("-")) {
    const dc = profile.mailchimpApiKey.split("-")[1];
    if (dc) {
      // Async fire-and-forget sync to Mailchimp list
      fetch(`https://${dc}.api.mailchimp.com/3.0/lists`, {
        headers: { Authorization: `Bearer ${profile.mailchimpApiKey}` },
      })
        .then(async (res) => {
          if (!res.ok) return;
          const listData = (await res.json().catch(() => null)) as { lists?: Array<{ id: string }> } | null;
          const firstListId = listData?.lists?.[0]?.id;
          if (firstListId) {
            await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${firstListId}/members`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${profile.mailchimpApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email_address: verification.email,
                status: "subscribed",
              }),
            }).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }

  return json(
    {
      success: true,
      alreadySubscribed: false,
      message: `Thank you! You have successfully subscribed to updates from ${profile.displayName}! 🎉`,
    },
    { status: 201 }
  );
});
