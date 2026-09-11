// =============================================================================
// 🛡️ LinkForge — Self-Sovereign Password Reset via Two-Factor Authentication
// -----------------------------------------------------------------------------
// Allows users who enabled 2FA (Google Authenticator / 1Password) or have
// backup codes to reset their credentials instantly without third-party email.
// =============================================================================
import { eq } from "drizzle-orm";
import { ApiError, assertSameOrigin, guardRateLimitDual, handle, json } from "@/lib/api";
import { autoMigrate } from "@/db/auto-migrate";
import { db } from "@/db";
import { accounts, twoFactors, users } from "@/db/schema";
import { verifyAltchaSolution } from "@/lib/altcha";
import { hashPassword, signOutEverywhere, verifyPassword } from "@/lib/auth";
import { verifyTotpToken } from "@/lib/totp";

const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await autoMigrate();

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    code?: string;
    newPassword?: string;
    altcha?: string;
  };

  const email = (body.email || "").toLowerCase().trim();
  const code = (body.code || "").trim();
  const newPassword = body.newPassword || "";
  const altcha = body.altcha || "";

  if (!email || !code || !newPassword) {
    throw new ApiError(400, "Email, verification code, and new password are required.");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters long.");
  }

  // 1. Dual-bucket rate limiting (IP + Account email)
  await guardRateLimitDual(req, "auth:reset-2fa", email, 10, 5, 15 * 60_000);

  // 2. ALTCHA Proof-of-Work Bot Defense
  const altchaRes = verifyAltchaSolution(altcha);
  if (!altchaRes.verified) {
    throw new ApiError(400, altchaRes.error || "Security verification failed. Please complete the challenge.");
  }

  // 3. Find User
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    // Constant-time timing equalization to prevent user enumeration
    await verifyPassword(newPassword, DUMMY_HASH);
    throw new ApiError(401, "Invalid verification code or account not found.");
  }

  if (user.banned) {
    throw new ApiError(403, "Account suspended: " + (user.banReason || "Please contact administrator."));
  }

  // 4. Query 2FA Records
  const [twoFactorRecord] = await db
    .select()
    .from(twoFactors)
    .where(eq(twoFactors.userId, user.id))
    .limit(1);

  if (!twoFactorRecord || !twoFactorRecord.verified) {
    throw new ApiError(
      400,
      "Two-Factor Authentication is not activated on this account. Please use standard email reset.",
    );
  }

  // 5. Verify TOTP Code or Offline Backup Code
  let verified = false;

  // A. Check 6-digit TOTP
  if (code.length === 6 && verifyTotpToken(code, twoFactorRecord.secret)) {
    verified = true;
  }

  // B. Check Backup Codes
  let remainingCodes: string[] = [];
  try {
    remainingCodes = typeof twoFactorRecord.backupCodes === "string"
      ? (twoFactorRecord.backupCodes.startsWith("[")
          ? JSON.parse(twoFactorRecord.backupCodes)
          : twoFactorRecord.backupCodes.split(",").map((c) => c.trim()))
      : (twoFactorRecord.backupCodes as string[]);
  } catch {
    remainingCodes = [];
  }

  const backupIndex = remainingCodes.findIndex((c) => c.toLowerCase() === code.toLowerCase());
  if (backupIndex !== -1) {
    verified = true;
    remainingCodes.splice(backupIndex, 1);
    // Persist remaining backup codes
    await db
      .update(twoFactors)
      .set({ backupCodes: JSON.stringify(remainingCodes) })
      .where(eq(twoFactors.id, twoFactorRecord.id));
  }

  if (!verified) {
    throw new ApiError(401, "Invalid verification code. Please check your authenticator app.");
  }

  // 6. Update Password & Invalidate Old Sessions
  const newHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({
      passwordHash: newHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Sync Better Auth accounts table if present
  try {
    await db
      .update(accounts)
      .set({
        password: newHash,
        updatedAt: new Date(),
      })
      .where(eq(accounts.userId, user.id));
  } catch {
    // Non-fatal accounts sync
  }

  // Revoke all existing sessions across devices
  await signOutEverywhere(user.id);

  return json({
    ok: true,
    message: "Password reset successfully. You may now sign in with your new credentials.",
  });
});
