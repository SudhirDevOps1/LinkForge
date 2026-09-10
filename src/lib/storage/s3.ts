// =============================================================================
// ☁️ S3-Compatible Storage Factory — Backblaze B2, Cloudflare R2, AWS S3, MinIO
// Sab ek hi AWS SDK v3 client share karte hain (sirf endpoint/credentials alag).
// Presigned uploads supported → browser se seedha storage par upload (server
// bandwidth zero).
// =============================================================================
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { storageProvider } from "@/config/storage.config";
import { encryptFilePayload, isPayloadEncrypted } from "@/lib/file-cipher";
import type { StorageService } from "./index";
import { sanitizeKey } from "./index";

interface S3Env {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl?: string;
  forcePathStyle: boolean;
}

function clean(val: string | undefined): string | undefined {
  if (!val) return undefined;
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s || undefined;
}

/**
 * Private B2 bucket (free tier) — public URL kaam nahi karta, app proxy
 * (/api/file/...) stream karta hai. Sirf b2 + B2_PRIVATE_BUCKET=true par on.
 */
export const isPrivateB2 =
  storageProvider === "b2" &&
  ["true", "1", "yes"].includes(
    (clean(process.env.B2_PRIVATE_BUCKET) ?? clean(process.env.B2_IS_PRIVATE) ?? "").toLowerCase(),
  );

function resolveEnv(): S3Env {
  switch (storageProvider) {
    case "b2": {
      const bucket = clean(process.env.B2_BUCKET_NAME) ?? clean(process.env.B2_BUCKET);
      const keyId =
        clean(process.env.B2_APPLICATION_KEY_ID) ??
        clean(process.env.B2_KEY_ID) ??
        clean(process.env.B2_ACCESS_KEY_ID);
      const secretKey =
        clean(process.env.B2_APPLICATION_KEY) ??
        clean(process.env.B2_APP_KEY) ??
        clean(process.env.B2_SECRET_ACCESS_KEY);

      if (!bucket) {
        throw new Error("B2_BUCKET_NAME (ya B2_BUCKET) env var required hai (STORAGE_PROVIDER=b2)");
      }
      if (!keyId) {
        throw new Error("B2_APPLICATION_KEY_ID (ya B2_KEY_ID) env var required hai (STORAGE_PROVIDER=b2)");
      }
      if (!secretKey) {
        throw new Error("B2_APPLICATION_KEY (ya B2_APP_KEY) env var required hai (STORAGE_PROVIDER=b2)");
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
        accessKeyId: keyId,
        secretAccessKey: secretKey,
        publicBaseUrl: clean(process.env.B2_PUBLIC_URL),
        forcePathStyle: true,
      };
    }
    case "r2":
      return {
        endpoint: `https://${clean(required("R2_ACCOUNT_ID"))}.r2.cloudflarestorage.com`,
        region: "auto",
        bucket: clean(required("R2_BUCKET_NAME"))!,
        accessKeyId: clean(required("R2_ACCESS_KEY_ID"))!,
        secretAccessKey: clean(required("R2_SECRET_ACCESS_KEY"))!,
        publicBaseUrl: clean(process.env.R2_PUBLIC_URL),
        forcePathStyle: true,
      };
    case "minio":
      return {
        endpoint: clean(process.env.MINIO_ENDPOINT) ?? "http://localhost:9000",
        region: clean(process.env.MINIO_REGION) ?? "us-east-1",
        bucket: clean(required("MINIO_BUCKET_NAME"))!,
        accessKeyId: clean(process.env.MINIO_ACCESS_KEY) ?? "minioadmin",
        secretAccessKey: clean(process.env.MINIO_SECRET_KEY) ?? "minioadmin",
        publicBaseUrl: clean(process.env.MINIO_PUBLIC_URL),
        forcePathStyle: true,
      };
    default: // s3
      return {
        region: clean(process.env.AWS_REGION) ?? "us-east-1",
        bucket: clean(required("AWS_BUCKET_NAME"))!,
        accessKeyId: clean(required("AWS_ACCESS_KEY_ID"))!,
        secretAccessKey: clean(required("AWS_SECRET_ACCESS_KEY"))!,
        publicBaseUrl: clean(process.env.AWS_PUBLIC_URL),
        forcePathStyle: false,
      };
  }
}

function required(name: string): string {
  const value = clean(process.env[name]);
  if (!value) throw new Error(`${name} env var required hai (STORAGE_PROVIDER=${storageProvider})`);
  return value;
}

export function createS3Storage(): StorageService {
  const env = resolveEnv();
  const client = new S3Client({
    endpoint: env.endpoint,
    region: env.region,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
    forcePathStyle: env.forcePathStyle,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  const publicUrl = (key: string) => `/api/storage/file/${key}`;

  return {
    provider: storageProvider,
    async upload(data, key, contentType) {
      const safe = sanitizeKey(key);
      let buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
      if (!isPayloadEncrypted(buf)) {
        buf = encryptFilePayload(buf);
      }
      try {
        await client.send(
          new PutObjectCommand({
            Bucket: env.bucket,
            Key: safe,
            Body: buf,
            ContentType: contentType,
            ContentLength: buf.length,
            CacheControl: "public, max-age=31536000, immutable",
          }),
        );
      } catch (err) {
        console.error(`[storage:${storageProvider}] PutObject failed for key "${safe}":`, err);
        throw new Error(`Storage upload failed: ${(err as Error).message}`);
      }
      return { key: safe, url: publicUrl(safe) };
    },
    async delete(key) {
      const safe = sanitizeKey(key);
      try {
        await client.send(
          new DeleteObjectCommand({ Bucket: env.bucket, Key: safe }),
        );
      } catch (err) {
        console.error(`[storage:${storageProvider}] DeleteObject failed for key "${safe}":`, err);
        throw new Error(`Storage delete failed: ${(err as Error).message}`);
      }
    },
    getUrl: publicUrl,
    /** Proxy streaming: private bucket objects app route se serve hote hain */
    async stream(key, rangeHeader) {
      const safe = sanitizeKey(key);
      const res = await client.send(
        new GetObjectCommand({
          Bucket: env.bucket,
          Key: safe,
          ...(rangeHeader ? { Range: rangeHeader } : {}),
        }),
      );
      const body = res.Body as unknown as {
        transformToWebStream?: () => ReadableStream;
      } & AsyncIterable<Uint8Array>;
      let stream: ReadableStream;
      if (body && typeof body.transformToWebStream === "function") {
        stream = body.transformToWebStream();
      } else {
        const iter = body as AsyncIterable<Uint8Array>;
        stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of iter) controller.enqueue(chunk);
              controller.close();
            } catch (err) {
              controller.error(err);
            }
          },
        });
      }
      return {
        body: stream,
        contentType: res.ContentType,
        sizeBytes: res.ContentLength,
        contentRange: res.ContentRange ?? undefined,
      };
    },
    /** Complete-flow: object ka actual size/type (ticket verify ke liye) */
    async stat(key) {
      const safe = sanitizeKey(key);
      try {
        const head = await client.send(
          new HeadObjectCommand({ Bucket: env.bucket, Key: safe }),
        );
        return { sizeBytes: head.ContentLength ?? 0, contentType: head.ContentType };
      } catch (err) {
        console.error(`[storage:${storageProvider}] HeadObject failed for key "${safe}":`, err);
        throw new Error(`Storage stat failed: ${(err as Error).message}`);
      }
    },
    /** Complete-flow: pehle maxBytes (magic-byte signature check) */
    async readPrefix(key, maxBytes) {
      const safe = sanitizeKey(key);
      const n = Math.max(1, Math.min(maxBytes, 64 * 1024));
      try {
        const res = await client.send(
          new GetObjectCommand({ Bucket: env.bucket, Key: safe, Range: `bytes=0-${n - 1}` }),
        );
        const body = res.Body as unknown as
          | { transformToByteArray?: () => Promise<Uint8Array> }
          | AsyncIterable<Uint8Array>
          | undefined;
        if (body && typeof (body as { transformToByteArray?: unknown }).transformToByteArray === "function") {
          return await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
        }
        const chunks: Uint8Array[] = [];
        if (body && Symbol.asyncIterator in Object(body)) {
          for await (const chunk of body as AsyncIterable<Uint8Array>) chunks.push(chunk);
        }
        const total = chunks.reduce((s, c) => s + c.length, 0);
        const out = new Uint8Array(total);
        let off = 0;
        for (const c of chunks) {
          out.set(c, off);
          off += c.length;
        }
        return out;
      } catch (err) {
        console.error(`[storage:${storageProvider}] readPrefix failed for key "${safe}":`, err);
        throw new Error(`Storage read failed: ${(err as Error).message}`);
      }
    },
    /** Browser → storage direct upload (60s valid) */
    async getPresignedUploadUrl(key, contentType) {
      const safe = sanitizeKey(key);
      try {
        const url = await getSignedUrl(
          client,
          new PutObjectCommand({
            Bucket: env.bucket,
            Key: safe,
            ContentType: contentType,
          }),
          { expiresIn: 60 },
        );
        return { url, key: safe, publicUrl: publicUrl(safe) };
      } catch (err) {
        console.error(`[storage:${storageProvider}] getSignedUrl failed for key "${safe}":`, err);
        throw new Error(`Storage presign failed: ${(err as Error).message}`);
      }
    },
  };
}
