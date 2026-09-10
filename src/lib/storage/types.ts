// =============================================================================
// 🔒 Storage Adapter Interface — Production-Ready Cloud Storage Contracts
// Backblaze B2, S3, R2, and local storage providers implement this interface.
// =============================================================================

export interface StorageAdapter {
  readonly driver: string;

  /** Generate direct browser PUT upload URL with TTL (default 600s) */
  getPresignedPutUrl(
    key: string,
    contentType: string,
    expiresInSec?: number,
  ): Promise<{ url: string; method: "PUT"; expiresInSeconds: number }>;

  /** Generate time-limited direct GET download URL with TTL (default 300s) */
  getPresignedGetUrl(
    key: string,
    expiresInSec?: number,
  ): Promise<{ url: string; method: "GET"; expiresInSeconds: number }>;

  /** Upload object directly from server memory */
  putObject(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string,
  ): Promise<void>;

  /** Fetch object from storage as Buffer with Content-Type, or null if 404 */
  getObject(
    key: string,
  ): Promise<{ data: Buffer; contentType: string } | null>;

  /** Delete object from storage, returns true if deleted or object did not exist */
  deleteObject(key: string): Promise<boolean>;

  /** List object keys matching an optional prefix */
  listObjects(prefix?: string): Promise<string[]>;

  /** Calculate total bytes and count with automated continuation pagination */
  getBucketUsage(
    prefix?: string,
  ): Promise<{ totalBytes: number; objectCount: number }>;

  /** Optional lightweight connectivity check for health diagnostics */
  ping?(): Promise<boolean>;
}
