// =============================================================================
// 🤝 POST /api/mediakit/inquiry — Brand Sponsorship & Partnership Inquiries
// -----------------------------------------------------------------------------
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { mailOutbox, profiles, users } from "@/db/schema";
import { ApiError, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { triggerWebhooks } from "@/lib/webhooks";

const inquirySchema = z.object({
  slug: z.string().trim().min(1).max(100),
  brandName: z.string().trim().min(2).max(100),
  contactEmail: z.string().trim().email().min(5).max(254),
  packageType: z.string().trim().min(2).max(100),
  budget: z.string().trim().max(50).optional(),
  message: z.string().trim().min(10).max(3000),
});

export const POST = handle(async (req: Request) => {
  // Rate limit: 5 inquiries per 15 minutes per IP
  await guardRateLimit(req, "mediakit:inquiry", 5);

  const data = parseOrThrow(inquirySchema, await req.json().catch(() => ({})));

  // 1. Look up target creator profile
  const [profile] = await db
    .select({
      id: profiles.id,
      userId: profiles.userId,
      slug: profiles.slug,
      displayName: profiles.displayName,
      isPublished: profiles.isPublished,
    })
    .from(profiles)
    .where(eq(profiles.slug, data.slug.toLowerCase()))
    .limit(1);

  if (!profile || !profile.isPublished) {
    throw new ApiError(404, "Creator profile not found");
  }

  // 2. Look up creator email
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, profile.userId))
    .limit(1);

  const creatorEmail = user?.email || "creator@linkforge.app";

  // 3. Queue email notification in mailOutbox
  await db.insert(mailOutbox).values({
    toEmail: creatorEmail,
    subject: `💼 New Brand Sponsorship Inquiry: ${data.brandName} for ${profile.displayName}`,
    body: [
      `Hi ${profile.displayName},`,
      ``,
      `You received a new brand collaboration proposal through your LinkForge Media Kit!`,
      ``,
      `--- Collaboration Brief ---`,
      `Brand / Company: ${data.brandName}`,
      `Contact Email: ${data.contactEmail}`,
      `Selected Package: ${data.packageType}`,
      `Estimated Budget: ${data.budget || "Negotiable / Open to discussion"}`,
      ``,
      `Message / Campaign Pitch:`,
      `${data.message}`,
      ``,
      `Reply directly to ${data.contactEmail} to finalize deliverables and payment.`,
      ``,
      `Best regards,`,
      `The LinkForge Team`,
    ].join("\n"),
  });

  try {
    const { flushMailOutbox } = await import("@/lib/mail");
    await flushMailOutbox();
  } catch {
    // Async delivery fallback
  }

  // 4. Trigger webhooks if configured
  await triggerWebhooks(profile.id, "inquiry", {
    brandName: data.brandName,
    contactEmail: data.contactEmail,
    packageType: data.packageType,
    budget: data.budget,
  });

  return json({
    success: true,
    message: `Thank you! Your partnership brief has been sent directly to ${profile.displayName}. They will reply to ${data.contactEmail} shortly.`,
  });
});
