// =============================================================================
// 🔒 B2 & Local Storage Adapter Unit Tests
// Tests StorageAdapter contracts, config resolution, error handling, and helpers.
// =============================================================================
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolveB2Config } from "@/lib/storage/b2-adapter";
import { LocalStorageAdapter } from "@/lib/storage/local-adapter";
import { getStorageAdapter } from "@/lib/storage";

describe("resolveB2Config", () => {
  const origEnv = { ...process.env };

  beforeAll(() => {
    process.env.B2_BUCKET = "my-vault";
    process.env.B2_KEY_ID = "004key123";
    process.env.B2_APPLICATION_KEY = "K004app456";
    process.env.B2_ENDPOINT = "s3.us-east-005.backblazeb2.com";
  });

  afterAll(() => {
    process.env = origEnv;
  });

  it("sanitizes quotes and trims whitespace", () => {
    process.env.B2_BUCKET = '  "my-vault"  ';
    process.env.B2_KEY_ID = "  004key123  ";
    process.env.B2_APPLICATION_KEY = "  'K004app456'  ";
    process.env.B2_ENDPOINT = "s3.us-east-005.backblazeb2.com/";

    const config = resolveB2Config();
    expect(config.bucket).toBe("my-vault");
    expect(config.keyId).toBe("004key123");
    expect(config.applicationKey).toBe("K004app456");
    expect(config.endpoint).toBe("https://s3.us-east-005.backblazeb2.com");
    expect(config.region).toBe("us-east-005");
  });

  it("supports B2_BUCKET_NAME and B2_APPLICATION_KEY_ID aliases", () => {
    delete process.env.B2_BUCKET;
    delete process.env.B2_KEY_ID;
    delete process.env.B2_APPLICATION_KEY;

    process.env.B2_BUCKET_NAME = "my-alias-vault";
    process.env.B2_APPLICATION_KEY_ID = "alias-key-id";
    process.env.B2_APP_KEY = "alias-secret";

    const config = resolveB2Config();
    expect(config.bucket).toBe("my-alias-vault");
    expect(config.keyId).toBe("alias-key-id");
    expect(config.applicationKey).toBe("alias-secret");
  });
});

describe("LocalStorageAdapter", () => {
  const adapter = new LocalStorageAdapter();
  const testKey = `tests/unit-${Date.now()}.txt`;
  const content = Buffer.from("Hello LinkForge Private Storage!");

  it("puts and gets objects correctly", async () => {
    await adapter.putObject(testKey, content, "text/plain");

    const fetched = await adapter.getObject(testKey);
    expect(fetched).not.toBeNull();
    expect(fetched?.data.toString()).toBe("Hello LinkForge Private Storage!");
    expect(fetched?.contentType).toBe("text/plain");
  });

  it("returns null on missing object", async () => {
    const missing = await adapter.getObject("tests/non-existent-file-404.txt");
    expect(missing).toBeNull();
  });

  it("generates presigned urls with method", async () => {
    const putPresign = await adapter.getPresignedPutUrl(testKey, "text/plain", 600);
    expect(putPresign.method).toBe("PUT");
    expect(putPresign.expiresInSeconds).toBe(600);
    expect(putPresign.url).toContain(testKey);

    const getPresign = await adapter.getPresignedGetUrl(testKey, 300);
    expect(getPresign.method).toBe("GET");
    expect(getPresign.expiresInSeconds).toBe(300);
    expect(getPresign.url).toContain(testKey);
  });

  it("lists objects and calculates usage", async () => {
    const keys = await adapter.listObjects("tests");
    expect(keys).toContain(testKey);

    const usage = await adapter.getBucketUsage("tests");
    expect(usage.objectCount).toBeGreaterThanOrEqual(1);
    expect(usage.totalBytes).toBeGreaterThanOrEqual(content.length);
  });

  it("deletes objects cleanly", async () => {
    const deleted = await adapter.deleteObject(testKey);
    expect(deleted).toBe(true);

    const afterDelete = await adapter.getObject(testKey);
    expect(afterDelete).toBeNull();
  });
});

describe("getStorageAdapter factory", () => {
  it("returns an adapter implementing driver property", async () => {
    const adapter = await getStorageAdapter();
    expect(adapter).toBeDefined();
    expect(typeof adapter.driver).toBe("string");
    expect(typeof adapter.getPresignedPutUrl).toBe("function");
    expect(typeof adapter.putObject).toBe("function");
    expect(typeof adapter.getObject).toBe("function");
    expect(typeof adapter.deleteObject).toBe("function");
  });
});
