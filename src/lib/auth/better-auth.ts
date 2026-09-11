// =============================================================================
// 🛡️ LinkForge — Better Auth Server Configuration
// -----------------------------------------------------------------------------
// Enterprise authentication engine powered by Better Auth & Drizzle ORM.
// Supports credentials, session lifecycle management, and social providers.
// =============================================================================
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin, anonymous, organization, phoneNumber, twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { isSqliteProvider } from "@/config/db.config";
import { db } from "@/db";
import * as pgSchema from "@/db/schema";
import * as sqliteSchema from "@/db/schema.sqlite";

const rpId =
  process.env.AUTH_RP_ID ||
  (process.env.NEXT_PUBLIC_APP_URL
    ? (() => {
        try {
          return new URL(process.env.NEXT_PUBLIC_APP_URL).hostname;
        } catch {
          return "localhost";
        }
      })()
    : "localhost");

const s = isSqliteProvider ? sqliteSchema : pgSchema;
const betterAuthSchema = {
  user: s.users,
  users: s.users,
  session: s.sessions,
  sessions: s.sessions,
  account: s.accounts,
  accounts: s.accounts,
  verification: s.verifications,
  verifications: s.verifications,
  passkey: s.passkeys,
  passkeys: s.passkeys,
  twoFactor: s.twoFactors,
  twoFactors: s.twoFactors,
  organization: s.organizations,
  organizations: s.organizations,
  member: s.members,
  members: s.members,
  invitation: s.invitations,
  invitations: s.invitations,
};

export const auth = betterAuth({
  appName: "LinkForge",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  basePath: "/api/auth",
  secret:
    process.env.BETTER_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    "linkforge-better-auth-secure-secret-entropy-32b",
  database: drizzleAdapter(db, {
    provider: isSqliteProvider ? "sqlite" : "pg",
    schema: betterAuthSchema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache
    },
  },
  plugins: [
    passkey({
      rpID: rpId,
      rpName: "LinkForge",
    }),
    twoFactor({
      issuer: "LinkForge",
    }),
    phoneNumber({
      sendOTP: async ({ phoneNumber: phone, code }) => {
        // Free messaging channel dispatcher (WhatsApp webhook, Telegram bot, or console outbox)
        console.log(`[Better Auth OTP] Sending code ${code} to ${phone} via free messaging channel`);
        const webhookUrl = process.env.OTP_WEBHOOK_URL;
        if (webhookUrl) {
          try {
            await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phoneNumber: phone, code, app: "LinkForge" }),
            });
          } catch (err) {
            console.error("[OTP Webhook Error]", (err as Error).message);
          }
        }
      },
    }),
    admin({
      defaultRole: "user",
      adminRole: "admin",
    }),
    anonymous({
      emailDomainName: "guest.linkforge.internal",
    }),
    organization(),
  ],
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
});

export type Auth = typeof auth;
