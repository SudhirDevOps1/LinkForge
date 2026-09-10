// =============================================================================
// 🔐 File Cipher — Zero-Knowledge AES-256-GCM Payload Encryption for Storage
// -----------------------------------------------------------------------------
// Encrypts file payload bytes before uploading to Backblaze B2 (or active storage).
// Objects stored in B2 are 100% unreadable ciphertext to external observers.
// Header format:
// [0..4]: Magic prefix 'LENC\x01' (5 bytes)
// [5..16]: Initialization Vector (12 bytes)
// [17..N-16]: Ciphertext
// [N-16..N]: GCM Authentication Tag (16 bytes)
// =============================================================================
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

export const FILE_ENCRYPTION_MAGIC = Buffer.from([0x4c, 0x45, 0x4e, 0x43, 0x01]); // 'LENC\x01'
export const MAGIC_LENGTH = FILE_ENCRYPTION_MAGIC.length; // 5
export const IV_LENGTH = 12; // 12 bytes for AES-GCM
export const TAG_LENGTH = 16; // 16 bytes auth tag
export const MIN_ENCRYPTED_LENGTH = MAGIC_LENGTH + IV_LENGTH + TAG_LENGTH; // 33 bytes

/**
 * Derives a 32-byte master encryption key for file payloads.
 * Reads FILE_ENCRYPTION_KEY or DB_ENCRYPTION_KEY or AUTH_SECRET.
 */
export function getFileEncryptionKey(): Buffer {
  const customKey = process.env.FILE_ENCRYPTION_KEY?.trim() || process.env.DB_ENCRYPTION_KEY?.trim();
  if (customKey) {
    if (/^[0-9a-fA-F]{64}$/.test(customKey)) {
      return Buffer.from(customKey, "hex");
    }
    if (customKey.length === 32) {
      return Buffer.from(customKey, "utf8");
    }
    return createHash("sha256").update(customKey, "utf8").digest();
  }

  const fallback = process.env.AUTH_SECRET ?? "linkforge-b2-payload-secret-key-32b";
  return createHash("sha256").update(`file-cipher::${fallback}`, "utf8").digest();
}

/**
 * Checks if a buffer has the LinkForge Encrypted header ('LENC\x01')
 */
export function isPayloadEncrypted(buffer: Buffer | Uint8Array | null | undefined): boolean {
  if (!buffer || buffer.length < MIN_ENCRYPTED_LENGTH) return false;
  const slice = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  return (
    slice[0] === FILE_ENCRYPTION_MAGIC[0] &&
    slice[1] === FILE_ENCRYPTION_MAGIC[1] &&
    slice[2] === FILE_ENCRYPTION_MAGIC[2] &&
    slice[3] === FILE_ENCRYPTION_MAGIC[3] &&
    slice[4] === FILE_ENCRYPTION_MAGIC[4]
  );
}

/**
 * Encrypts a raw buffer with AES-256-GCM.
 * Output format: [MAGIC (5b)][IV (12b)][CIPHERTEXT][TAG (16b)]
 */
export function encryptFilePayload(plaintext: Buffer | Uint8Array, key?: Buffer): Buffer {
  const buf = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext);
  // Do not double-encrypt
  if (isPayloadEncrypted(buf)) return buf;

  const encKey = key ?? getFileEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", encKey, iv);

  const ciphertext = Buffer.concat([cipher.update(buf), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([FILE_ENCRYPTION_MAGIC, iv, ciphertext, tag]);
}

/**
 * Decrypts an encrypted buffer back to its original plaintext.
 * If not encrypted, returns the original buffer (for backwards compatibility).
 */
export function decryptFilePayload(encrypted: Buffer | Uint8Array, key?: Buffer): Buffer {
  const buf = Buffer.isBuffer(encrypted) ? encrypted : Buffer.from(encrypted);
  if (!isPayloadEncrypted(buf)) {
    return buf;
  }

  try {
    const encKey = key ?? getFileEncryptionKey();
    const iv = buf.subarray(MAGIC_LENGTH, MAGIC_LENGTH + IV_LENGTH);
    const tag = buf.subarray(buf.length - TAG_LENGTH);
    const ciphertext = buf.subarray(MAGIC_LENGTH + IV_LENGTH, buf.length - TAG_LENGTH);

    const decipher = createDecipheriv("aes-256-gcm", encKey, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch (err) {
    console.error("[file-cipher] Decryption failed (bad key or corrupted file):", err);
    throw new Error(`Payload decryption failed: ${(err as Error).message}`);
  }
}
