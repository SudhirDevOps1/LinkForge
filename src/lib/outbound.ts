// =============================================================================
// 🛡️ Outbound Fetch Guard — SSRF protection for server-side HTTP calls
// (webhooks, avatar proxy, public-profile importer, ...)
// -----------------------------------------------------------------------------
// Rules (fail-closed):
//   1. Sirf `https:` URLs (http allowed only with { allowHttp: true } — dev).
//   2. Koi redirect follow nahi (`redirect: "manual"` + 3xx = failure).
//      Redirects SSRF bypass ka classic tareeka hain.
//   3. Private/metadata targets block: localhost, *.local, *.internal,
//      169.254.169.254 (cloud metadata), 10/8, 172.16/12, 192.168/16,
//      127/8, 169.254/16, ::1, fc00::/7 (unique-local), fe80::/10 (link-local).
//   4. Hostname DNS-pin: resolve karke HAR resolved IP check hoti hai
//      (DNS-rebinding se bachne ke liye), sirf pehli nahi.
//   5. Default 5s timeout (AbortController).
// =============================================================================
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class UnsafeOutboundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeOutboundError";
  }
}

/** IPv4 private/loopback/link-local/metadata check (pure, unit-testable) */
export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true; // malformed = unsafe
  }
  const [a, b] = parts as [number, number, number, number];
  return (
    a === 10 || // 10/8
    (a === 172 && b >= 16 && b <= 31) || // 172.16/12
    (a === 192 && b === 168) || // 192.168/16
    a === 127 || // 127/8 loopback
    (a === 169 && b === 254) // 169.254/16 link-local + cloud metadata
  );
}

/** IPv6 unsafe check (pure, unit-testable) */
export function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" || // loopback
    lower === "::" || // unspecified
    lower.startsWith("fc") || // fc00::/7 unique-local
    lower.startsWith("fd") || // fd00::/8 unique-local
    lower.startsWith("fe80") || // fe80::/10 link-local
    lower.startsWith("ff") // multicast
  );
}

export function isPrivateIp(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return isPrivateIPv4(ip);
  if (family === 6) return isPrivateIPv6(ip);
  return true; // not an IP literal = unsafe until DNS-checked
}

const BLOCKED_SUFFIXES = [".local", ".localhost", ".internal", ".invalid"];
const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal"]);

/** Hostname-level blocklist (DNS se pehle, cheap) */
export function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTS.has(h)) return true;
  return BLOCKED_SUFFIXES.some((s) => h.endsWith(s));
}

/**
 * URL ko synchronously validate karo (scheme + hostname blocklist + IP literal).
 * DNS wali check ke liye `resolveAndAssertSafe()` use karo.
 */
export function assertSafeOutboundUrl(
  rawUrl: string,
  opts?: { allowHttp?: boolean },
): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeOutboundError("Invalid outbound URL");
  }
  if (url.protocol === "https:") {
    // ok
  } else if (url.protocol === "http:" && opts?.allowHttp) {
    // dev-only opt-in
  } else {
    throw new UnsafeOutboundError("Outbound URL must be https");
  }
  if (url.username || url.password) {
    throw new UnsafeOutboundError("Outbound URL must not contain credentials");
  }
  if (isBlockedHostname(url.hostname)) {
    throw new UnsafeOutboundError(`Blocked outbound host: ${url.hostname}`);
  }
  if (isIP(url.hostname) !== 0 && isPrivateIp(url.hostname)) {
    throw new UnsafeOutboundError(`Private outbound IP blocked: ${url.hostname}`);
  }
  return url;
}

/**
 * DNS-pin + assert: hostname ke SAARE resolved IPs private-range check se
 * guzarte hain. Fail-closed: DNS error = blocked.
 */
export async function resolveAndAssertSafe(
  rawUrl: string,
  opts?: { allowHttp?: boolean },
): Promise<URL> {
  const url = assertSafeOutboundUrl(rawUrl, opts);
  if (isIP(url.hostname) !== 0) return url; // literal already checked
  let records: Array<{ address: string }>;
  try {
    records = await lookup(url.hostname, { all: true });
  } catch {
    throw new UnsafeOutboundError(`DNS resolve failed (blocked): ${url.hostname}`);
  }
  if (records.length === 0) {
    throw new UnsafeOutboundError(`No DNS records (blocked): ${url.hostname}`);
  }
  for (const r of records) {
    if (isPrivateIp(r.address)) {
      throw new UnsafeOutboundError(
        `DNS-pinned private IP blocked: ${url.hostname} → ${r.address}`,
      );
    }
  }
  return url;
}

export interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number;
  allowHttp?: boolean;
  followSafeRedirects?: boolean;
  maxRedirects?: number;
}

/**
 * SSRF-safe fetch: https-only, DNS-pinned, timeout.
 * If followSafeRedirects is enabled, safe 1-2 hop redirects are followed
 * after resolving and verifying each destination IP for SSRF safety (e.g. Google Apps Script).
 */
export async function safeFetch(
  rawUrl: string,
  init?: SafeFetchOptions,
): Promise<Response> {
  const { timeoutMs = 5_000, allowHttp, followSafeRedirects = false, maxRedirects = 2, ...fetchInit } = init ?? {};
  let currentUrl = await resolveAndAssertSafe(rawUrl, { allowHttp });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let redirectsCount = 0;
    while (true) {
      const res = await fetch(currentUrl.toString(), {
        ...fetchInit,
        redirect: "manual",
        signal: controller.signal,
        cache: "no-store",
      });

      if (res.status >= 300 && res.status < 400) {
        if (!followSafeRedirects) {
          throw new UnsafeOutboundError(`Redirect blocked (status ${res.status}): ${currentUrl.host}`);
        }
        redirectsCount++;
        if (redirectsCount > maxRedirects) {
          throw new UnsafeOutboundError(`Too many redirects (max ${maxRedirects})`);
        }
        const location = res.headers.get("location");
        if (!location) {
          throw new UnsafeOutboundError(`Redirect without Location header: status ${res.status}`);
        }
        // Resolve relative or absolute target and assert destination IP safety
        const nextUrlObj = new URL(location, currentUrl);
        currentUrl = await resolveAndAssertSafe(nextUrlObj.toString(), { allowHttp });
        continue;
      }

      return res;
    }
  } finally {
    clearTimeout(timeout);
  }
}
