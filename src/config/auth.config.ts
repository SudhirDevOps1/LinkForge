// =============================================================================
// 🔐 Auth Provider Configuration (ऑथेंटिकेशन प्रोवाइडर कॉन्फ़िग)
// -----------------------------------------------------------------------------
// `AUTH_PROVIDER` env var ke basis par auth strategy select hoti hai:
//   builtin   → Bundled Lucia-style sessions + bcrypt (default, zero-config,
//               fully free & self-hosted)
//   neon      → Neon Auth
//   supabase  → Supabase Auth (social logins, magic links)
//   clerk     → Clerk (enterprise user management)
//   nextauth  → NextAuth.js / Auth.js
//
// Har provider same user model (email / password / name / avatar) par map
// hota hai — src/db/schema.ts `users` table.
// =============================================================================

export type AuthProvider = "builtin" | "neon" | "supabase" | "clerk" | "nextauth";

const envProvider = (process.env.AUTH_PROVIDER ?? "builtin").trim().toLowerCase();

export const authProvider: AuthProvider = (
  ["builtin", "neon", "supabase", "clerk", "nextauth"].includes(envProvider)
    ? envProvider
    : "builtin"
) as AuthProvider;

export const SESSION_COOKIE = "lf_session";
export const SESSION_TTL_DAYS = 30;
