// =============================================================================
// 🔐 Auth Service — Multi-Provider Abstraction
// -----------------------------------------------------------------------------
// Default provider: "builtin" (Lucia-style DB sessions + bcrypt) — fully free,
// self-hosted, kisi external service ki zaroorat nahi.
//
// AUTH_PROVIDER=supabase|clerk|nextauth|neon set karne par adapters
// (lib/auth/external.ts) load hote hain jo same unified user model par map
// karte hain.
// =============================================================================
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_TTL_DAYS, authProvider } from "@/config/auth.config";
import { db } from "@/db";
import {
  passwordResetTokens,
  profiles,
  sessions,
  users,
  type Profile,
  type Session,
  type User,
} from "@/db/schema";
import { ApiError } from "@/lib/api";
import { hashIp, randomToken, sha256Hex, slugify } from "@/lib/crypto";
import { RESERVED_SLUGS } from "@/lib/validations";

export interface SessionContext {
  user: User;
  session: Session;
  profile: Profile | null;
}

const BCRYPT_ROUNDS = 10;

// ---- Passwords ---------------------------------------------------------------
export async function hashPassword(password: string, rounds = BCRYPT_ROUNDS) {
  return bcrypt.hash(password, rounds);
}
export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// ---- Slug allocation -----------------------------------------------------------
// Exported taaki external auth adapters (lib/auth/external.ts) bhi same
// slug rules se profile bana sakein — unified user model ke liye zaroori.
export async function allocateSlug(base: string): Promise<string> {
  let candidate = slugify(base) || `user-${randomToken(3)}`;
  if (RESERVED_SLUGS.has(candidate)) candidate = `${candidate}-page`;
  for (let i = 0; i < 20; i++) {
    const slug = i === 0 ? candidate : `${candidate}-${randomToken(2).slice(0, 4)}`;
    const existing = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.slug, slug))
      .limit(1);
    if (existing.length === 0) return slug;
  }
  return `${candidate}-${randomToken(4).slice(0, 8)}`;
}

// ---- Sign up -----------------------------------------------------------------
export async function signUp(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const email = input.email.toLowerCase().trim();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    throw new ApiError(409, "Is email se account pehle se exists karta hai");
  }
  if (authProvider !== "builtin") {
    const { signUpExternal } = await import("./external");
    return signUpExternal(input);
  }

  const [user] = await db
    .insert(users)
    .values({
      email,
      name: input.name.trim(),
      passwordHash: await hashPassword(input.password),
    })
    .returning();

  // Har user ke liye ek default profile (bio page) banao
  const slug = await allocateSlug(input.name || email.split("@")[0]);
  await db.insert(profiles).values({
    userId: user.id,
    slug,
    displayName: input.name.trim(),
    bio: "",
  });
  return user;
}

// ---- Sessions ----------------------------------------------------------------
export async function createSession(
  userId: string,
  meta?: { ip?: string; userAgent?: string },
): Promise<Session> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
  const [session] = await db
    .insert(sessions)
    .values({
      id: token,
      userId,
      userAgent: meta?.userAgent?.slice(0, 300) ?? null,
      // Privacy-first: salted hash (AUTH_SECRET salt) — raw IP kabhi store nahi.
      ipHash: meta?.ip ? hashIp(meta.ip) : null,
      expiresAt,
    })
    .returning();
  return session;
}

/** httpOnly cookie set karo — sirf Route Handlers / Server Actions se call karein */
export async function setSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax", // CSRF mitigation
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function signIn(input: {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
}): Promise<{ user: User; session: Session }> {
  if (authProvider !== "builtin") {
    const { signInExternal } = await import("./external");
    return signInExternal(input);
  }
  const email = input.email.toLowerCase().trim();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user?.passwordHash) {
    throw new ApiError(401, "Galat email ya password");
  }
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw new ApiError(401, "Galat email ya password");
  const session = await createSession(user.id, {
    ip: input.ip,
    userAgent: input.userAgent,
  });
  await setSessionCookie(session.id, session.expiresAt);
  return { user, session };
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
    await clearSessionCookie();
  }
}

/** Saare sessions revoke (password change / danger zone) */
export async function signOutEverywhere(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

// ---- Current session -----------------------------------------------------------
export async function getSessionUser(): Promise<SessionContext | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, token))
    .limit(1);
  if (!row) return null;
  if (row.session.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, token));
    return null;
  }
  let [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, row.user.id))
    .limit(1);

  // Auto-heal: agar user ka profile kisi wajah se create nahi hua tha, auto-create
  if (!profile) {
    try {
      const slug = await allocateSlug(row.user.name || row.user.email.split("@")[0]);
      const [newProfile] = await db
        .insert(profiles)
        .values({
          userId: row.user.id,
          slug,
          displayName: row.user.name.trim() || "Creator",
          bio: "",
        })
        .returning();
      profile = newProfile;
    } catch (err) {
      console.warn("[auth] auto-heal profile creation notice:", (err as Error).message);
    }
  }

  return { user: row.user, session: row.session, profile: profile ?? null };
}

/** API route guard — unauthenticated → 401 */
export async function requireUser(): Promise<SessionContext> {
  const ctx = await getSessionUser();
  if (!ctx) throw new ApiError(401, "Authentication required");
  return ctx;
}

// ---- Password reset ------------------------------------------------------------
export async function createPasswordReset(email: string): Promise<string | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  if (!user) return null; // user-enumeration se bachne ke liye silent
  const token = randomToken(24);
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash: sha256Hex(token),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });
  return token;
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = sha256Hex(token);
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1);
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, "Reset link invalid ya expire ho chuka hai");
  }
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword) })
    .where(eq(users.id, row.userId));
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, row.id));
  await signOutEverywhere(row.userId);
}
