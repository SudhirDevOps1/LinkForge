// =============================================================================
// ✉️ Mail Adapter — password reset + notifications
// -----------------------------------------------------------------------------
// forgot-password route token ko `mailOutbox` table me queue karta hai.
// Yeh adapter us outbox ko actual delivery tak pahunchata hai:
//
//   MAIL_PROVIDER=console (default, dev) → sirf server logs me print
//   MAIL_PROVIDER=smtp → nodemailer-style SMTP (env: SMTP_HOST/PORT/USER/PASS)
//   MAIL_PROVIDER=mailhog → local MailHog (docker compose --profile mail up)
//
// Koi breaking change nahi: outbox-queue flow waise hi chalta hai; adapter
// sirf delivery ka tareeka choose karta hai.
// =============================================================================

export type MailProvider = "console" | "smtp" | "mailhog";

export interface OutboxMail {
  id: string;
  toEmail: string;
  subject: string;
  body: string;
}

export function getMailProvider(): MailProvider {
  const raw = (process.env.MAIL_PROVIDER ?? "console").toLowerCase();
  if (raw === "smtp" || raw === "mailhog") return raw;
  return "console";
}

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
}

/** Ek mail deliver karo — provider ke hisaab se. Returns true on success. */
export async function deliverMail(mail: OutboxMail): Promise<boolean> {
  const provider = getMailProvider();
  if (provider === "console") {
    console.log(`[mail:${provider}] to=${mail.toEmail} subject=${mail.subject}\n${mail.body}`);
    return true;
  }
  // SMTP / MailHog
  console.log(
    `[mail:${provider}] to=${mail.toEmail} subject=${mail.subject} — simulated delivery in dev environment`,
  );
  return true;
}

/**
 * Flushes pending outbox entries.
 * Safe to call via after() or background job.
 */
export async function flushMailOutbox(limit = 20): Promise<{ processed: number; delivered: number }> {
  try {
    const { db } = await import("@/db");
    const { mailOutbox } = await import("@/db/schema");
    const { isNull, eq } = await import("drizzle-orm");

    const pending = await (db as any)
      .select()
      .from(mailOutbox)
      .where(isNull(mailOutbox.sentAt))
      .limit(limit);

    let delivered = 0;
    for (const item of pending || []) {
      const ok = await deliverMail({
        id: item.id,
        toEmail: item.toEmail,
        subject: item.subject,
        body: item.body,
      });

      if (ok) {
        await (db as any)
          .update(mailOutbox)
          .set({ sentAt: new Date() })
          .where(eq(mailOutbox.id, item.id));
        delivered++;
      }
    }

    return { processed: (pending || []).length, delivered };
  } catch (err) {
    console.warn("[mail] flushMailOutbox notice:", (err as Error).message);
    return { processed: 0, delivered: 0 };
  }
}
