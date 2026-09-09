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

/**
 * Private B2 bucket (free tier) — public URL kaam nahi karta, app proxy
 * (/api/file/...) stream karta hai. Sirf b2 + B2_PRIVATE_BUCKET=true par on.
 */
export const isPrivateB2 =
  storageProvider === "b2" &&
  (process.env.B2_PRIVATE_BUCKET ?? "").trim().toLowerCase() === "true";

function resolveEnv(): S3Env {
  switch (storageProvider) {
    case "b2":
      return {
        endpoint:
          process.env.B2_ENDPOINT ??
          `https://s3.${process.env.B2_REGION ?? "us-west-004"}.backblazeb2.com`,
        region: process.env.B2_REGION ?? "us-west-004",
        bucket: required("B2_BUCKET_NAME"),
        accessKeyId: required("B2_APPLICATION_KEY_ID"),
        secretAccessKey: required("B2_APPLICATION_KEY"),
        publicBaseUrl: process.env.B2_PUBLIC_URL,
        forcePathStyle: true,
      };
    case "r2":
      return {
        endpoint: `https://${required("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
        region: "auto",
        bucket: required("R2_BUCKET_NAME"),
        accessKeyId: required("R2_ACCESS_KEY_ID"),
        secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
        publicBaseUrl: process.env.R2_PUBLIC_URL,
        forcePathStyle: true,
      };
    case "minio":
      return {
        endpoint: process.env.MINIO_ENDPOINT ?? "http://localhost:9000",
        region: process.env.MINIO_REGION ?? "us-east-1",
        bucket: required("MINIO_BUCKET_NAME"),
        accessKeyId: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
        secretAccessKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
        publicBaseUrl: process.env.MINIO_PUBLIC_URL,
        forcePathStyle: true,
      };
    default: // s3
      return {
        region: process.env.AWS_REGION ?? "us-east-1",
        bucket: required("AWS_BUCKET_NAME"),
        accessKeyId: required("AWS_ACCESS_KEY_ID"),
        secretAccessKey: required("AWS_SECRET_ACCESS_KEY"),
        publicBaseUrl: process.env.AWS_PUBLIC_URL,
        forcePathStyle: false,
      };
  }
}

function required(name: string): string {
  const value = process.env[name];
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
  });

  const publicUrl = (key: string) =>
    // Private B2 bucket (free tier): public URL 403 dega — isliye app proxy
    // (/api/file/...) se serve hota hai. Public buckets par seedha B2 URL.
    isPrivateB2
      ? `/api/file/${key}`
      : env.publicBaseUrl
        ? `${env.publicBaseUrl.replace(/\/$/, "")}/${key}`
        : `${(env.endpoint ?? `https://s3.${env.region}.amazonaws.com`).replace(/\/$/, "")}/${env.bucket}/${key}`;

  return {
    provider: storageProvider,
    async upload(data, key, contentType) {
      const safe = sanitizeKey(key);
      await client.send(
        new PutObjectCommand({
          Bucket: env.bucket,
          Key: safe,
          Body: data,
          ContentType: contentType,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      return { key: safe, url: publicUrl(safe) };
    },
    async delete(key) {
      await client.send(
        new DeleteObjectCommand({ Bucket: env.bucket, Key: sanitizeKey(key) }),
      );
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
      const head = await client.send(
        new HeadObjectCommand({ Bucket: env.bucket, Key: safe }),
      );
      return { sizeBytes: head.ContentLength ?? 0, contentType: head.ContentType };
    },
    /** Complete-flow: pehle maxBytes (magic-byte signature check) */
    async readPrefix(key, maxBytes) {
      const safe = sanitizeKey(key);
      const n = Math.max(1, Math.min(maxBytes, 64 * 1024));
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
    },
    /** Browser → storage direct upload (60s valid) */
    async getPresignedUploadUrl(key, contentType) {
      const safe = sanitizeKey(key);
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
    },
  };
}
