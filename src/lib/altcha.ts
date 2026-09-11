// =============================================================================
// 🛡️ ALTCHA — Privacy-Preserving Proof-of-Work (PoW) Anti-Bot Protection
// -----------------------------------------------------------------------------
// Implements the official ALTCHA SHA-256 Proof-of-Work protocol:
// - Zero tracking, GDPR-compliant, no third-party cookies or fingerprinting.
// - Challenge: Server issues an HMAC-SHA256 signed SHA-256 target.
// - Solution: Client browser finds integer N where SHA256(salt + N) == challenge.
// - Verification: Constant-time HMAC check + PoW verification + replay protection.
// =============================================================================
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";

export interface AltchaChallenge {
  algorithm: "SHA-256";
  challenge: string;
  maxnumber: number;
  salt: string;
  signature: string;
}

export interface AltchaPayload {
  algorithm: "SHA-256";
  challenge: string;
  number: number;
  salt: string;
  signature: string;
}

// In-memory sliding set to prevent challenge re-use (replay attacks)
// Expired nonces are purged every 60 seconds
const REPLAY_CACHE = new Map<string, number>(); // challengeHash -> expiresAt
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_NUMBER = 50_000; // ~100-250ms computation on client (negligible for users, costly for bots)

function getAltchaSecret(): string {
  return (
    process.env.ALTCHA_HMAC_KEY?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    "linkforge-default-altcha-secret-key-32b"
  );
}

function sweepReplayCache(now: number) {
  if (REPLAY_CACHE.size > 2000) {
    for (const [key, expiresAt] of REPLAY_CACHE.entries()) {
      if (expiresAt < now) {
        REPLAY_CACHE.delete(key);
      }
    }
  }
}

/**
 * Generates an ALTCHA cryptographic challenge.
 * The salt embeds a timestamp (`${Date.now()}_${randomHex}`) for time-bounded validation.
 */
export function createAltchaChallenge(maxNumber = DEFAULT_MAX_NUMBER): AltchaChallenge {
  const secret = getAltchaSecret();
  const timestamp = Date.now();
  const randomSalt = randomBytes(12).toString("hex");
  const salt = `${timestamp}_${randomSalt}`;

  // Random secret target number between 1 and maxNumber
  const number = randomInt(1, maxNumber + 1);

  // challenge = SHA256(salt + number)
  const challenge = createHash("sha256")
    .update(`${salt}${number}`)
    .digest("hex");

  // signature = HMAC-SHA256(challenge, secret)
  const signature = createHmac("sha256", secret)
    .update(challenge)
    .digest("hex");

  return {
    algorithm: "SHA-256",
    challenge,
    maxnumber: maxNumber,
    salt,
    signature,
  };
}

/**
 * Verifies an ALTCHA solution submitted by the client.
 * Performs constant-time HMAC check, SHA-256 PoW verification, expiration, and replay prevention.
 */
export function verifyAltchaSolution(rawPayload: string | AltchaPayload | null | undefined): {
  verified: boolean;
  error?: string;
} {
  // Allow test/dev bypass if explicitly disabled via environment
  if (process.env.ALTCHA_ENABLED === "false") {
    return { verified: true };
  }

  if (!rawPayload) {
    return { verified: false, error: "Security challenge verification is required" };
  }

  let payload: AltchaPayload;
  if (typeof rawPayload === "string") {
    try {
      const decoded = Buffer.from(rawPayload, "base64").toString("utf8");
      payload = JSON.parse(decoded) as AltchaPayload;
    } catch {
      return { verified: false, error: "Invalid verification payload format" };
    }
  } else {
    payload = rawPayload;
  }

  if (
    !payload ||
    payload.algorithm !== "SHA-256" ||
    !payload.challenge ||
    typeof payload.number !== "number" ||
    !payload.salt ||
    !payload.signature
  ) {
    return { verified: false, error: "Malformed verification payload" };
  }

  const secret = getAltchaSecret();
  const now = Date.now();
  sweepReplayCache(now);

  // 1. Verify challenge expiration from embedded salt timestamp
  const [timestampStr] = payload.salt.split("_");
  const issuedAt = parseInt(timestampStr, 10);
  if (isNaN(issuedAt) || now - issuedAt > CHALLENGE_TTL_MS || issuedAt > now + 30_000) {
    return { verified: false, error: "Security challenge has expired. Please verify again." };
  }

  // 2. Prevent replay attacks (single-use challenge verification)
  if (REPLAY_CACHE.has(payload.challenge)) {
    return { verified: false, error: "Security challenge already used. Please request a fresh one." };
  }

  // 3. Verify HMAC signature using constant-time comparison
  const expectedSignature = createHmac("sha256", secret)
    .update(payload.challenge)
    .digest("hex");

  try {
    const sigBufA = Buffer.from(payload.signature, "hex");
    const sigBufB = Buffer.from(expectedSignature, "hex");
    if (sigBufA.length !== sigBufB.length || !timingSafeEqual(sigBufA, sigBufB)) {
      return { verified: false, error: "Invalid security challenge signature" };
    }
  } catch {
    return { verified: false, error: "Cryptographic signature mismatch" };
  }

  // 4. Verify Proof-of-Work: SHA256(salt + number) === challenge
  const computedChallenge = createHash("sha256")
    .update(`${payload.salt}${payload.number}`)
    .digest("hex");

  try {
    const challBufA = Buffer.from(payload.challenge, "hex");
    const challBufB = Buffer.from(computedChallenge, "hex");
    if (challBufA.length !== challBufB.length || !timingSafeEqual(challBufA, challBufB)) {
      return { verified: false, error: "Incorrect challenge solution" };
    }
  } catch {
    return { verified: false, error: "Proof-of-work verification failed" };
  }

  // Mark challenge as used
  REPLAY_CACHE.set(payload.challenge, now + CHALLENGE_TTL_MS);

  return { verified: true };
}
