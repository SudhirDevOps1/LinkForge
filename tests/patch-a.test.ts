// =============================================================================
// 🩹 NEXT-PATCH Phase A tests — auth honesty + safety (pure unit, no DB)
// Run: npx vitest run tests/patch-a.test.ts
//
// Covers: salted IP hash (A2), strict CSRF Origin check (A4),
// mail adapter defaults (A3).
// =============================================================================
import { describe, expect, it } from "vitest";
import { ApiError, assertSameOrigin } from "@/lib/api";
import { hashIp, sha256Hex } from "@/lib/crypto";
import { deliverMail, getMailProvider, isSmtpConfigured } from "@/lib/mail";

// ---- A2: salted IP hash -------------------------------------------------------
describe("A2 salted IP hash", () => {
  it("hashIp uses AUTH_SECRET salt (sha256(salt::ip), 32 chars)", () => {
    process.env.AUTH_SECRET = "test-salt-123";
    expect(hashIp("1.2.3.4")).toBe(sha256Hex("test-salt-123::1.2.3.4").slice(0, 32));
  });
  it("hashIp differs from unsalted sha256(ip)", () => {
    process.env.AUTH_SECRET = "test-salt-123";
    expect(hashIp("1.2.3.4")).not.toBe(sha256Hex("1.2.3.4").slice(0, 32));
  });
  it("hashIp changes when AUTH_SECRET changes", () => {
    process.env.AUTH_SECRET = "salt-one";
    const a = hashIp("9.9.9.9");
    process.env.AUTH_SECRET = "salt-two";
    expect(hashIp("9.9.9.9")).not.toBe(a);
  });
});

// ---- A4: strict CSRF ----------------------------------------------------------
describe("A4 strict CSRF origin check", () => {
  const get = new Request("http://app.test/api/profile", { method: "GET" });
  it("GET passes without Origin", () => {
    expect(() => assertSameOrigin(get)).not.toThrow();
  });
  it("POST without Origin throws 403", () => {
    const req = new Request("http://app.test/api/profile", { method: "POST" });
    try {
      assertSameOrigin(req);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(403);
    }
  });
  it("POST with mismatched Origin throws 403", () => {
    const req = new Request("http://app.test/api/profile", {
      method: "POST",
      headers: { origin: "https://evil.test", host: "app.test" },
    });
    expect(() => assertSameOrigin(req)).toThrowError(ApiError);
  });
  it("POST with matching Origin+host passes", () => {
    const req = new Request("http://app.test/api/profile", {
      method: "POST",
      headers: { origin: "http://app.test", host: "app.test" },
    });
    expect(() => assertSameOrigin(req)).not.toThrow();
  });
});

// ---- A3: mail adapter ---------------------------------------------------------
describe("A3 mail adapter", () => {
  it("defaults to console provider", () => {
    delete process.env.MAIL_PROVIDER;
    expect(getMailProvider()).toBe("console");
  });
  it("SMTP not configured without env", () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    expect(isSmtpConfigured()).toBe(false);
  });
  it("console delivery returns true (dev-friendly)", async () => {
    delete process.env.MAIL_PROVIDER;
    const ok = await deliverMail({
      id: "test",
      toEmail: "a@b.c",
      subject: "hi",
      body: "hello",
    });
    expect(ok).toBe(true);
  });
});
