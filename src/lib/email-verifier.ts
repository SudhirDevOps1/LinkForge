// =============================================================================
// 📧 Email Verifier — MX DNS & Disposable Email Verification Utility
// -----------------------------------------------------------------------------
// 1. Strict RFC email format validation
// 2. Comprehensive blocklist of temporary / throwaway email providers
// 3. Real Node.js DNS MX record lookup (dns.promises.resolveMx)
// =============================================================================
import dns from "dns";

// High-speed reliable public DNS resolvers (Google + Cloudflare)
const resolver = new dns.promises.Resolver();
try {
  resolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {
  // Graceful fallback to system default
}

// Common temporary & disposable email domains (blocklist)
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "10minmail.com",
  "tempmail.com",
  "temp-mail.org",
  "tempmail.net",
  "tempmail.io",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "mailinator.com",
  "mailinator2.com",
  "throwawaymail.com",
  "yopmail.com",
  "yopmail.net",
  "sharklasers.com",
  "dispostable.com",
  "getairmail.com",
  "mohmal.com",
  "trashmail.com",
  "trashmail.net",
  "burnermail.io",
  "fakeinbox.com",
  "crazymailing.com",
  "mytemp.email",
  "generator.email",
  "inboxbear.com",
  "fakemailgenerator.com",
  "emailondeck.com",
  "nada.ltd",
  "getnada.com",
  "tempinbox.com",
  "maildrop.cc",
  "harakirimail.com",
  "tempr.email",
  "discard.email",
  "spambog.com",
  "mailnesia.com",
  "guerrillamail.biz",
  "guerrillamail.de",
  "grr.la",
  "pokemail.net",
  "spam4.me",
  "bccto.me",
  "chacuo.net",
  "0-mail.com",
  "mytempemail.com",
  "instantemailaddress.com",
  "anonymbox.com",
  "jetable.org",
  "kasmail.com",
]);

/**
 * Checks if domain matches disposable patterns or known blocklist
 */
export function isDisposableDomain(domain: string): boolean {
  const d = domain.toLowerCase().trim();
  if (DISPOSABLE_DOMAINS.has(d)) return true;

  // Subdomain matching (e.g. *.mailinator.com)
  for (const blocked of DISPOSABLE_DOMAINS) {
    if (d.endsWith("." + blocked)) return true;
  }

  // Common disposable patterns
  if (
    d.includes("tempmail") ||
    d.includes("disposable") ||
    d.includes("throwaway") ||
    d.includes("10min") ||
    d.includes("trashmail") ||
    d.includes("fakeinbox")
  ) {
    return true;
  }

  return false;
}

export interface EmailVerificationResult {
  valid: boolean;
  email: string;
  domain?: string;
  reason?: string;
}

/**
 * Validates email format, checks disposable blocklist, and performs real DNS MX check.
 */
export async function verifyEmailMx(rawEmail: string): Promise<EmailVerificationResult> {
  const email = (rawEmail || "").trim().toLowerCase();

  // 1. Basic format / regex validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!email || !emailRegex.test(email) || email.length > 254) {
    return {
      valid: false,
      email,
      reason: "Invalid email format. Sahi email address enter karein.",
    };
  }

  const parts = email.split("@");
  if (parts.length !== 2) {
    return { valid: false, email, reason: "Invalid email format." };
  }

  const [localPart, domain] = parts;
  if (localPart.length > 64 || !domain || domain.indexOf(".") === -1) {
    return { valid: false, email, domain, reason: "Invalid email domain." };
  }

  // 2. Anti-Disposable Email Check
  if (isDisposableDomain(domain)) {
    return {
      valid: false,
      email,
      domain,
      reason: "Temporary / Disposable emails allowed nahi hain. Kripya apna real email use karein.",
    };
  }

  // 3. Real DNS MX Record Lookup via Google/Cloudflare high-speed resolver
  try {
    const mxLookup = resolver.resolveMx(domain);
    // Timeout promise (3500ms max)
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DNS_TIMEOUT")), 3500)
    );

    const mxRecords = (await Promise.race([mxLookup, timeout])) as dns.MxRecord[];

    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        email,
        domain,
        reason: `Domain "${domain}" par koi active mail server (MX) nahi mila.`,
      };
    }

    return {
      valid: true,
      email,
      domain,
    };
  } catch (err: unknown) {
    const msg = (err as Error)?.message;

    if (msg === "DNS_TIMEOUT") {
      // If DNS timed out on serverless cold start, gracefully allow
      return { valid: true, email, domain };
    }

    // Any DNS lookup failure (ENOTFOUND, ENODATA, ECONNREFUSED, ESERVFAIL, etc.)
    return {
      valid: false,
      email,
      domain,
      reason: `Email domain "${domain}" exist nahi karta ya is par mail receive nahi hoti.`,
    };
  }
}
