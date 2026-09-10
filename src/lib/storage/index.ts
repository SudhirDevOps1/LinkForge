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
import path from "path";
import os from "os";
import { isS3Compatible, storageProvider } from "@/config/storage.config";
import type { StorageAdapter } from "./types";


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
  /**
   * Private-bucket proxy streaming (S3-family): object ko stream karke do.
   * Range passthrough (audio/video seek). Na ho to proxy route 501 deta hai.
   */
  stream?(key: string, rangeHeader?: string): Promise<{
    body: ReadableStream;
    contentType?: string;
    sizeBytes?: number;
    contentRange?: string;
  }>;
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

export const localUploadDir =
  process.env.UPLOAD_DIR ??
  (process.env.VERCEL
    ? path.join(os.tmpdir(), "uploads")
    : path.join(process.cwd(), "uploads"));


// Lazy proxy for backwards compatibility without pulling fs/promises into the main bundle
export const localStorage: StorageService = {
  provider: "local",
  async upload(data, key, contentType) {
    const { localStorage: local } = await import("./local");
    return local.upload(data, key, contentType);
  },
  async delete(key) {
    const { localStorage: local } = await import("./local");
    return local.delete(key);
  },
  getUrl(key) {
    return `/api/files/${sanitizeKey(key)}`;
  },
  async stat(key) {
    const { localStorage: local } = await import("./local");
    return local.stat!(key);
  },
  async readPrefix(key, maxBytes) {
    const { localStorage: local } = await import("./local");
    return local.readPrefix!(key, maxBytes);
  },
};

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
  const { localStorage: local } = await import("./local");
  cachedService = local;
  return cachedService;
}

export * from "./types";

let cachedAdapter: StorageAdapter | undefined;

export async function getStorageAdapter(): Promise<StorageAdapter> {
  if (cachedAdapter) return cachedAdapter;
  const driver = (process.env.STORAGE_DRIVER ?? storageProvider).toLowerCase();

  if (driver === "b2") {
    const { B2StorageAdapter } = await import("./b2-adapter");
    cachedAdapter = new B2StorageAdapter();
    return cachedAdapter;
  }

  const { LocalStorageAdapter } = await import("./local-adapter");
  cachedAdapter = new LocalStorageAdapter();
  return cachedAdapter;
}

export { storageProvider };

