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
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { decryptEmail, decryptField, encryptEmail, encryptField } from "@/lib/db-cipher";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_TTL_DAYS, authProvider } from "@/config/auth.config";
import { db } from "@/db";
import {
  accounts,
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
// Constant-time dummy hash: prevents timing-based user enumeration attacks
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUU1234567890";

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

  let existing: { id: string }[] = [];
  try {
    existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
  } catch (err) {
    const msg = String(err).toLowerCase();
    if (msg.includes("does not exist") || msg.includes("no such table") || msg.includes("relation")) {
      const { autoMigrate } = await import("@/db/auto-migrate");
      await autoMigrate(true);
      existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
    } else {
      throw err;
    }
  }
  if (existing.length > 0) {
    throw new ApiError(409, "An account with this email address already exists. Please sign in instead.");
  }
  if (authProvider !== "builtin") {
    const { signUpExternal } = await import("./external");
    return signUpExternal(input);
  }

  const [user] = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      email,
      name: input.name.trim(),
      passwordHash: await hashPassword(input.password),
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Better Auth account sync (credential provider with scrypt hash)
  try {
    const { auth } = await import("./better-auth");
    const ctx = await auth.$context;
    const baPassword = await ctx.password.hash(input.password);
    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: baPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (syncErr) {
    console.warn("[auth] account sync notice:", (syncErr as Error).message);
  }

  // Har user ke liye ek default profile (bio page) banao
  const slug = await allocateSlug(input.name || email.split("@")[0]);
  await db.insert(profiles).values({
    id: crypto.randomUUID(),
    userId: user.id,
    slug,
    displayName: input.name.trim(),
    bio: "",
    createdAt: new Date(),
    updatedAt: new Date(),
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
      token,
      userId,
      userAgent: meta?.userAgent?.slice(0, 300) ?? null,
      ipAddress: meta?.ip ?? null,
      // Privacy-first: salted hash (AUTH_SECRET salt) — raw IP kabhi store nahi.
      ipHash: meta?.ip ? hashIp(meta.ip) : null,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
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

  // Seamless Better Auth session cookie bridge
  try {
    const secret =
      process.env.BETTER_AUTH_SECRET ||
      process.env.AUTH_SECRET ||
      process.env.SESSION_SECRET ||
      "linkforge-better-auth-secure-secret-entropy-32b";
    const signature = crypto.createHmac("sha256", secret).update(token).digest("base64");
    const signedValue = `${token}.${encodeURIComponent(signature)}`;
    jar.set("better-auth.session_token", signedValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });
  } catch (err) {
    console.warn("[auth] Failed to set Better Auth session cookie:", (err as Error).message);
  }
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete("better-auth.session_token");
  jar.delete("better-auth.session_data");
}

export async function signIn(input: {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
}): Promise<{ user: User; session: Session | null; twoFactorRedirect?: boolean }> {
  if (authProvider !== "builtin") {
    const { signInExternal } = await import("./external");
    return signInExternal(input);
  }
  const email = input.email.toLowerCase().trim();
  let user: User | undefined;
  try {
    const res = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    user = res[0];
  } catch (err) {
    const msg = String(err).toLowerCase();
    if (msg.includes("does not exist") || msg.includes("no such table") || msg.includes("relation")) {
      const { autoMigrate } = await import("@/db/auto-migrate");
      await autoMigrate(true);
      const res = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      user = res[0];
    } else {
      throw err;
    }
  }

  let passwordOk = false;
  if (user?.passwordHash) {
    passwordOk = await verifyPassword(input.password, user.passwordHash);
  }
  if (!passwordOk && user) {
    // Check accounts table (Better Auth scrypt hash)
    try {
      const [acc] = await db.select().from(accounts).where(eq(accounts.userId, user.id)).limit(1);
      if (acc?.password) {
        const { auth } = await import("./better-auth");
        const ctx = await auth.$context;
        passwordOk = await ctx.password.verify({ password: input.password, hash: acc.password });
        if (passwordOk && !user.passwordHash) {
          // Sync bcrypt passwordHash back to users table
          const newBcrypt = await hashPassword(input.password);
          await db.update(users).set({ passwordHash: newBcrypt }).where(eq(users.id, user.id));
        }
      }
    } catch {}
  }

  if (!passwordOk) {
    if (!user?.passwordHash) {
      await verifyPassword(input.password, DUMMY_HASH);
    }
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.banned) {
    throw new ApiError(403, "Account suspended: " + (user.banReason || "Please contact administrator."));
  }

  // Ensure accounts row is synced with Better Auth scrypt hash for plugins (like 2FA)
  try {
    const { auth } = await import("./better-auth");
    const ctx = await auth.$context;
    const baPassword = await ctx.password.hash(input.password);
    const existingAcc = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.userId, user.id)).limit(1);
    if (existingAcc.length === 0) {
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: baPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      await db.update(accounts).set({ password: baPassword, updatedAt: new Date() }).where(eq(accounts.userId, user.id));
    }
  } catch {
    // Non-fatal account sync
  }

  // Two-Factor gatekeeper
  if (user.twoFactorEnabled) {
    return { user, session: null, twoFactorRedirect: true };
  }

  const session = await createSession(user.id, {
    ip: input.ip,
    userAgent: input.userAgent,
  });
  await setSessionCookie(session.id, session.expiresAt);
  return { user, session };
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  const token =
    jar.get(SESSION_COOKIE)?.value ||
    jar.get("better-auth.session_token")?.value ||
    jar.get("__Secure-better-auth.session_token")?.value;
  if (token) {
    await db.delete(sessions).where(or(eq(sessions.id, token), eq(sessions.token, token)));
    await clearSessionCookie();
    jar.delete("better-auth.session_token");
    jar.delete("__Secure-better-auth.session_token");
  }
}

/** Saare sessions revoke (password change / danger zone) */
export async function signOutEverywhere(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

// ---- Current session -----------------------------------------------------------
export async function getSessionUser(): Promise<SessionContext | null> {
  const jar = await cookies();
  const token =
    jar.get(SESSION_COOKIE)?.value ||
    jar.get("better-auth.session_token")?.value ||
    jar.get("__Secure-better-auth.session_token")?.value;
  if (!token) return null;
  const [row] = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(or(eq(sessions.id, token), eq(sessions.token, token)))
    .limit(1);
  if (!row) return null;
  if (row.session.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(or(eq(sessions.id, token), eq(sessions.token, token)));
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

  const decryptedUser: User = {
    ...row.user,
    email: decryptEmail(row.user.email),
    name: decryptField(row.user.name),
  };
  return { user: decryptedUser, session: row.session, profile: profile ?? null };
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
    throw new ApiError(400, "Password reset link is invalid or has expired. Please request a new one.");
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
