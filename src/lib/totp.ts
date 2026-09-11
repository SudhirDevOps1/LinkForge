// =============================================================================
// 🛡️ LinkForge TOTP Engine — RFC 6238 Standard Time-Based One-Time Password
// -----------------------------------------------------------------------------
// Pure TypeScript implementation using Node.js built-in crypto.
// Zero third-party dependencies, constant-time verification, window skew support.
// =============================================================================
import crypto from "crypto";

function base32Decode(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let index = 0;
  const clean = base32.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  const output = Buffer.alloc(((clean.length * 5) / 8) | 0);

  for (let i = 0; i < clean.length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return output;
}

function generateTotpWindow(secretBase32: string, timeStep = 30, offset = 0): string {
  const key = base32Decode(secretBase32);
  const counter = Math.floor(Date.now() / 1000 / timeStep) + offset;
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offsetByte = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offsetByte) & 0x7fffffff) % 1000000;
  return code.toString().padStart(6, "0");
}

/**
 * Verifies a 6-digit TOTP token against a base32 secret.
 * Checks previous (-30s), current (0s), and next (+30s) windows to account for clock drift.
 */
export function verifyTotpToken(token: string, secretBase32: string): boolean {
  if (!token || token.trim().length !== 6) return false;
  const cleanToken = token.trim();

  for (const offset of [-1, 0, 1]) {
    const expected = generateTotpWindow(secretBase32, 30, offset);
    if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expected))) {
      return true;
    }
  }
  return false;
}
