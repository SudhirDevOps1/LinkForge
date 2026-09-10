// ✉️ POST /api/auth/forgot — password reset link (mail outbox / SMTP)
import { db } from "@/db";
import { mailOutbox } from "@/db/schema";
import { assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { createPasswordReset } from "@/lib/auth";
import { forgotSchema } from "@/lib/validations";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "auth:forgot", 5);
  const { email } = parseOrThrow(forgotSchema, await req.json().catch(() => ({})));
  const token = await createPasswordReset(email);

  if (token) {
    // Self-hosted friendly: email provider na ho to outbox table me queue hota hai.
    // SMTP provider integrate karne ke liye lib/mail.ts me adapter jodein.
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      `${req.headers.get("x-forwarded-proto") ?? "http"}://${req.headers.get("host")}`;
    await db.insert(mailOutbox).values({
      toEmail: email.toLowerCase().trim(),
      subject: "LinkForge — Password reset",
      body: `Reset your password: ${baseUrl}/reset-password?token=${token}\n\nThis link will expire in 1 hour.`,
    });
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
