# 🔐 Enterprise Authentication Architecture

LinkForge incorporates an enterprise-grade, privacy-first authentication system built with [Better Auth](https://www.better-auth.com/) and Drizzle ORM. It provides passwordless biometric authentication, zero-cost authenticator two-factor verification, multi-tenant workspaces, proof-of-work bot defense, and dual-bucket rate limiting across both PostgreSQL and SQLite backends.

---

## 🏗️ Architecture Overview

All authentication providers and plugins map onto a unified, zero-knowledge encrypted database schema. Switching database engines (e.g. from local SQLite to Neon Serverless PostgreSQL) requires zero application code modifications.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LinkForge Client Layer                          │
│   (Next.js App Router · React 19 · Better Auth Client · Altcha Widget) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Security & Gatekeeper Layer                        │
│   • ALTCHA Proof-of-Work Verification (Zero third-party trackers)      │
│   • Dual-Bucket Sliding Window Rate Limiter (IP + Target Account)      │
│   • Constant-Time DUMMY_HASH Timing Attack Defense                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Better Auth Server Stack                         │
│   • Core Engine (/api/auth/[...all])                                   │
│   • Passkey Plugin (WebAuthn / FIDO2 Biometrics)                       │
│   • Two-Factor Plugin (TOTP Authenticator Apps + Backup Codes)         │
│   • Admin Plugin (RBAC, Impersonation, User Bans)                      │
│   • Anonymous Plugin (Guest Exploration -> Creator Conversion)         │
│   • Organization Plugin (Multi-Tenant Workspaces & Invites)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Drizzle ORM Dialect Adapter Layer                     │
│        Neon / Supabase / PostgreSQL   OR   Turso / Cloudflare D1       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Better Auth Plugins & Features

### 1. 🔑 Hardware Passkeys (`@better-auth/passkey`)
* **Standard**: FIDO2 / WebAuthn passwordless authentication.
* **Supported authenticators**: Apple Touch ID / Face ID, Windows Hello, Android Biometrics, and physical YubiKeys.
* **Security guarantee**: Phishing-resistant, private keys remain securely stored in hardware enclaves, zero password transmission over the wire.
* **Storage table**: `passkeys` (`credential_id`, `public_key`, `counter`, `transports`, `aaguid`).

### 2. 🛡️ Two-Factor Authentication (`twoFactor` with TOTP)
* **Standard**: RFC 6238 Time-based One-Time Password (TOTP).
* **Supported authenticators**: Google Authenticator, Microsoft Authenticator, 1Password, Bitwarden, Authy.
* **Zero SMS/Email dependency**: Completely free to operate with zero third-party messaging API costs.
* **Disaster recovery**: Automatically generates 10 single-use recovery backup codes for offline account recovery.
* **Storage table**: `two_factors` (`secret`, `backup_codes`, `verified`, `failed_verification_count`, `locked_until`).

### 3. 👥 Multi-Tenant Organizations (`organization`)
* **Workspaces**: Creators and businesses can manage multiple digital storefronts under dedicated team workspaces.
* **Role-Based Membership**: Team roles (`owner`, `admin`, `member`) with permission boundaries.
* **Email Invitations**: Secure time-limited invitation links with token expiration.
* **Storage tables**: `organizations`, `members`, `invitations`.

### 4. 🕵️‍♂️ Anonymous Guest Trials (`anonymous`)
* **Instant Exploration**: Prospective creators can instantly trial profile and link customizations without creating an account upfront.
* **Seamless Conversion**: When the user registers, Better Auth automatically links their guest profile, links, and customizations to their permanent credentials.

### 5. 👮‍♂️ Admin & Audit Controls (`admin`)
* **Role Management**: Assign `admin` privileges to manage platform moderation.
* **User Bans**: Apply temporary or permanent account bans with descriptive reason strings.
* **Session Impersonation**: Inspect and troubleshoot user profiles with tamper-evident audit logging via `impersonated_by`.

---

## 🛡️ Bot Defense & Rate Limiting

### ALTCHA Proof-of-Work (PoW)
* **Zero Tracking**: Replaces invasive CAPTCHAs with client-side SHA-256 cryptographic challenges.
* **Replay Protection**: Challenge signatures are tied to short expiration timestamps and single-use nonces.
* **Server Verification**: `POST /api/auth/altcha` validates solutions before sensitive authentication mutations are processed.

### Dual-Bucket Sliding Window Rate Limiting
* **IP Bucket**: Limits overall brute-force attempts from a single origin (default 10 requests / minute).
* **Account Bucket**: Locks the specific email address under attack regardless of distributed IP rotation (e.g. proxy botnets).
* **RFC Compliance**: Returns `429 Too Many Requests` with a standard `Retry-After: <seconds>` header.
* **Lockout UX**: The client-side login form displays a live 1-second interval cooldown banner with reactive button disabling.

### Timing Attack Defense
* When an unauthenticated request attempts to log in with a non-existent email address, the server performs a constant-time `DUMMY_HASH` comparison against a fixed bcrypt string. This eliminates timing side-channel attacks and prevents user enumeration.

---

## ⚙️ Configuration & Environment Variables

Add the following environment variables to your `.env` file:

```env
# =============================================================================
# 🔐 Better Auth Configuration
# =============================================================================
BETTER_AUTH_SECRET="your-super-secret-random-32-byte-key"
BETTER_AUTH_URL="https://your-domain.com"     # Or http://localhost:3000 in dev

# =============================================================================
# 🛡️ ALTCHA Proof-of-Work Bot Defense
# =============================================================================
ALTCHA_HMAC_KEY="your-hmac-secret-key-for-proof-of-work"

# =============================================================================
# 🚦 Rate Limiting (Optional Redis for Multi-Instance Deployments)
# =============================================================================
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

---

## 💾 Database Tables (Auth Subsystem)

The authentication system is supported by the following core tables (part of LinkForge's 21-table database):

| Table | Dialect Type | Description |
|---|---|---|
| `users` | PostgreSQL / SQLite | Core user entity (credentials, 2FA status, role, ban status) |
| `sessions` | PostgreSQL / SQLite | Active sessions, tokens, IP address, user agent, active organization |
| `accounts` | PostgreSQL / SQLite | Identity provider links and hashed credentials |
| `verifications` | PostgreSQL / SQLite | One-time verification tokens and expirations |
| `passkeys` | PostgreSQL / SQLite | WebAuthn credentials, public keys, and device authenticators |
| `two_factors` | PostgreSQL / SQLite | Encrypted TOTP secrets and offline backup codes |
| `organizations` | PostgreSQL / SQLite | Multi-tenant team workspace metadata |
| `members` | PostgreSQL / SQLite | Workspace memberships and role assignments |
| `invitations` | PostgreSQL / SQLite | Pending workspace team invites |

---

## 🚀 Client-Side SDK Usage

Import the typed client anywhere in your React components:

```tsx
import { authClient } from "@/lib/auth/auth-client";

// 1. Passwordless Passkey Sign-In
await authClient.signIn.passkey();

// 2. Email & Password Sign-In
await authClient.signIn.email({
  email: "creator@example.com",
  password: "secure-password",
});

// 3. Two-Factor Verification
await authClient.twoFactor.verifyTotp({
  code: "123456",
});

// 4. Anonymous Exploration
await authClient.signIn.anonymous();
```
