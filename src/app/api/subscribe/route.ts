// =============================================================================
// 📬 POST /api/subscribe — Public Profile Newsletter / Email Subscription
// -----------------------------------------------------------------------------
// Validates email syntax, checks temporary email blocklist, verifies MX DNS,
// and saves subscriber to Neon DB.
// =============================================================================
import { createHash } from "crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { profiles, subscribers } from "@/db/schema";
import { ApiError, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { verifyEmailMx } from "@/lib/email-verifier";

const subscribeSchema = z.object({
  slug: z.string().trim().min(1).max(100),
  email: z.string().trim().email().min(5).max(254),
});

export const POST = handle(async (req: Request) => {
  // Rate limit: 10 subscriptions per minute per IP
  await guardRateLimit(req, "subscribe:rate", 10);

  const { slug, email } = parseOrThrow(
    subscribeSchema,
    await req.json().catch(() => ({}))
  );

  // 1. Check profile exists and is published
  const [profile] = await db
    .select({ id: profiles.id, isPublished: profiles.isPublished, displayName: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.slug, slug))
    .limit(1);

  if (!profile || !profile.isPublished) {
    throw new ApiError(404, "Profile nahi mili ya abhi unpublished hai");
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

  // 4. Check if already subscribed
  const [existing] = await db
    .select({ id: subscribers.id })
    .from(subscribers)
    .where(and(eq(subscribers.profileId, profile.id), eq(subscribers.email, verification.email)))
    .limit(1);

  if (existing) {
    return json({
      success: true,
      alreadySubscribed: true,
      message: `${verification.email} pehle se ${profile.displayName} ke newsletter me subscribed hai! 🎉`,
    });
  }

  // 5. Insert new subscriber
  await db.insert(subscribers).values({
    profileId: profile.id,
    email: verification.email,
    status: "active",
    ipHash,
    userAgent,
  });

  return json(
    {
      success: true,
      alreadySubscribed: false,
      message: `Shukriya! ${profile.displayName} ke updates ke liye successfully subscribe ho gaye! 🎉`,
    },
    { status: 201 }
  );
});
