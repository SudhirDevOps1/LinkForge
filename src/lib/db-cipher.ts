// =============================================================================
// 🔐 Database Cipher — Transparent AES-256-GCM Field-Level Encryption
// -----------------------------------------------------------------------------
// Encrypts sensitive fields (fileName, storageKey, etc.) before writing to Neon DB.
// Stolen database dumps or console access will reveal only unreadable ciphertext.
// Format: enc:v1:<ivHex>:<tagHex>:<ciphertextHex>
// =============================================================================
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:v1:";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes recommended for GCM

/**
 * Derives a 32-byte (256-bit) encryption key buffer from environment variables:
 * 1. DB_ENCRYPTION_KEY (64-character hex or 32-byte string)
 * 2. Fallback: SHA-256 hash of AUTH_SECRET
 */
function getEncryptionKey(): Buffer {
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
    const cipher = createCipheriv(ALGORITHM, key, iv);

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
    const decipher = createDecipheriv(ALGORITHM, key, iv);
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
 * Checks whether a given string is currently encrypted
 */
export function isEncrypted(val: string | null | undefined): boolean {
  return typeof val === "string" && val.startsWith(PREFIX);
}
