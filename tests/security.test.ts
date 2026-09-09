// =============================================================================
// 🛡️ LinkForge Security Test Suite — 40+ assertions
// Run: npx vitest run
//
// Covers: crypto primitives, input validation (Zod), rate limiting, UA parsing,
// webhook signatures, slug safety, sanitization helpers.
// =============================================================================
import { describe, expect, it } from "vitest";
import { parseUserAgent } from "@/lib/analytics";
import {
  hashIp,
  hmacSha256Hex,
  randomToken,
  safeEqualHex,
  sha256Hex,
  slugify,
  verifyWebhookSignature,
} from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeKey, newKey } from "@/lib/storage";
import {
  apiKeySchema,
  importSchema,
  linkCreateSchema,
  loginSchema,
  profileUpdateSchema,
  reorderSchema,
  resetSchema,
  signupSchema,
  webhookSchema,
} from "@/lib/validations";

// ---- 1. Crypto primitives ------------------------------------------------------
describe("crypto primitives", () => {
  it("sha256Hex produces 64-char hex", () => {
    expect(sha256Hex("hello")).toMatch(/^[a-f0-9]{64}$/);
  });
  it("sha256Hex is deterministic", () => {
    expect(sha256Hex("abc")).toBe(sha256Hex("abc"));
  });
  it("sha256Hex differs per input", () => {
    expect(sha256Hex("abc")).not.toBe(sha256Hex("abd"));
  });
  it("randomToken generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => randomToken()));
    expect(tokens.size).toBe(50);
  });
  it("randomToken default length is 64 hex chars (32 bytes)", () => {
    expect(randomToken()).toMatch(/^[a-f0-9]{64}$/);
  });
  it("safeEqualHex matches identical values", () => {
    expect(safeEqualHex("deadbeef", "deadbeef")).toBe(true);
  });
  it("safeEqualHex rejects different values", () => {
    expect(safeEqualHex("deadbeef", "deadbee0")).toBe(false);
  });
  it("safeEqualHex rejects different lengths (no throw)", () => {
    expect(safeEqualHex("abc", "abcdef")).toBe(false);
  });
  it("hashIp never contains raw IP", () => {
    const hashed = hashIp("203.0.113.99");
    expect(hashed).not.toContain("203.0.113.99");
    expect(hashed).toMatch(/^[a-f0-9]{32}$/);
  });
  it("hashIp is stable for same IP", () => {
    expect(hashIp("10.0.0.1")).toBe(hashIp("10.0.0.1"));
  });
  it("hashIp differs for different IPs", () => {
    expect(hashIp("10.0.0.1")).not.toBe(hashIp("10.0.0.2"));
  });
});

// ---- 2. Slug safety -------------------------------------------------------------
describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Aarav Sharma")).toBe("aarav-sharma");
  });
  it("strips XSS payloads", () => {
    expect(slugify('<script>alert("xss")</script>')).not.toContain("<");
    expect(slugify('<script>alert("xss")</script>')).not.toContain('"');
  });
  it("removes special characters", () => {
    expect(slugify("hello!!@@##world$$")).toBe("hello-world");
  });
  it("trims leading/trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });
  it("caps length at 39 chars", () => {
    expect(slugify("a".repeat(100)).length).toBeLessThanOrEqual(39);
  });
  it("handles unicode names", () => {
    expect(slugify("José García")).toBe("jose-garcia");
  });
  it("returns empty string for pure symbols", () => {
    expect(slugify("!!!###")).toBe("");
  });
});

// ---- 3. Webhook signatures ---------------------------------------------------------
describe("webhook signatures", () => {
  const secret = "test-secret";
  const body = JSON.stringify({ event: "click", linkId: "123" });

  it("HMAC signature is 64-char hex", () => {
    expect(hmacSha256Hex(secret, body)).toMatch(/^[a-f0-9]{64}$/);
  });
  it("valid signature verifies", () => {
    const sig = hmacSha256Hex(secret, body);
    expect(verifyWebhookSignature(secret, body, sig)).toBe(true);
  });
  it("tampered body fails verification", () => {
    const sig = hmacSha256Hex(secret, body);
    expect(verifyWebhookSignature(secret, body + " ", sig)).toBe(false);
  });
  it("wrong secret fails verification", () => {
    const sig = hmacSha256Hex(secret, body);
    expect(verifyWebhookSignature("wrong-secret", body, sig)).toBe(false);
  });
});

// ---- 4. Input validation (Zod) -------------------------------------------------------
describe("validation — auth", () => {
  it("signup rejects weak password (no number)", () => {
    expect(
      signupSchema.safeParse({ name: "A", email: "a@b.co", password: "onlyletters" }).success,
    ).toBe(false);
  });
  it("signup rejects short password", () => {
    expect(
      signupSchema.safeParse({ name: "A", email: "a@b.co", password: "ab1" }).success,
    ).toBe(false);
  });
  it("signup rejects invalid email", () => {
    expect(
      signupSchema.safeParse({ name: "A", email: "not-an-email", password: "abcd1234" }).success,
    ).toBe(false);
  });
  it("signup accepts valid input and lowercases email", () => {
    const parsed = signupSchema.safeParse({
      name: "Aarav",
      email: "AARAV@Example.com",
      password: "abcd1234",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("aarav@example.com");
  });
  it("login requires password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
  it("reset rejects short token", () => {
    expect(resetSchema.safeParse({ token: "short", password: "abcd1234" }).success).toBe(false);
  });
});

describe("validation — profile", () => {
  it("rejects slug with uppercase", () => {
    expect(profileUpdateSchema.safeParse({ slug: "MySlug" }).success).toBe(false);
  });
  it("rejects slug starting with hyphen", () => {
    expect(profileUpdateSchema.safeParse({ slug: "-bad-slug" }).success).toBe(false);
  });
  it("rejects too-short slug", () => {
    expect(profileUpdateSchema.safeParse({ slug: "ab" }).success).toBe(false);
  });
  it("accepts valid slug", () => {
    expect(profileUpdateSchema.safeParse({ slug: "aarav-kapoor" }).success).toBe(true);
  });
  it("rejects bio over 300 chars", () => {
    expect(profileUpdateSchema.safeParse({ bio: "x".repeat(301) }).success).toBe(false);
  });
  it("rejects invalid custom domain", () => {
    expect(profileUpdateSchema.safeParse({ customDomain: "not a domain!" }).success).toBe(false);
  });
  it("accepts valid custom domain", () => {
    expect(profileUpdateSchema.safeParse({ customDomain: "bio.example.com" }).success).toBe(true);
  });
  it("rejects invalid layout", () => {
    expect(profileUpdateSchema.safeParse({ layout: "grid9000" }).success).toBe(false);
  });
});

describe("validation — links", () => {
  it("rejects javascript: URLs (XSS vector)", () => {
    expect(
      linkCreateSchema.safeParse({ title: "x", url: "javascript:alert(1)" }).success,
    ).toBe(false);
  });
  it("rejects data: URLs", () => {
    expect(
      linkCreateSchema.safeParse({ title: "x", url: "data:text/html,<script>" }).success,
    ).toBe(false);
  });
  it("accepts https URLs", () => {
    expect(
      linkCreateSchema.safeParse({ title: "Site", url: "https://example.com" }).success,
    ).toBe(true);
  });
  it("accepts mailto: links", () => {
    expect(
      linkCreateSchema.safeParse({ title: "Mail", url: "mailto:a@b.co" }).success,
    ).toBe(true);
  });
  it("rejects missing title", () => {
    expect(linkCreateSchema.safeParse({ url: "https://example.com" }).success).toBe(false);
  });
  it("rejects invalid link type", () => {
    expect(
      linkCreateSchema.safeParse({ title: "x", url: "https://x.co", type: "malware" }).success,
    ).toBe(false);
  });
  it("rejects invalid bento size", () => {
    expect(
      linkCreateSchema.safeParse({ title: "x", url: "https://x.co", size: "huge" }).success,
    ).toBe(false);
  });
});

describe("validation — webhooks / keys / import", () => {
  it("webhook rejects non-url", () => {
    expect(webhookSchema.safeParse({ url: "not-a-url" }).success).toBe(false);
  });
  it("webhook accepts https endpoint", () => {
    expect(webhookSchema.safeParse({ url: "https://hooks.example.com/x" }).success).toBe(true);
  });
  it("api key name required", () => {
    expect(apiKeySchema.safeParse({ name: "" }).success).toBe(false);
  });
  it("reorder rejects non-uuid ids", () => {
    expect(reorderSchema.safeParse({ ids: ["not-a-uuid"] }).success).toBe(false);
  });
  it("import rejects wrong version", () => {
    expect(
      importSchema.safeParse({ version: 2, profile: { displayName: "x" }, links: [] }).success,
    ).toBe(false);
  });
  it("import rejects oversized link arrays", () => {
    const links = Array.from({ length: 501 }, () => ({ title: "t", url: "https://x.co" }));
    expect(
      importSchema.safeParse({ version: 1, profile: { displayName: "x" }, links }).success,
    ).toBe(false);
  });
});

// ---- 5. Rate limiting ------------------------------------------------------------------
describe("rate limiting", () => {
  it("allows requests under the limit", async () => {
    const r1 = await rateLimit(`test:${Date.now()}-a`, 3, 10_000);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);
  });
  it("blocks requests over the limit", async () => {
    const key = `test:${Date.now()}-b`;
    await rateLimit(key, 2, 10_000);
    await rateLimit(key, 2, 10_000);
    const r3 = await rateLimit(key, 2, 10_000);
    expect(r3.success).toBe(false);
    expect(r3.remaining).toBe(0);
  });
  it("resets after the window", async () => {
    const key = `test:${Date.now()}-c`;
    await rateLimit(key, 1, 1);
    await new Promise((r) => setTimeout(r, 5));
    const r = await rateLimit(key, 1, 1);
    expect(r.success).toBe(true);
  });
  it("returns sane headers metadata", async () => {
    const r = await rateLimit(`test:${Date.now()}-d`, 100, 60_000);
    expect(r.limit).toBe(100);
    expect(r.resetAt).toBeGreaterThan(Date.now());
  });
});

// ---- 6. UA parsing (analytics privacy) -----------------------------------------------------
describe("user-agent parsing", () => {
  it("detects mobile", () => {
    expect(
      parseUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605").device,
    ).toBe("Mobile");
  });
  it("detects desktop", () => {
    expect(
      parseUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0").device,
    ).toBe("Desktop");
  });
  it("detects tablets", () => {
    expect(parseUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0) Safari/605").device).toBe("Tablet");
  });
  it("detects curl as bot", () => {
    expect(parseUserAgent("curl/8.4.0").browser).toBe("Bot");
  });
  it("detects Chrome", () => {
    expect(
      parseUserAgent("Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36").browser,
    ).toBe("Chrome");
  });
  it("detects Windows vs macOS vs Android", () => {
    expect(parseUserAgent("Windows NT 10.0 Chrome/120").os).toBe("Windows");
    expect(parseUserAgent("Macintosh; Intel Mac OS X 14_0").os).toBe("macOS");
    expect(parseUserAgent("Linux; Android 14; Pixel 8").os).toBe("Android");
  });
});

// ---- 7. Storage key sanitization -------------------------------------------------------------
describe("storage key sanitization", () => {
  it("blocks path traversal", () => {
    expect(() => sanitizeKey("../../etc/passwd")).toThrow();
  });
  it("blocks encoded traversal", () => {
    expect(() => sanitizeKey("avatars/..%2f..%2fsecret")).toThrow();
  });
  it("accepts normal keys", () => {
    expect(sanitizeKey("avatars/1234-abcd.png")).toBe("avatars/1234-abcd.png");
  });
  it("strips leading slashes", () => {
    expect(sanitizeKey("/avatars/x.png")).toBe("avatars/x.png");
  });
  it("newKey contains folder and extension", () => {
    const key = newKey("avatars", "png");
    expect(key.startsWith("avatars/")).toBe(true);
    expect(key.endsWith(".png")).toBe(true);
  });
  it("newKey strips dangerous extension chars", () => {
    expect(newKey("avatars", "p'><svg")).toMatch(/^avatars\/.+\.psvg$/);
  });
});
