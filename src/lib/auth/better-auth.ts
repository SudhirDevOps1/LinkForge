// =============================================================================
// 🛡️ LinkForge — Better Auth Server Configuration
// -----------------------------------------------------------------------------
// Enterprise authentication engine powered by Better Auth & Drizzle ORM.
// Supports credentials, session lifecycle management, and social providers.
// =============================================================================
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/db";
import { accounts, sessions, users, verifications } from "@/db/schema";

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
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
});

export type Auth = typeof auth;
