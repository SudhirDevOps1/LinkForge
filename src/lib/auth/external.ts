// =============================================================================
// 🔌 External Auth Provider Adapters
// -----------------------------------------------------------------------------
// AUTH_PROVIDER=builtin ke alawa yeh providers same unified user model par map
// hote hain (users table: email / name / avatar). Har adapter ka pattern:
//   1. Provider SDK se sign-in / OAuth callback handle karo
//   2. Provider identity ko local `users` row se map karo (upsert by email)
//   3. Local session issue karo (same cookie + sessions table)
//
// Docs: docs/auth.md — har provider ka step-by-step setup
// =============================================================================
import { eq } from "drizzle-orm";
import { authProvider } from "@/config/auth.config";
import { db } from "@/db";
import { profiles, users, type Session, type User } from "@/db/schema";
import { ApiError } from "@/lib/api";
import { allocateSlug, createSession, setSessionCookie } from "./index";

function notConfigured(provider: string, envHint: string): ApiError {
  return new ApiError(
    501,
    `${provider} provider is not configured. Please set ${envHint} environment variables. Setup guide: docs/auth.md`,
  );
}

/**
 * External identity ko local user par map karo (upsert by email).
 * Unified model guarantee: har user ke paas ek profile (bio page) hoti hai —
 * isliye naye external user ke liye profile auto-create hoti hai (builtin
 * signup jaisi), aur existing user ka name/avatar provider data se update
 * hota hai. Bina profile ke `/[slug]` 404 deta — yahi purana bug tha.
 */
export async function mapExternalUser(identity: {
  email: string;
  name?: string;
  avatarUrl?: string;
}): Promise<User> {
  const email = identity.email.toLowerCase().trim();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    const patch: Partial<Pick<User, "name" | "avatarUrl">> = {};
    const name = identity.name?.trim();
    if (name && name !== existing.name) patch.name = name;
    if (identity.avatarUrl && identity.avatarUrl !== existing.avatarUrl) {
      patch.avatarUrl = identity.avatarUrl;
    }
    if (Object.keys(patch).length > 0) {
      const [updated] = await db
        .update(users)
        .set(patch)
        .where(eq(users.id, existing.id))
        .returning();
      return updated ?? existing;
    }
    return existing;
  }
  const [user] = await db
    .insert(users)
    .values({
      email,
      name: identity.name?.trim() ?? "",
      avatarUrl: identity.avatarUrl ?? null,
      passwordHash: null, // OAuth-only
    })
    .returning();
  // Default profile (bio page) — builtin signUp() ke same rules par
  const slug = await allocateSlug(identity.name || email.split("@")[0]);
  await db.insert(profiles).values({
    userId: user.id,
    slug,
    displayName: (identity.name?.trim() || email.split("@")[0]) ?? "",
    bio: "",
  });
  return user;
}

export async function signUpExternal(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  switch (authProvider) {
    case "supabase": {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw notConfigured("Supabase Auth", "SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
      }
      // Supabase Admin API se user banao, fir local model par map karo
      const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: input.email.toLowerCase().trim(),
          password: input.password,
          email_confirm: true,
          user_metadata: { name: input.name.trim() },
        }),
      });
      if (!res.ok) throw new ApiError(400, "Supabase signup failed");
      return mapExternalUser({ email: input.email, name: input.name });
    }
    case "clerk":
      throw notConfigured("Clerk", "CLERK_SECRET_KEY + NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
    case "nextauth":
      throw notConfigured("NextAuth.js", "NEXTAUTH_URL + AUTH_SECRET + OAuth provider keys");
    case "neon":
      throw notConfigured("Neon Auth", "NEON_AUTH_URL");
    default:
      throw new ApiError(501, "Unknown auth provider");
  }
}

export async function signInExternal(input: {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
}): Promise<{ user: User; session: Session }> {
  switch (authProvider) {
    case "supabase": {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        throw notConfigured("Supabase Auth", "SUPABASE_URL + SUPABASE_ANON_KEY");
      }
      const res = await fetch(
        `${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            apikey: process.env.SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: input.email.toLowerCase().trim(),
            password: input.password,
          }),
        },
      );
      if (!res.ok) throw new ApiError(401, "Galat email ya password");
      const user = await mapExternalUser({ email: input.email });
      const session = await createSession(user.id, {
        ip: input.ip,
        userAgent: input.userAgent,
      });
      await setSessionCookie(session.id, session.expiresAt);
      return { user, session };
    }
    case "clerk":
      throw notConfigured("Clerk", "CLERK_SECRET_KEY");
    case "nextauth":
      throw notConfigured("NextAuth.js", "NEXTAUTH_URL + AUTH_SECRET");
    case "neon":
      throw notConfigured("Neon Auth", "NEON_AUTH_URL");
    default:
      throw new ApiError(501, "Unknown auth provider");
  }
}
