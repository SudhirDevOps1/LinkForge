// =============================================================================
// 🩹 NEXT-PATCH Phase E tests — SSRF guard (pure unit, no network/DNS)
// Run: npx vitest run tests/patch-e.test.ts
// =============================================================================
import { describe, expect, it } from "vitest";
import {
  UnsafeOutboundError,
  assertSafeOutboundUrl,
  isBlockedHostname,
  isPrivateIPv4,
  isPrivateIPv6,
} from "@/lib/outbound";

describe("E1 private IPv4 ranges", () => {
  it.each(["10.0.0.1", "172.16.0.1", "172.31.255.255", "192.168.1.1", "127.0.0.1", "169.254.169.254"])(
    "blocks %s",
    (ip) => expect(isPrivateIPv4(ip)).toBe(true),
  );
  it.each(["8.8.8.8", "1.1.1.1", "172.15.255.255", "172.32.0.1"])(
    "allows %s",
    (ip) => expect(isPrivateIPv4(ip)).toBe(false),
  );
});

describe("E1 IPv6 + hostnames", () => {
  it("blocks loopback/unique-local/link-local", () => {
    expect(isPrivateIPv6("::1")).toBe(true);
    expect(isPrivateIPv6("fc00::1")).toBe(true);
    expect(isPrivateIPv6("fe80::1")).toBe(true);
  });
  it("blocks localhost-ish hostnames", () => {
    expect(isBlockedHostname("localhost")).toBe(true);
    expect(isBlockedHostname("x.local")).toBe(true);
    expect(isBlockedHostname("meta.internal")).toBe(true);
    expect(isBlockedHostname("example.com")).toBe(false);
  });
});

describe("E1 assertSafeOutboundUrl (no DNS)", () => {
  it("rejects http by default", () => {
    expect(() => assertSafeOutboundUrl("http://example.com/x")).toThrowError(UnsafeOutboundError);
  });
  it("rejects private IP literals", () => {
    expect(() => assertSafeOutboundUrl("https://169.254.169.254/latest")).toThrowError(
      UnsafeOutboundError,
    );
    expect(() => assertSafeOutboundUrl("https://127.0.0.1/admin")).toThrowError(
      UnsafeOutboundError,
    );
  });
  it("rejects credentials in URL", () => {
    expect(() => assertSafeOutboundUrl("https://user:pass@example.com/")).toThrowError(
      UnsafeOutboundError,
    );
  });
  it("accepts public https URL shape", () => {
    const url = assertSafeOutboundUrl("https://example.com/hook");
    expect(url.host).toBe("example.com");
  });
});
