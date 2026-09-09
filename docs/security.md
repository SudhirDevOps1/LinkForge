# 🛡️ Security Model

LinkForge production-grade security defaults ke saath aata hai. Test suite:
`npx vitest run` → **65 security assertions**.

## Attack Surface Controls

| Threat | Mitigation |
| :--- | :--- |
| Brute force login | 10 req/min per IP (auth buckets) |
| General abuse | 100 req/min per IP default, per-bucket overrides |
| Click fraud / tracking abuse | 120 req/min per IP on `/r/[linkId]` (user redirect block nahi hota, sirf tracking skip) |
| CSRF | SameSite=Lax cookies + Origin/Host match on all mutations |
| XSS | React escaping + `javascript:`/`data:` URL rejection + `nosniff` headers |
| Open redirect | `/r/[linkId]` sirf `http(s):/mailto:` targets allow karta hai |
| SQL injection | Drizzle ORM parameterized queries (100%) |
| Path traversal | `sanitizeKey()` + resolved-path prefix check on file serving |
| Session hijack | httpOnly+Secure cookies, rotate on login, revoke-all endpoint |
| User enumeration | Identical forgot-password responses, hidden 404/403 split |
| Webhook spoofing | HMAC-SHA256 `X-LinkForge-Signature` header per delivery |
| API key leaks | Sirf SHA-256 hash stored; raw key ek baar dikhti hai |

## Security Headers (next.config.ts)

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

## Privacy-First Analytics

- Raw IP **kabhi** store nahi hota — `sha256(AUTH_SECRET :: ip)` ka 32-char slice
- Country sirf edge headers se (`x-vercel-ip-country` / `cf-ipcountry`) — koi
  GeoIP DB, koi third-party tracker nahi
- `ANALYTICS_RETENTION_DAYS` (default 30) ke baad data probabilistic GC se purge
- Per-profile `analyticsEnabled` opt-out toggle
- Koi cookies/fingerprinting nahi — GDPR-friendly by design

## Distributed Rate Limiting

Single instance: in-memory fixed-window (GC sweep ke saath).
Multi-instance (Vercel/CF): `UPSTASH_REDIS_REST_URL` set karte hi Redis-backed
global limits automatically activate ho jate hain (fail-open on Redis outage).

## Secrets Hygiene

- Koi hardcoded credential nahi — sab `.env` se
- `.env` gitignored, `.env.example` documented placeholders ke saath
- `AUTH_SECRET`: session + IP hash + webhook HMAC ki root entropy — production
  me 32+ random bytes (`openssl rand -hex 32`)
