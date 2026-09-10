// =============================================================================
// 🔒 Backblaze B2 Private Storage Adapter (Production-Ready, Zero-Leak)
// Implements StorageAdapter using AWS SDK v3 with B2-specific optimizations:
// - 100% Private Bucket: No public credentials leak, time-limited presigned URLs
// - forcePathStyle: true for Backblaze B2 S3 API
// - requestChecksumCalculation / responseChecksumValidation: "WHEN_REQUIRED"
// - Streaming body to Buffer conversion with chunk aggregation
// - ContinuationToken pagination for listObjects and getBucketUsage
// =============================================================================
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  B2_PRESIGN_GET_EXPIRY_SEC,
  B2_PRESIGN_PUT_EXPIRY_SEC,
  getB2CorsRulesJson,
  getCorsAllowedOrigins,
} from "@/config/storage.config";
import { sanitizeKey } from "./index";
import type { StorageAdapter } from "./types";

function clean(val: string | undefined): string | undefined {
  if (!val) return undefined;
  let s = val.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s || undefined;
}

export interface B2Config {
  endpoint: string;
  region: string;
  bucket: string;
  keyId: string;
  applicationKey: string;
}

export function resolveB2Config(): B2Config {
  const bucket =
    clean(process.env.B2_BUCKET) ??
    clean(process.env.B2_BUCKET_NAME);
  const keyId =
    clean(process.env.B2_KEY_ID) ??
    clean(process.env.B2_APPLICATION_KEY_ID) ??
    clean(process.env.B2_ACCESS_KEY_ID);
  const applicationKey =
    clean(process.env.B2_APPLICATION_KEY) ??
    clean(process.env.B2_APP_KEY) ??
    clean(process.env.B2_SECRET_ACCESS_KEY);

  if (!bucket) {
    throw new Error(
      "B2_BUCKET (ya B2_BUCKET_NAME) environment variable required hai",
    );
  }
  if (!keyId) {
    throw new Error(
      "B2_KEY_ID (ya B2_APPLICATION_KEY_ID) environment variable required hai",
    );
  }
  if (!applicationKey) {
    throw new Error(
      "B2_APPLICATION_KEY (ya B2_APP_KEY) environment variable required hai",
    );
  }

  let rawEndpoint = clean(process.env.B2_ENDPOINT) ?? "";
  let endpoint: string;
  let region = clean(process.env.B2_REGION);

  if (rawEndpoint) {
    if (!rawEndpoint.startsWith("http://") && !rawEndpoint.startsWith("https://")) {
      rawEndpoint = `https://${rawEndpoint}`;
    }
    rawEndpoint = rawEndpoint.replace(/\/+$/, "");

    const b2Match = rawEndpoint.match(
      /(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)*s3\.([a-z0-9-]+)\.backblazeb2\.com/i,
    );
    if (b2Match) {
      region = region ?? b2Match[1];
      endpoint = `https://s3.${region}.backblazeb2.com`;
    } else {
      endpoint = rawEndpoint;
    }
  } else {
    region = region ?? "us-west-004";
    endpoint = `https://s3.${region}.backblazeb2.com`;
  }

  return {
    endpoint,
    region: region ?? "us-west-004",
    bucket,
    keyId,
    applicationKey,
  };
}

export class B2StorageAdapter implements StorageAdapter {
  readonly driver = "b2";
  private client: S3Client;
  private config: B2Config;

  constructor(customConfig?: Partial<B2Config>) {
    const base = resolveB2Config();
    this.config = { ...base, ...customConfig };

    this.client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.keyId,
        secretAccessKey: this.config.applicationKey,
      },
      forcePathStyle: true,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }

  /** Direct browser PUT upload URL with expiry */
  async getPresignedPutUrl(
    key: string,
    contentType: string,
    expiresInSec = B2_PRESIGN_PUT_EXPIRY_SEC,
  ): Promise<{ url: string; method: "PUT"; expiresInSeconds: number }> {
    const safeKey = sanitizeKey(key);
    try {
      const url = await getSignedUrl(
        this.client,
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: safeKey,
          ContentType: contentType,
        }),
        { expiresIn: expiresInSec },
      );
      return { url, method: "PUT", expiresInSeconds: expiresInSec };
    } catch (err) {
      console.error(`[b2-adapter] getPresignedPutUrl failed for "${safeKey}":`, err);
      throw new Error(`B2 presigned upload failed: ${(err as Error).message}`);
    }
  }

  /** Time-limited direct GET download URL with expiry */
  async getPresignedGetUrl(
    key: string,
    expiresInSec = B2_PRESIGN_GET_EXPIRY_SEC,
  ): Promise<{ url: string; method: "GET"; expiresInSeconds: number }> {
    const safeKey = sanitizeKey(key);
    try {
      const url = await getSignedUrl(
        this.client,
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: safeKey,
        }),
        { expiresIn: expiresInSec },
      );
      return { url, method: "GET", expiresInSeconds: expiresInSec };
    } catch (err) {
      console.error(`[b2-adapter] getPresignedGetUrl failed for "${safeKey}":`, err);
      throw new Error(`B2 presigned get failed: ${(err as Error).message}`);
    }
  }

  /** Upload object from server memory */
  async putObject(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string,
    options?: { contentEncoding?: string },
  ): Promise<void> {
    const safeKey = sanitizeKey(key);
    const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
    const encoding = options?.contentEncoding || (safeKey.endsWith(".gz") ? "gzip" : undefined);
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: safeKey,
          Body: buf,
          ContentType: contentType,
          ContentEncoding: encoding,
          ContentLength: buf.length,
          CacheControl: "private, max-age=31536000, immutable",
        }),
      );
    } catch (err) {
      console.error(`[b2-adapter] putObject failed for "${safeKey}":`, err);
      throw new Error(`B2 upload failed: ${(err as Error).message}`);
    }
  }

  /** Fetch object from private B2 as Buffer, or null if not found */
  async getObject(
    key: string,
  ): Promise<{ data: Buffer; contentType: string; contentEncoding?: string } | null> {
    const safeKey = sanitizeKey(key);
    try {
      const res = await this.client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: safeKey,
        }),
      );

      if (!res.Body) return null;

      const body = res.Body as unknown as
        | { transformToByteArray?: () => Promise<Uint8Array> }
        | AsyncIterable<Uint8Array>;

      let bytes: Uint8Array;
      if (
        typeof (body as { transformToByteArray?: unknown }).transformToByteArray ===
        "function"
      ) {
        bytes = await (
          body as { transformToByteArray: () => Promise<Uint8Array> }
        ).transformToByteArray();
      } else {
        const chunks: Uint8Array[] = [];
        for await (const chunk of body as AsyncIterable<Uint8Array>) {
          chunks.push(chunk);
        }
        bytes = Buffer.concat(chunks);
      }

      return {
        data: Buffer.from(bytes),
        contentType: res.ContentType || "application/octet-stream",
        contentEncoding: res.ContentEncoding,
      };
    } catch (err: unknown) {
      const anyErr = err as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (
        anyErr?.name === "NoSuchKey" ||
        anyErr?.name === "NotFound" ||
        anyErr?.$metadata?.httpStatusCode === 404
      ) {
        return null;
      }
      console.error(`[b2-adapter] getObject failed for "${safeKey}":`, err);
      throw new Error(`B2 fetch failed: ${(err as Error).message}`);
    }
  }

  /** Delete object from storage */
  async deleteObject(key: string): Promise<boolean> {
    const safeKey = sanitizeKey(key);
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: safeKey,
        }),
      );
      return true;
    } catch (err) {
      console.error(`[b2-adapter] deleteObject failed for "${safeKey}":`, err);
      return false;
    }
  }

  /** List objects with optional prefix */
  async listObjects(prefix?: string): Promise<string[]> {
    const keys: string[] = [];
    let token: string | undefined;

    try {
      do {
        const res = await this.client.send(
          new ListObjectsV2Command({
            Bucket: this.config.bucket,
            Prefix: prefix ? sanitizeKey(prefix) : undefined,
            ContinuationToken: token,
          }),
        );
        for (const item of res.Contents ?? []) {
          if (item.Key) keys.push(item.Key);
        }
        token = res.NextContinuationToken;
      } while (token);

      return keys;
    } catch (err) {
      console.error("[b2-adapter] listObjects failed:", err);
      throw new Error(`B2 list objects failed: ${(err as Error).message}`);
    }
  }

  /** Calculate total bytes and object count with pagination */
  async getBucketUsage(
    prefix?: string,
  ): Promise<{ totalBytes: number; objectCount: number }> {
    let totalBytes = 0;
    let objectCount = 0;
    let token: string | undefined;

    try {
      do {
        const res = await this.client.send(
          new ListObjectsV2Command({
            Bucket: this.config.bucket,
            Prefix: prefix ? sanitizeKey(prefix) : undefined,
            ContinuationToken: token,
          }),
        );
        for (const item of res.Contents ?? []) {
          totalBytes += item.Size ?? 0;
          objectCount += 1;
        }
        token = res.NextContinuationToken;
      } while (token);

      return { totalBytes, objectCount };
    } catch (err) {
      console.error("[b2-adapter] getBucketUsage failed:", err);
      throw new Error(`B2 bucket usage failed: ${(err as Error).message}`);
    }
  }

  /** Lightweight health check (ping) */
  async ping(): Promise<boolean> {
    try {
      await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.config.bucket,
          MaxKeys: 1,
        }),
      );
      return true;
    } catch (err) {
      console.warn("[b2-adapter] ping check failed:", (err as Error).message);
      return false;
    }
  }

  /**
   * Automatically applies CORS rules directly to Backblaze B2 bucket
   * using configured origins or user-provided list.
   */
  async ensureCorsRules(customOrigins?: string[]): Promise<{
    success: boolean;
    origins: string[];
    message?: string;
  }> {
    const origins = customOrigins ?? getCorsAllowedOrigins();
    try {
      await this.client.send(
        new PutBucketCorsCommand({
          Bucket: this.config.bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedOrigins: origins,
                AllowedMethods: ["PUT", "HEAD", "GET", "POST", "DELETE"],
                AllowedHeaders: ["*"],
                ExposeHeaders: ["ETag"],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        }),
      );
      return { success: true, origins };
    } catch (err) {
      console.warn(
        `[b2-adapter] Automatic PutBucketCors notice: ${(err as Error).message}`,
      );
      return { success: false, origins, message: (err as Error).message };
    }
  }

  /**
   * Generates formatted B2 Dashboard JSON for manual configuration.
   */
  getCorsRulesJson(customOrigins?: string[]): string {
    return getB2CorsRulesJson(customOrigins);
  }
}
