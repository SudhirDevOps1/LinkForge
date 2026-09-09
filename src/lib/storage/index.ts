// =============================================================================
// 📦 Storage Service — Multi-Provider Abstraction (एक ही API, कोई भी backend)
// -----------------------------------------------------------------------------
// interface StorageService {
//   upload(file, key)  → public URL return karta hai
//   delete(key)
//   getUrl(key)
//   getPresignedUploadUrl?(key, type)  → S3-family providers (direct browser upload)
// }
// =============================================================================
import { randomBytes } from "crypto";
import { mkdir, stat, unlink, writeFile } from "fs/promises";
import { open } from "fs/promises";
import path from "path";
import { isS3Compatible, storageProvider } from "@/config/storage.config";

export interface StorageService {
  readonly provider: string;
  upload(
    data: Buffer | Uint8Array,
    key: string,
    contentType: string,
  ): Promise<{ key: string; url: string }>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
  getPresignedUploadUrl?(key: string, contentType: string): Promise<{
    url: string;
    key: string;
    publicUrl: string;
  }>;
  /**
   * Complete-flow verification (optional, provider jo support kare):
   * stat = object size/type, readPrefix = pehle N bytes (magic-byte check).
   * Na ho to complete route 501 deta hai (multipart fallback chalta hai).
   */
  stat?(key: string): Promise<{ sizeBytes: number; contentType?: string }>;
  readPrefix?(key: string, maxBytes: number): Promise<Uint8Array>;
}

/** Path traversal se bachne ke liye keys sanitize */
export function sanitizeKey(key: string): string {
  const clean = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (clean.includes("..") || !/^[a-zA-Z0-9/_\-.]+$/.test(clean)) {
    throw new Error("Invalid storage key");
  }
  return clean;
}

export function newKey(folder: string, ext: string): string {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 5) || "bin";
  return `${folder}/${Date.now()}-${randomBytes(8).toString("hex")}.${safeExt}`;
}

// ---- Local disk provider (default) ----------------------------------------------
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

export const localStorage: StorageService = {
  provider: "local",
  async upload(data, key, _contentType) {
    const safe = sanitizeKey(key);
    const full = path.join(UPLOAD_DIR, safe);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    return { key: safe, url: this.getUrl(safe) };
  },
  async delete(key) {
    try {
      await unlink(path.join(UPLOAD_DIR, sanitizeKey(key)));
    } catch {
      /* already gone */
    }
  },
  getUrl(key) {
    // /api/files/[...path] route stream karta hai (public caching ke saath)
    return `/api/files/${sanitizeKey(key)}`;
  },
  async stat(key) {
    const st = await stat(path.join(UPLOAD_DIR, sanitizeKey(key)));
    return { sizeBytes: st.size };
  },
  async readPrefix(key, maxBytes) {
    const fh = await open(path.join(UPLOAD_DIR, sanitizeKey(key)), "r");
    try {
      const buf = Buffer.alloc(Math.max(1, Math.min(maxBytes, 64 * 1024)));
      const { bytesRead } = await fh.read(buf, 0, buf.length, 0);
      return new Uint8Array(buf.buffer, buf.byteOffset, bytesRead);
    } finally {
      await fh.close();
    }
  },
};

export const localUploadDir = UPLOAD_DIR;

// ---- Factory -----------------------------------------------------------------------
let cachedService: StorageService | undefined;

export async function getStorage(): Promise<StorageService> {
  if (cachedService) return cachedService;
  if (isS3Compatible) {
    const { createS3Storage } = await import("./s3");
    cachedService = createS3Storage();
    return cachedService;
  }
  if (storageProvider === "vercel-blob") {
    const { put, del } = await import("@vercel/blob");
    cachedService = {
      provider: "vercel-blob",
      async upload(data, key, contentType) {
        const body = Buffer.isBuffer(data) ? data : Buffer.from(data);
        const blob = await put(sanitizeKey(key), body, {
          access: "public",
          contentType,
          addRandomSuffix: false,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        // key = full URL rakho taaki getUrl/delete round-trip consistent rahe
        // (purane pathname-keys delete par best-effort try hote hain).
        return { key: blob.url, url: blob.url };
      },
      async delete(key) {
        // del() ko URL chahiye; purani pathname-keys best-effort
        try {
          await del(key, { token: process.env.BLOB_READ_WRITE_TOKEN });
        } catch (err) {
          console.warn(`[storage:vercel-blob] delete failed → ${key}:`, (err as Error).message);
          throw err;
        }
      },
      getUrl(key) {
        // key hi full URL hai (naye uploads); purani keys waise hi return
        return key;
      },
    };
    return cachedService;
  }
  cachedService = localStorage;
  return cachedService;
}

export { storageProvider };
