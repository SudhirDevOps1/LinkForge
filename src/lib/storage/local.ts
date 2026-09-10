// =============================================================================
// 💾 Local Disk Storage Provider (Self-Hosted / Local Dev)
// -----------------------------------------------------------------------------
// Isolated in its own module so serverless runtimes (Vercel / Cloudflare)
// and S3/B2 configurations never pull dynamic filesystem tracing into the bundle.
// =============================================================================
import { mkdir, open, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import type { StorageService } from "./index";
import { sanitizeKey } from "./index";

export const localUploadDir =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

export const localStorage: StorageService = {
  provider: "local",
  async upload(data, key, _contentType) {
    const safe = sanitizeKey(key);
    const full = path.join(/*turbopackIgnore: true*/ localUploadDir, safe);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    return { key: safe, url: this.getUrl(safe) };
  },
  async delete(key) {
    try {
      await unlink(
        path.join(/*turbopackIgnore: true*/ localUploadDir, sanitizeKey(key)),
      );
    } catch {
      /* already gone */
    }
  },
  getUrl(key) {
    return `/api/files/${sanitizeKey(key)}`;
  },
  async stat(key) {
    const st = await stat(
      path.join(/*turbopackIgnore: true*/ localUploadDir, sanitizeKey(key)),
    );
    return { sizeBytes: st.size };
  },
  async readPrefix(key, maxBytes) {
    const fh = await open(
      path.join(/*turbopackIgnore: true*/ localUploadDir, sanitizeKey(key)),
      "r",
    );
    try {
      const buf = Buffer.alloc(Math.max(1, Math.min(maxBytes, 64 * 1024)));
      const { bytesRead } = await fh.read(buf, 0, buf.length, 0);
      return new Uint8Array(buf.buffer, buf.byteOffset, bytesRead);
    } finally {
      await fh.close();
    }
  },
};
