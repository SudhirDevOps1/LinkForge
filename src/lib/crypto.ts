// =============================================================================
// 🔐 Crypto Helpers — pure functions (unit-testable, no Next.js imports)
// =============================================================================
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

/** SHA-256 hex digest */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** HMAC-SHA256 hex (webhook signatures ke liye) */
export function hmacSha256Hex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

/** Timing-safe string comparison (hash vs hash) */
export function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** CSPRNG opaque token (sessions, API keys, reset tokens) */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Privacy-first IP hash — raw IP kabhi store nahi hota.
 * Salt = AUTH_SECRET (env). Salt ke bina hash reversible nahi.
 */
export function hashIp(ip: string): string {
  const salt = process.env.AUTH_SECRET ?? "linkforge-dev-salt";
  return sha256Hex(`${salt}::${ip}`).slice(0, 32);
}

/** URL-safe slugify: "Aarav Sharma!" → "aarav-sharma" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 39);
}

/** Webhook signature header verify */
export function verifyWebhookSignature(
  secret: string,
  body: string,
  signature: string,
): boolean {
  return safeEqualHex(hmacSha256Hex(secret, body), signature);
}
