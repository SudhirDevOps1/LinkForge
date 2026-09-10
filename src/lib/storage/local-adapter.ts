// =============================================================================
// 💻 Local Storage Adapter — Development / Offline Fallback
// Implements StorageAdapter using the local filesystem.
// =============================================================================
import { mkdir, readdir, readFile, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { sanitizeKey } from "./index";
import type { StorageAdapter } from "./types";

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");

export class LocalStorageAdapter implements StorageAdapter {
  readonly driver = "local";

  private async ensureDir(targetPath: string) {
    await mkdir(/*turbopackIgnore: true*/ path.dirname(targetPath), { recursive: true });
  }

  async getPresignedPutUrl(
    key: string,
    contentType: string,
    expiresInSec = 600,
  ): Promise<{ url: string; method: "PUT"; expiresInSeconds: number }> {
    const safeKey = sanitizeKey(key);
    // Local development endpoint for direct PUT
    return {
      url: `/api/storage/file/${safeKey}`,
      method: "PUT",
      expiresInSeconds: expiresInSec,
    };
  }

  async getPresignedGetUrl(
    key: string,
    expiresInSec = 300,
  ): Promise<{ url: string; method: "GET"; expiresInSeconds: number }> {
    const safeKey = sanitizeKey(key);
    return {
      url: `/api/storage/file/${safeKey}`,
      method: "GET",
      expiresInSeconds: expiresInSec,
    };
  }

  async putObject(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string,
  ): Promise<void> {
    const safeKey = sanitizeKey(key);
    const target = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, safeKey);
    await this.ensureDir(target);
    const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
    await writeFile(target, buf);
  }

  async getObject(
    key: string,
  ): Promise<{ data: Buffer; contentType: string } | null> {
    const safeKey = sanitizeKey(key);
    const target = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, safeKey);
    try {
      const data = await readFile(target);
      const ext = path.extname(safeKey).toLowerCase();
      const mimeMap: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".pdf": "application/pdf",
        ".txt": "text/plain",
        ".json": "application/json",
        ".mp3": "audio/mpeg",
        ".mp4": "video/mp4",
        ".zip": "application/zip",
      };
      return {
        data,
        contentType: mimeMap[ext] || "application/octet-stream",
      };
    } catch {
      return null;
    }
  }

  async deleteObject(key: string): Promise<boolean> {
    const safeKey = sanitizeKey(key);
    const target = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, safeKey);
    try {
      await unlink(target);
      return true;
    } catch {
      return false;
    }
  }

  async listObjects(prefix?: string): Promise<string[]> {
    const safePrefix = prefix ? sanitizeKey(prefix) : "";
    const base = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, safePrefix);
    const keys: string[] = [];

    async function walk(dir: string, rel = "") {
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const e of entries) {
          const entryRel = rel ? `${rel}/${e.name}` : e.name;
          if (e.isDirectory()) {
            await walk(path.join(dir, e.name), entryRel);
          } else if (e.isFile()) {
            keys.push(safePrefix ? `${safePrefix}/${entryRel}` : entryRel);
          }
        }
      } catch {
        /* ignore */
      }
    }

    await walk(base);
    return keys;
  }

  async getBucketUsage(
    prefix?: string,
  ): Promise<{ totalBytes: number; objectCount: number }> {
    const keys = await this.listObjects(prefix);
    let totalBytes = 0;
    for (const k of keys) {
      try {
        const st = await stat(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, k));
        totalBytes += st.size;
      } catch {
        /* ignore */
      }
    }
    return { totalBytes, objectCount: keys.length };
  }

  async ping(): Promise<boolean> {
    try {
      await mkdir(/*turbopackIgnore: true*/ UPLOAD_DIR, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }
}
