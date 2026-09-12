// ✉️ POST /api/auth/forgot — password reset link (mail outbox / SMTP)
import { db } from "@/db";
import { mailOutbox } from "@/db/schema";
import { ApiError, assertSameOrigin, guardRateLimitDual, handle, json, parseOrThrow } from "@/lib/api";
import { createPasswordReset } from "@/lib/auth";
import { forgotSchema } from "@/lib/validations";
import { verifyAltchaSolution } from "@/lib/altcha";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  const input = parseOrThrow(forgotSchema, await req.json().catch(() => ({})));

  // Strict rate limit: max 5 requests per 15 minutes per IP, max 3 per email
  await guardRateLimitDual(req, "auth:forgot", input.email, 5, 3, 15 * 60_000);

  // Verify Proof-of-Work anti-bot protection
  const altchaRes = verifyAltchaSolution(input.altcha);
  if (!altchaRes.verified) {
    throw new ApiError(400, altchaRes.error || "Security verification failed. Please complete the challenge.");
  }

  const token = await createPasswordReset(input.email);

  if (token) {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      `${req.headers.get("x-forwarded-proto") ?? "http"}://${req.headers.get("host")}`;
    await db.insert(mailOutbox).values({
      toEmail: input.email.toLowerCase().trim(),
      subject: "LinkForge — Password reset",
      body: `Reset your password: ${baseUrl}/reset-password?token=${token}\n\nThis link will expire in 1 hour.`,
    });
    try {
      const { flushMailOutbox } = await import("@/lib/mail");
      await flushMailOutbox();
    } catch {
      // Async delivery fallback
    }
  }

  // User-enumeration se bachne ke liye hamesha same response
  return json({
    ok: true,
    message: "If an account exists for this email, a reset link has been sent.",
  });
});

// recent outbox dekhen (dev me reset link test karne ke liye) — sirf local dev
export const GET = handle(async () => {
  if (process.env.NODE_ENV === "production") {
    return json({ error: "Not available" }, { status: 404 });
  }
  const rows = await db.select().from(mailOutbox).orderBy(mailOutbox.createdAt).limit(10);
  return json({ outbox: rows.filter((r) => !r.sentAt).slice(-5) });
});
