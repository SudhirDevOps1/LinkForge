// =============================================================================
// 🔐 Database Cipher — Transparent AES-256 Field-Level Encryption
// -----------------------------------------------------------------------------
// Encrypts sensitive fields (emails, names, fileNames, storageKeys, etc.)
// before writing to Neon DB / Postgres / SQLite.
// Stolen database dumps or Neon console access will reveal ONLY unreadable ciphertext.
//
// 1. General Fields (Names, keys): AES-256-GCM
//    Format: enc:v1:<ivHex>:<tagHex>:<ciphertextHex>
//
// 2. Searchable Unique Fields (Emails): Deterministic AES-256-CBC
//    Format: enc:em:<ivHex>:<ciphertextHex>
//    Derived from HMAC-SHA256(email, secret) so identical email produces
//    identical ciphertext across queries while looking 100% encrypted in DB!
// =============================================================================
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "crypto";

const PREFIX = "enc:v1:";
const EMAIL_PREFIX = "enc:em:";
const ALGORITHM_GCM = "aes-256-gcm";
const ALGORITHM_CBC = "aes-256-cbc";
const IV_LENGTH = 12; // 12 bytes recommended for GCM

/**
 * Derives a 32-byte (256-bit) encryption key buffer from environment variables:
 * 1. DB_ENCRYPTION_KEY (64-character hex or 32-byte string)
 * 2. Fallback: SHA-256 hash of AUTH_SECRET
 */
export function getEncryptionKey(): Buffer {
  const rawKey = process.env.DB_ENCRYPTION_KEY?.trim();
  if (rawKey) {
    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
      return Buffer.from(rawKey, "hex");
    }
    if (rawKey.length === 32) {
      return Buffer.from(rawKey, "utf8");
    }
    // Any other string: hash to 32 bytes
    return createHash("sha256").update(rawKey, "utf8").digest();
  }

  // Seamless fallback to AUTH_SECRET
  const fallbackSecret = process.env.AUTH_SECRET ?? "linkforge-default-db-cipher-salt-32b";
  return createHash("sha256").update(`db-cipher::${fallbackSecret}`, "utf8").digest();
}

/**
 * Encrypts a plaintext string into format `enc:v1:<ivHex>:<tagHex>:<cipherHex>`
 */
export function encryptField(text: string | null | undefined): string {
  if (text == null || text === "") return "";
  
  // If already encrypted, don't double-encrypt
  if (text.startsWith(PREFIX)) return text;

  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM_GCM, key, iv);

    const ciphertext = Buffer.concat([
      cipher.update(Buffer.from(text, "utf8")),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return `${PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${ciphertext.toString("hex")}`;
  } catch (err) {
    console.error("[db-cipher] Encryption error:", err);
    throw new Error(`Failed to encrypt field: ${(err as Error).message}`);
  }
}

/**
 * Decrypts a ciphertext string formatted as `enc:v1:<ivHex>:<tagHex>:<cipherHex>`.
 * Backwards Compatibility: If the input does not start with `enc:v1:`, returns it as-is.
 */
export function decryptField(ciphertext: string | null | undefined): string {
  if (ciphertext == null || ciphertext === "") return "";

  // Graceful fallback for unencrypted existing records
  if (!ciphertext.startsWith(PREFIX)) {
    return ciphertext;
  }

  try {
    const parts = ciphertext.slice(PREFIX.length).split(":");
    if (parts.length !== 3) {
      console.warn("[db-cipher] Invalid ciphertext format, returning original");
      return ciphertext;
    }

    const [ivHex, tagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const encryptedData = Buffer.from(cipherHex, "hex");

    const key = getEncryptionKey();
    const decipher = createDecipheriv(ALGORITHM_GCM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (err) {
    console.warn("[db-cipher] Decryption failed (key mismatch or tampered data), returning original:", (err as Error).message);
    return ciphertext;
  }
}

/**
 * Deterministic AES-256 encryption for searchable unique columns (Email).
 * Produces format: `enc:em:<ivHex>:<cipherHex>`.
 *
 * In Neon DB console, emails look like:
 * enc:em:eb4772e829b0b66bbbc26c3d443bef9f:6af32a5e6e4d2368235ff636...
 * completely unreadable to anyone inspecting the database!
 */
export function encryptEmail(email: string | null | undefined): string {
  if (email == null || email === "") return "";
  const clean = email.trim().toLowerCase();
  if (clean.startsWith(EMAIL_PREFIX)) return clean;

  try {
    const key = getEncryptionKey();
    const iv = createHmac("sha256", key).update(`em-iv::${clean}`).digest().subarray(0, 16);
    const cipher = createCipheriv(ALGORITHM_CBC, key, iv);
    const ciphertext = Buffer.concat([cipher.update(clean, "utf8"), cipher.final()]);
    return `${EMAIL_PREFIX}${iv.toString("hex")}:${ciphertext.toString("hex")}`;
  } catch (err) {
    console.error("[db-cipher] encryptEmail error:", err);
    throw new Error(`Failed to encrypt email: ${(err as Error).message}`);
  }
}

/**
 * Decrypts deterministic email ciphertext.
 * Backwards compatible with legacy unencrypted email strings.
 */
export function decryptEmail(ciphertext: string | null | undefined): string {
  if (ciphertext == null || ciphertext === "") return "";
  if (!ciphertext.startsWith(EMAIL_PREFIX)) return ciphertext;

  try {
    const parts = ciphertext.slice(EMAIL_PREFIX.length).split(":");
    if (parts.length !== 2) return ciphertext;
    const [ivHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const encryptedData = Buffer.from(cipherHex, "hex");

    const key = getEncryptionKey();
    const decipher = createDecipheriv(ALGORITHM_CBC, key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (err) {
    console.warn("[db-cipher] decryptEmail error:", err);
    return ciphertext;
  }
}

/**
 * Checks whether a given string is currently encrypted
 */
export function isEncrypted(val: string | null | undefined): boolean {
  return typeof val === "string" && (val.startsWith(PREFIX) || val.startsWith(EMAIL_PREFIX));
}
