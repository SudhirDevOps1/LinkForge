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
// sirf delivery ka tareeka choose karta hai. `npx tsx` se manually flush:
//   import { flushMailOutbox } from "@/lib/mail"; await flushMailOutbox();
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
  // SMTP / MailHog: yahan nodemailer transport plug karein.
  // Abhi ke liye structured log + false (retry ke liye outbox me rehta hai).
  console.log(
    `[mail:${provider}] NOT-CONFIGURED to=${mail.toEmail} subject=${mail.subject} — SMTP transport jodna baki hai`,
  );
  return false;
}
