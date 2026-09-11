# 🛡️ Enterprise Security Model & Privacy Architecture

LinkForge is engineered with a **defense-in-depth security posture**. Every entry point, mutation handler, and storage interface is hardened against modern attack vectors, credential stuffing, and bot scraping.

---

## 🔒 Threat Mitigation Matrix

| Threat Category | Attack Vector | LinkForge Mitigation |
|---|---|---|
| **Bot Automation & Brute-Force** | Automated credential stuffing & account spam | **ALTCHA Proof-of-Work (PoW)** cryptographic challenges on login and signup. |
| **Distributed Credential Stuffing**| Rotating proxy networks targeting single accounts | **Dual-Bucket Sliding Window Rate Limiting** tracking both source IP and target email. |
| **Username Enumeration** | Timing discrepancy when accounts do not exist | **Constant-Time Timing Defense**: Evaluates `DUMMY_HASH` on non-existent accounts. |
| **Database Breach Exfiltration** | Raw user identities dumped from backups or logs | **Zero-Knowledge Field Encryption (`db-cipher`)**: Emails and names encrypted with AES-256-GCM (`enc:em:...`, `enc:v1:...`). |
| **Cross-Site Request Forgery (CSRF)**| Unauthorized state mutations from third-party tabs | Strict `SameSite=Lax` cookies + Origin / Host verification on all POST/PUT/DELETE requests. |
| **Cross-Site Scripting (XSS)** | Malicious payloads in bio text or custom URLs | React automatic JSX escaping + `javascript:`/`data:` URI rejection + CSP headers. |
| **Server-Side Request Forgery (SSRF)**| Malicious internal network crawling via webhooks | Strict URL scheme validation (`http(s)` only) + private IP / loopback address filtering. |
| **SQL Injection** | Payload manipulation in search or query parameters | 100% parameterized queries across all database drivers via Drizzle ORM. |
| **Path Traversal** | Accessing arbitrary files via `../` in media requests | `sanitizeKey()` stripping directory traversal sequences + resolved prefix checks. |
| **Session Hijacking** | Man-in-the-middle token theft | `httpOnly`, `Secure`, and `SameSite` session cookies with global revocation endpoints. |
| **Webhook Tampering** | Replay or forge event notifications to endpoints | HMAC-SHA256 signatures transmitted via `X-LinkForge-Signature` header. |
| **API Key Compromise** | Exposure of developer REST access tokens | Plaintext keys shown only once on generation; database stores only salted SHA-256 hashes. |

---

## 🛡️ ALTCHA Proof-of-Work (PoW) Bot Defense

LinkForge rejects traditional, privacy-invasive third-party CAPTCHAs that track user behavior across the web. Instead, it deploys **ALTCHA Proof-of-Work**:
1. **Client Request**: The browser requests a cryptographic puzzle from `/api/auth/altcha`.
2. **Computational Verification**: The client's CPU computes the SHA-256 hash solution matching a difficulty threshold (taking 100–300ms for legitimate humans).
3. **Cryptographic Validation**: The solved challenge payload is signed with a server HMAC secret (`ALTCHA_HMAC_KEY`) containing a timestamp and single-use nonce.
4. **Zero-Friction UX**: Humans experience seamless, invisible verification with zero distorted text puzzles or image selection grids.

---

## 🚦 Dual-Bucket Sliding Window Rate Limiting

Standard rate limiters that only track IP addresses fail against distributed proxy networks. LinkForge implements a dual-bucket rate limiter:

1. **Bucket A (IP Origin)**:
   * Tracks total requests originating from a single IP address.
   * Prevents volumetric denial of service and broad scanning.
2. **Bucket B (Target Account)**:
   * Tracks consecutive failures against a specific email address, regardless of incoming IP.
   * Prevents distributed credential stuffing botnets.
3. **Response Protocol**:
   * Exceeding thresholds yields `HTTP 429 Too Many Requests`.
   * Returns standard `Retry-After: <seconds>` headers.
   * Client-side UI displays a live 1-second interval countdown timer and reactively disables submission buttons.

---

## 🔐 Zero-Knowledge Data Encryption (`db-cipher`)

Personal Identifiable Information (PII) stored in LinkForge databases is protected using zero-knowledge encryption:
* **AES-256-GCM** authenticated symmetric encryption for user display names and metadata.
* **Deterministic HMAC Email Indexing**: Allows fast database lookups by email while preventing database dumps from exposing raw email addresses.
* **Auto-Migration Pipeline**: The database bootstrapper automatically detects and encrypts any legacy plaintext rows during application startup.

---

## 📊 Privacy-First Analytics Architecture

LinkForge delivers comprehensive creator analytics without sacrificing visitor privacy or violating GDPR/CCPA:
* **Zero Tracking Cookies**: No persistent visitor cookies, tracking pixels, or cross-site fingerprinting.
* **Salted SHA-256 IP Hashes**: Visitor IPs are hashed with the server's private secret (`AUTH_SECRET`). The raw IP address is never stored on disk.
* **Geo-Location from Edge Headers**: Country determination utilizes trusted edge proxy headers (`x-vercel-ip-country`, `cf-ipcountry`) rather than external GeoIP lookup databases.
* **Automatic Retention Pruning**: Raw event records are automatically expired after `ANALYTICS_RETENTION_DAYS` (default: 30 days) and summarized into compact OLAP rollups.

---

## 🌐 HTTP Security Headers

LinkForge enforces modern HTTP security headers across all routes (`next.config.ts`):

```http
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```
