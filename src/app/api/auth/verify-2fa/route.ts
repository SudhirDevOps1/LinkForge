// =============================================================================
// 🛡️ LinkForge — Two-Factor Authentication (2FA) Verification Endpoint
// -----------------------------------------------------------------------------
// Verifies 6-digit TOTP code (Google Authenticator / 1Password) or offline backup codes,
// provisions a fresh session, and sets both lf_session and better-auth session cookies.
// =============================================================================
import { eq, or } from "drizzle-orm";
import { ApiError, assertSameOrigin, guardRateLimitDual, handle, json } from "@/lib/api";
import { autoMigrate } from "@/db/auto-migrate";
import { db } from "@/db";
import { isSqliteProvider } from "@/config/db.config";
import * as pgSchema from "@/db/schema";
import * as sqliteSchema from "@/db/schema.sqlite";
import { createSession, setSessionCookie } from "@/lib/auth";
import { encryptEmail } from "@/lib/db-cipher";
import { clientIp } from "@/lib/rate-limit";
import { verifyTotpToken } from "@/lib/totp";

const schema = isSqliteProvider ? sqliteSchema : pgSchema;
const { users, twoFactors } = schema as typeof pgSchema;

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await autoMigrate();

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    code?: string;
  };

  const email = (body.email || "").toLowerCase().trim();
  const code = (body.code || "").trim();

  if (!email || !code) {
    throw new ApiError(400, "Email and verification code are required.");
  }

  // 1. Dual-bucket rate limiting (IP + Account email)
  await guardRateLimitDual(req, "auth:verify-2fa", email, 10, 5, 15 * 60_000);

  // 2. Look up user
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, email), eq(users.email, encryptEmail(email))))
    .limit(1);

  if (!user) {
    throw new ApiError(401, "Invalid verification code or account not found.");
  }

  if (user.banned) {
    throw new ApiError(403, "Account suspended: " + (user.banReason || "Please contact administrator."));
  }

  // 3. Query 2FA record
  const [twoFactorRecord] = await db
    .select()
    .from(twoFactors)
    .where(eq(twoFactors.userId, user.id))
    .limit(1);

  if (!twoFactorRecord) {
    throw new ApiError(400, "Two-factor authentication record not found for this account.");
  }

  // 4. Verify code (TOTP or Backup Code)
  let verified = false;
  if (code.length === 6 && verifyTotpToken(code, twoFactorRecord.secret)) {
    verified = true;
  } else {
    // Check backup codes
    let remainingCodes: string[] = [];
    try {
      remainingCodes = typeof twoFactorRecord.backupCodes === "string"
        ? (twoFactorRecord.backupCodes.startsWith("[")
            ? JSON.parse(twoFactorRecord.backupCodes)
            : twoFactorRecord.backupCodes.split(",").map((c: string) => c.trim()))
        : (twoFactorRecord.backupCodes as string[]);
    } catch {
      remainingCodes = [];
    }

    const matchedIdx = remainingCodes.findIndex((bc) => bc.toLowerCase() === code.toLowerCase());
    if (matchedIdx !== -1) {
      verified = true;
      remainingCodes.splice(matchedIdx, 1);
      await db
        .update(twoFactors)
        .set({
          backupCodes: JSON.stringify(remainingCodes),
        })
        .where(eq(twoFactors.userId, user.id));
    }
  }

  if (!verified) {
    // Fallback check against Better Auth context if available
    try {
      const { auth } = await import("@/lib/auth/better-auth");
      const ctx = await auth.$context;
      if (ctx && (ctx as any).twoFactor?.verifyTotp) {
        verified = await (ctx as any).twoFactor.verifyTotp({
          userId: user.id,
          code,
        });
      }
    } catch {}
  }

  if (!verified) {
    throw new ApiError(401, "Invalid verification code. Please check your authenticator app and try again.");
  }

  // 5. Create Session & Set Cookies
  const session = await createSession(user.id, {
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  await setSessionCookie(session.id, session.expiresAt);

  return json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});
