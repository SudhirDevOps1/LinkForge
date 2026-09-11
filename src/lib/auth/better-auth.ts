// =============================================================================
// 🛡️ LinkForge — Better Auth Server Configuration
// -----------------------------------------------------------------------------
// Enterprise authentication engine powered by Better Auth & Drizzle ORM.
// Supports credentials, session lifecycle management, and social providers.
// =============================================================================
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin, anonymous, organization, twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { db } from "@/db";
import {
  accounts,
  invitations,
  members,
  organizations,
  passkeys,
  sessions,
  twoFactors,
  users,
  verifications,
} from "@/db/schema";

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
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
      passkey: passkeys,
      twoFactor: twoFactors,
      organization: organizations,
      member: members,
      invitation: invitations,
    },
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
      generateId: "uuid",
    },
  },
});

export type Auth = typeof auth;
