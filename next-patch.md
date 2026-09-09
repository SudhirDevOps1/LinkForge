# 🔐 Auth Providers — Setup Guides

Har provider **same unified user model** par map hota hai
(`users` table: `email / name / passwordHash(nullable) / avatarUrl`). Isliye
provider badalne par aapka dashboard, links aur analytics kabhi migrate nahi
karna padta — sirf identity layer map hoti hai.

| Provider | Type | Notes |
| :--- | :--- | :--- |
| `builtin` (default) | Lucia-style DB sessions + bcrypt | Zero external dependency, fully free |
| `supabase` | Supabase Auth REST | Social logins, magic links (Supabase dashboard se) |
| `clerk` | Clerk | Enterprise user management |
| `nextauth` | Auth.js | 40+ OAuth providers |
| `neon` | Neon Auth | Neon-managed auth |

## 1. Built-in (default) — recommended for self-hosting

Kahin signup nahi karna, koi API key nahi. Sessions Postgres/SQLite me store
hote hain (httpOnly cookie, SameSite=Lax, 30 din).

```env
AUTH_PROVIDER=builtin
AUTH_SECRET=<32+ random bytes>   # session + IP-hash salt
```

- Passwords: bcrypt (10 rounds)
- Reset flow: `/forgot-password` → token DB me hash hokar store →
  email provider na ho to **mail_outbox** table me queue (MailHog/SMTP adapter
  plug kar sakte hain — `docker compose --profile mail up`)
- Danger zone: "Sign out everywhere" saare sessions revoke karta hai

## 2. Supabase Auth

```env
AUTH_PROVIDER=supabase
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # sirf server-side signup (admin API) ke liye
```

Flow: email/password sign-in Supabase REST (`/auth/v1/token`) se hota hai,
identity local `users` row se **upsert-by-email** map hoti hai, fir local
session issue hota hai. Social providers Supabase dashboard me enable karein
aur `/api/auth/...` callback par same `mapExternalUser()` use karein.

## 3. Clerk

```env
AUTH_PROVIDER=clerk
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
```

Clerk `<SignIn/>` components ko `(auth)` routes me mount karein aur webhook
(`user.created`) se `mapExternalUser()` call karein. Adapter skeleton
`src/lib/auth/external.ts` me ready hai.

## 4. NextAuth.js / Auth.js

```env
AUTH_PROVIDER=nextauth
NEXTAUTH_URL=https://your-app.vercel.app
AUTH_SECRET=...
# + OAuth provider keys (Google/GitHub/etc.)
```

NextAuth callbacks me `mapExternalUser()` invoke karke local session bridge
karein — baaki pura app unchanged rehta hai.

## 5. Neon Auth

```env
AUTH_PROVIDER=neon
NEON_AUTH_URL=https://...neon.tech/auth
```

Neon Auth JWT ko middleware me verify karke `mapExternalUser()` se local
session issue karein.

---

## Security Model (sab providers par common)

- 🍪 Session cookie: `httpOnly`, `SameSite=Lax`, `Secure` (production)
- 🛡️ CSRF: mutation routes par Origin/Host match + SameSite cookies
- 🚦 Rate limits: login/signup 10 req/min per IP
- 🔑 Passwords: bcrypt 10 rounds (kabhi plain-text/hash leaks nahi)
- 📧 User enumeration protection: forgot-password hamesha same response
- ⏱️ Reset tokens: SHA-256 hashed, 1 hour expiry, single-use

# 🗄️ Database Providers — Setup Guides

LinkForge ek hi codebase se **5 database providers** support karta hai.
`DATABASE_PROVIDER` env var se switch karein — application code bilkul same
rehta hai (Drizzle ORM ka unified query API).

| Provider | Dialect | Free Tier | Best For |
| :--- | :--- | :--- | :--- |
| `postgres` (default) | PostgreSQL | Self-hosted | Docker, Railway, Render |
| `neon` | PostgreSQL (HTTP) | 0.5 GB | Vercel/Netlify serverless |
| `supabase` | PostgreSQL | 500 MB | Supabase ecosystem users |
| `turso` | SQLite (libSQL) | 1 GB | Global edge replicas |
| `d1` | SQLite | 5 GB | Cloudflare Pages/Workers |
| Upstash Redis | Redis | 10k cmds/day | Rate-limit/cache (DB nahi) |

---

## 1. Local Postgres (default, zero-cost)

```env
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
```

```bash
npx drizzle-kit push   # schema apply
```

Docker me: `docker compose --profile postgres up`

## 2. Neon (Serverless Postgres)

1. [neon.tech](https://neon.tech) par free project banayein
2. Connection string copy karein
3. `.env` me:

```env
DATABASE_PROVIDER=neon
NEON_DATABASE_URL=postgresql://...@....neon.tech/neondb?sslmode=require
```

4. Migrations: Neon Postgres-compatible hai — `drizzle.config.json` ki
   `dbCredentials.url` me Neon URL daal kar `npx drizzle-kit push`

> Neon HTTP driver use hota hai — serverless/edge par TCP pool ki zaroorat nahi.

## 3. Supabase

1. [supabase.com](https://supabase.com) project → **Settings → Database**
2. **Transaction pooler** URL (port 6543) copy karein
3. `.env`:

```env
DATABASE_PROVIDER=supabase
SUPABASE_DATABASE_URL=postgresql://postgres:[pass]@aws-0-....pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_ANON_KEY=eyJ...        # auth ke liye (see docs/auth.md)
```

4. Migrations: `drizzle.config.json` me pooler URL → `npx drizzle-kit push`

## 4. Turso (libSQL / distributed SQLite)

1. `brew install tursodatabase/tap/turso` (ya install script)
2. `turso db create linkforge` → `turso db show --url linkforge`
3. `turso db tokens create linkforge`
4. `.env`:

```env
DATABASE_PROVIDER=turso
TURSO_DATABASE_URL=libsql://linkforge-....turso.io
TURSO_AUTH_TOKEN=eyJ...
```

5. Migrations (SQLite dialect — `schema.sqlite.ts` use hota hai):

```bash
npx drizzle-kit push --config drizzle.config.turso.ts
```

## 5. Cloudflare D1

1. `npx wrangler login` → `npx wrangler d1 create linkforge`
2. `database_id` ko `wrangler.toml` ke `[[d1_databases]]` block me daalein
3. `.env`:

```env
DATABASE_PROVIDER=d1
D1_ACCOUNT_ID=xxxx
D1_DATABASE_ID=xxxx
D1_AUTH_TOKEN=xxxx   # Cloudflare API token (D1 edit permission)
```

4. Migrations:

```bash
npx drizzle-kit push --config drizzle.config.d1.ts
# ya local testing: npx wrangler d1 execute linkforge --local --file=...
```

Runtime me D1 binding `wrangler.toml` se milti hai (Workers/Pages env).

## 6. Upstash Redis (rate limiting / cache)

Run-time DB nahi, lekin **distributed rate limiting** automatically on ho
jati hai jab:

```env
UPSTASH_REDIS_REST_URL=https://....upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

Vercel/Cloudflare jaise multi-instance platforms par in-memory limiter per-
instance kaam karta hai — Upstash set karne par limits globally enforce hote hain.

---

## Schema Topology

```
users 1───1 profiles 1───* links
  │               │        └───* events (clicks/views, link_id nullable)
  │               ├───* webhooks
  │               └───* team_members
  ├───* sessions
  ├───* api_keys
  └───* password_reset_tokens
```

Dono dialects (`schema.ts` pg / `schema.sqlite.ts` sqlite) isomorphic hain.
Ids app-level par `crypto.randomUUID()` se banti hain — cross-dialect inserts
identical rehte hain.
# ☁️ Deployment Guides — 5 Platforms, One Codebase

> **package.json deploy scripts** (apne package.json me add karein):
> ```json
> "deploy:vercel": "vercel --prod",
> "deploy:cloudflare": "opennextjs-cloudflare build && wrangler pages deploy",
> "deploy:netlify": "netlify deploy --prod"
> ```

---

## 1. Vercel (recommended for Neon)

1. Repo import: [vercel.com/new](https://vercel.com/new)
2. Env vars add karein (`DATABASE_URL` / Neon / B2 etc.)
3. Deploy — bas. Middleware edge par, API routes serverless functions par chalte hain.

```bash
npm i -g vercel && vercel --prod
```

**Best combo:** Vercel + Neon (`neon-http`) + Vercel Blob/B2 + Upstash rate-limit.

Custom domains: Vercel dashboard → Domains → `bio.user.com` add karein +
`APP_DOMAIN` env set karein — user domains edge middleware se route honge.

## 2. Cloudflare Pages (recommended for D1 + R2)

```bash
npm i -D @opennextjs/cloudflare wrangler
npx opennextjs-cloudflare build
npx wrangler pages deploy
```

1. `wrangler.toml` me `[[d1_databases]]` binding uncomment karein (`binding = "DB"`)
2. `DATABASE_PROVIDER=d1` + D1 credentials env me
3. Migrations: `npx drizzle-kit push --config drizzle.config.d1.ts`

**Best combo:** Cloudflare + D1 (5 GB free) + R2 (10 GB, zero egress).

## 3. Netlify

`netlify.toml` already included:

```bash
npm i -g netlify-cli
netlify login && netlify init
netlify deploy --prod
```

- Build command: `npm run build` · Publish: `.next`
- `@netlify/plugin-nextjs` API routes ko functions par map karta hai
- Env vars Netlify UI → Site settings → Environment variables

**Best combo:** Netlify + Neon/Supabase + B2.

## 4. Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. "Add service" → **PostgreSQL** (free-ish) — `DATABASE_URL` auto-inject
3. App service me `DATABASE_URL=${{ Postgres.DATABASE_URL }}` reference
4. `npx drizzle-kit push` (locally, DATABASE_URL ke against)

Railway persistent containers deta hai — `STORAGE_PROVIDER=local` bhi chalega
(volume attach karein), ya MinIO service add karein.

## 5. Render

1. New → **Web Service** → repo connect
2. Build: `npm install && npm run build` · Start: `npm run start`
3. **Render PostgreSQL** instance add karein (free 90 days) → `DATABASE_URL`
4. Disks: `/data/uploads` mount karke `UPLOAD_DIR=/data/uploads`

## 6. Docker (self-hosted, full control)

```bash
# App + Postgres + MinIO + MailHog
docker compose --profile full up --build
```

`.env` me internal URLs use karein:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/linkforge
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=http://minio:9000
```

Schema push (first run): `docker compose exec app npx drizzle-kit push`

---

## Post-deploy checklist

- [ ] `GET /api/health` → `{ "status": "ok", providers: {...} }`
- [ ] `AUTH_SECRET` strong random (32+ bytes)
- [ ] `NEXT_PUBLIC_APP_URL` production domain
- [ ] `APP_DOMAIN` set (custom domains ke liye)
- [ ] Upstash REST env (multi-instance rate limiting ke liye)
- [ ] Analytics retention (`ANALYTICS_RETENTION_DAYS`) review
# Media: local and S3-compatible storage

## The actual flow

The dropzone asks `POST /api/media/presign` for an upload mode. Local/Blob configurations use the bounded multipart `POST /api/media` path. S3-compatible configurations return a short-lived PUT URL and an owner-bound ticket. The browser sends the file directly, then calls `POST /api/media/complete`.

Completion checks the ticket owner, expiry, provider, object size, Content-Type and file signature before inserting media metadata. Completion is single-use; a presigned PUT URL itself is reusable until expiry. This is public-object storage, not a private encrypted document vault or malware scanner.

## B2, R2, S3, MinIO

Select `STORAGE_PROVIDER` and fill the corresponding credentials in `.env.example`. Credentials stay server-side. Use bucket-scoped keys with PutObject, GetObject, HeadObject and DeleteObject permissions. The uploader needs a readable asset URL after completion. For R2, set `R2_PUBLIC_URL` to the public/custom domain, not the S3 API endpoint.

Configure bucket CORS for your exact application origin. Allow PUT, GET and HEAD; allow Content-Type and Content-Disposition request headers; expose ETag if needed. Browser-supplied Content-Length is part of the signed upload. Do not allow credentials or wildcard origins unnecessarily.

Direct uploads are useful on Vercel/Netlify because request bodies do not pass through the application function. The completion request is small. Some providers require billing setup even for a free quota; verify current vendor terms.

## Persistence and cleanup

Local uploads require a persistent writable volume. They are not suitable for ephemeral serverless disks. Do not change `STORAGE_PROVIDER` and assume old objects moved: they do not. Deletion refuses a provider mismatch and refuses files still referenced by a link.

Schedule `npx tsx scripts/cleanup-uploads.ts` to remove expired, incomplete S3 tickets and their objects. Do not put a short expiration lifecycle rule on the entire `files/` prefix: it also contains completed uploads. Keep database and object-store backups coordinated.

## Supported files

JPEG, PNG, GIF, WebP, AVIF, PDF, text, Markdown, CSV, MP3, WAV, Ogg, M4A, MP4, WebM, ZIP, DOCX, XLSX and PPTX. Default maximum: 10 MiB. SVG, HTML and executable/script extensions are blocked. Format checks are not full document validation or malware scanning; add a scanning/quarantine service for untrusted public uploads.

Local serving includes Content-Type, nosniff, disposition, length and byte-range headers. A file URL is public even when a bio page is later unpublished.
# Production checklist

1. Use a fresh database and run `npx drizzle-kit push` (PostgreSQL) or the correct Turso config. Back up existing data first.
2. Generate a unique AUTH_SECRET. Never ship a public demo password. Local `.env` and `backups/` are gitignored.
3. Configure the real public URL, operator name and private contact. Review privacy/terms for your jurisdiction; these pages are not legal compliance certification.
4. Choose durable storage; configure S3 bucket permissions, CORS and public asset URL. Test your actual provider combination. The preview validates local storage; remote credentials are not included.
5. Use Upstash-backed limits across multiple instances. Memory fallback is per-instance and fail-open on Redis errors; apply host-level protection for strict abuse limits.
6. Configure email delivery before offering password reset publicly. The retained built-in reset implementation writes a mail outbox; it is not an SMTP delivery service.
7. Back up the database and uploaded objects; test restore. Schedule strict analytics-retention cleanup if you require an exact deletion deadline.
8. Use HTTPS. Review security headers, trusted proxy/IP forwarding and hosting logs. Do not expose migration tools, development servers or a MinIO console publicly.
9. Webhooks are HTTPS-only, no redirects, with DNS pinning and private-address rejection. Delivery is signed but best-effort; there is no durable retry queue.
10. Run typegen, tsc, lint, Vitest, build and Playwright. Review `npm audit`. Current remaining moderate findings affect the Drizzle Kit migration/development tool chain; critical/high findings have been patched.

## Provider-specific notes

- Vercel / Netlify: Node runtime, persistent external PostgreSQL and object storage. Use direct S3 uploads for files above request-body limits.
- Docker / Railway / Render: use the standalone output, persistent volumes, your own secrets and an externally supplied DATABASE_URL. Run migrations separately before rolling out.
- Turso: `dialect: turso`, real SQLite tables and client-generated UUID defaults. Local libSQL transaction tests pass; test a hosted Turso URL/token before rollout.
- Neon / Supabase: PostgreSQL-compatible Node driver supports interactive transactions. Confirm connection/pool settings and TLS from the provider.
- D1 / Cloudflare: native bindings and batch transactions need dedicated platform integration. The retained scaffolds must not be presented as already verified Workers support.
- Clerk / Neon Auth / NextAuth: retained adapter scaffolds are not a complete production auth integration. Use the built-in reference auth or finish and validate the selected adapter.

## GitHub handoff

Source links target https://github.com/SudhirDevOps1/LinkForge. No GitHub push is performed by the application or public-profile importer. Push the project files yourself using an authorized Git credential. Do not upload `.env`, `node_modules`, `.next`, uploaded media, local database files or backups.
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

# 📦 Storage Providers — Setup Guides

Avatar aur file uploads ke liye **6 storage backends** — `STORAGE_PROVIDER`
se switch. Sab backends ek hi `StorageService` interface implement karte hain:

```ts
interface StorageService {
  upload(data, key, contentType): Promise<{ key; url }>;
  delete(key): Promise<void>;
  getUrl(key): string;
  getPresignedUploadUrl?(key, contentType); // S3-family only
}
```

| Provider | Free Tier | S3-Compatible | Presigned Uploads |
| :--- | :--- | :--- | :--- |
| `local` (default) | Unlimited (self-hosted) | — | — |
| `b2` Backblaze B2 | **10 GB** | ✅ | ✅ |
| `r2` Cloudflare R2 | **10 GB** (zero egress fees) | ✅ | ✅ |
| `s3` AWS S3 | Pay-as-you-go | ✅ | ✅ |
| `minio` MinIO | Unlimited (self-hosted) | ✅ | ✅ |
| `vercel-blob` | 10 GB | — | put/del API |

---

## 1. Local Disk (default)

Koi setup nahi — files `./uploads` (ya `UPLOAD_DIR`) me likhi jati hain aur
`GET /api/files/[folder]/[name]` route se serve hoti hain (immutable cache
headers ke saath). Docker me `uploads` volume persist karein.

```env
STORAGE_PROVIDER=local
UPLOAD_DIR=./uploads
```

> ⚠️ Vercel/Netlify (ephemeral filesystem) par `local` use na karein —
> wahan B2/R2/Vercel-Blob choose karein.

## 2. Backblaze B2 (₹0 — 10 GB free)

1. [backblaze.com/b2](https://www.backblaze.com/b2) → bucket banayein (public)
2. **App Keys** → key create (`keyID` + `applicationKey`)
3. `.env`:

```env
STORAGE_PROVIDER=b2
B2_APPLICATION_KEY_ID=...
B2_APPLICATION_KEY=...
B2_BUCKET_NAME=linkforge
B2_REGION=us-west-004            # bucket region se match karein
B2_PUBLIC_URL=https://f004.backblazeb2.com/file/linkforge   # optional pretty URLs
```

## 3. Cloudflare R2 (zero egress fees)

1. Cloudflare dashboard → **R2** → bucket create
2. **Manage R2 API Tokens** → token create (Object Read & Write)
3. Account ID dashboard URL se
4. `.env`:

```env
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=linkforge
R2_PUBLIC_URL=https://pub-xxxx.r2.dev   # bucket → Settings → Public access
```

## 4. AWS S3

```env
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_BUCKET_NAME=linkforge
AWS_PUBLIC_URL=https://cdn.example.com   # optional CloudFront
```

Bucket policy: uploads ke liye least-privilege IAM user recommended.

## 5. MinIO (self-hosted, unlimited)

```bash
docker compose --profile minio up   # MinIO + auto-created 'linkforge' bucket
```

```env
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=linkforge
MINIO_PUBLIC_URL=http://localhost:9000/linkforge
```

## 6. Vercel Blob

1. Vercel project → **Storage** → Blob store create
2. `BLOB_READ_WRITE_TOKEN` copy karein → `.env`:

```env
STORAGE_PROVIDER=vercel-blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

---

## Presigned Uploads (server bandwidth = 0)

S3-family providers par browser **seedha storage par** upload kar sakta hai:

```http
POST /api/storage/presign
{ "contentType": "image/png", "folder": "avatars" }
→ { "url": "<PUT url, 60s valid>", "key": "...", "publicUrl": "..." }
```

Browser fir `PUT <url>` par file bhejta hai aur `publicUrl` ko profile me
save karta hai. Default avatar flow server-proxy hai (sab providers par kaam
karta hai); presign large files ke liye optimized path hai.
<div align="center">

# ⚡ LinkForge — Advanced Link-in-Bio Builder

**One link. Every platform. Zero lock-in.**

Enterprise-grade, open-source link-in-bio builder jo **kisi bhi database**,
**kisi bhi cloud** aur **kisi bhi storage** par chalta hai — poori tarah free
aur self-hostable.

`Next.js 16` · `React 19` · `Drizzle ORM` · `Tailwind CSS v4` · `TypeScript (strict)`

</div>

---

## ✨ Highlights

| Area | Support |
| :--- | :--- |
| 🗄️ **Multi-Database** | Neon · Turso · Cloudflare D1 · Supabase · Local Postgres (+ Upstash Redis for rate-limit/cache) |
| ☁️ **Multi-Cloud** | Vercel · Cloudflare Pages · Netlify · Railway · Render · Docker |
| 📦 **Multi-Storage** | Backblaze B2 · Cloudflare R2 · AWS S3 · MinIO · Vercel Blob · Local disk |
| 🔐 **Multi-Auth** | Built-in sessions (default) · Neon Auth · Supabase Auth · Clerk · NextAuth |
| 🎨 **Themes** | 12 production themes + List/Bento layouts + live phone preview |
| 📊 **Analytics** | Clicks, unique visitors, devices, geo, referrers — **privacy-first** (hashed IPs, no cookies) |
| 🔌 **APIs** | REST API v1 (API keys) · Signed webhooks · JSON export/import |
| 🌐 **Domains** | Custom domains (bio.aapka-domain.com) via edge middleware |
| 📁 **Media Library** | Drag-and-drop uploads (PDF, images, audio, video, docs) → B2/R2/S3/MinIO, one-click link creation |
| 📜 **Legal & SEO** | Privacy Policy, Terms of Service, sitemap, robots, dynamic OG images |
| 🛡️ **Security** | 80 tests · Rate limiting (100 req/min) · CSRF · Zod validation · Helmet headers |

---

## 🚀 Quick Start (2 minutes)

```bash
# 1. Install deps
npm install

# 2. Configure environment
cp .env.example .env

# 3. Push schema + seed demo data
npx drizzle-kit push
npx tsx scripts/seed.ts

# 4. Run
npm run dev
```

**Demo login:** `demo@linkforge.dev / demo1234` → http://localhost:3000/demo

---

## 🧩 Provider Switching (ek env var se sab badal jata hai)

```env
DATABASE_PROVIDER=neon       # postgres | neon | supabase | turso | d1
STORAGE_PROVIDER=b2          # local | b2 | r2 | s3 | minio | vercel-blob
AUTH_PROVIDER=builtin        # builtin | neon | supabase | clerk | nextauth
DEPLOYMENT_PLATFORM=vercel   # vercel | cloudflare | netlify | railway | render
```

Abstraction layers (`db` → `storage` → `auth`) kohi bhi provider ko **same
unified API** ke peeche chhupa dete hain — application code kabhi provider
ko directly touch nahi karta.

```
src/
├── config/           # db.config.ts · storage.config.ts · auth.config.ts
├── db/
│   ├── schema.ts         # PostgreSQL dialect (Neon/Supabase/local)
│   ├── schema.sqlite.ts  # SQLite dialect (Turso/D1) — isomorphic mirror
│   └── providers/        # postgres.ts · neon.ts · turso.ts · d1.ts
└── lib/
    ├── auth/         # builtin sessions + external provider adapters
    ├── storage/      # local + S3-compatible factory (B2/R2/S3/MinIO) + Vercel Blob
    ├── analytics/    # privacy-first tracking + aggregations
    └── rate-limit.ts # in-memory + Upstash Redis distributed mode
```

⚡ **Free tier stack (₹0/month):** Neon (0.5 GB) + D1 (5 GB) + B2 (10 GB) + Vercel/Cloudflare hosting.

---

## 📚 Docs

| Guide | Kya milega |
| :--- | :--- |
| [docs/database.md](docs/database.md) | Neon / Turso / D1 / Supabase / Upstash setup + migrations |
| [docs/storage.md](docs/storage.md) | B2 / R2 / S3 / MinIO / Vercel Blob setup + presigned uploads |
| [docs/auth.md](docs/auth.md) | Built-in / Supabase / Clerk / NextAuth / Neon Auth setup |
| [docs/deployment.md](docs/deployment.md) | Vercel / Cloudflare / Netlify / Railway / Render / Docker guides |
| [docs/security.md](docs/security.md) | Security model, rate limits, CSP, test suite |

---

## 🧪 Quality Gates

```bash
npm run build        # production build (0 errors)
npm run typecheck    # TypeScript strict — 0 errors
npm run lint         # ESLint — 0 warnings
npx vitest run       # 65 security tests
```

## 🐳 Docker

```bash
docker compose --profile postgres up   # app + postgres
docker compose --profile minio up      # app + minio (S3)
docker compose --profile full up       # sab kuch + mailhog
```

## 📄 License

MIT — free for personal aur commercial use. Based on the open-source
[coleam00/link-in-bio-page-builder](https://github.com/coleam00/link-in-bio-page-builder) architecture, extended to a multi-cloud enterprise edition.


<div align="center">

# ⚡ LinkForge — Advanced Link-in-Bio Builder

**One link. Every platform. Zero lock-in.**

Enterprise-grade, open-source link-in-bio builder jo **kisi bhi database**,
**kisi bhi cloud** aur **kisi bhi storage** par chalta hai — poori tarah free
aur self-hostable.

`Next.js 16` · `React 19` · `Drizzle ORM` · `Tailwind CSS v4` · `TypeScript (strict)`

</div>

---

## ✨ Highlights

| Area | Support |
| :--- | :--- |
| 🗄️ **Multi-Database** | Neon · Turso · Cloudflare D1 · Supabase · Local Postgres (+ Upstash Redis for rate-limit/cache) |
| ☁️ **Multi-Cloud** | Vercel · Cloudflare Pages · Netlify · Railway · Render · Docker |
| 📦 **Multi-Storage** | Backblaze B2 · Cloudflare R2 · AWS S3 · MinIO · Vercel Blob · Local disk |
| 🔐 **Multi-Auth** | Built-in sessions (default) · Neon Auth · Supabase Auth · Clerk · NextAuth |
| 🎨 **Themes** | 12 production themes + List/Bento layouts + live phone preview |
| 📊 **Analytics** | Clicks, unique visitors, devices, geo, referrers — **privacy-first** (hashed IPs, no cookies) |
| 🔌 **APIs** | REST API v1 (API keys) · Signed webhooks · JSON export/import |
| 🌐 **Domains** | Custom domains (bio.aapka-domain.com) via edge middleware |
| 📁 **Media Library** | Drag-and-drop uploads (PDF, images, audio, video, docs) → B2/R2/S3/MinIO, one-click link creation |
| 📜 **Legal & SEO** | Privacy Policy, Terms of Service, sitemap, robots, dynamic OG images |
| 🛡️ **Security** | 80 tests · Rate limiting (100 req/min) · CSRF · Zod validation · Helmet headers |

---

## 🚀 Quick Start (2 minutes)

```bash
# 1. Install deps
npm install

# 2. Configure environment
cp .env.example .env

# 3. Push schema + seed demo data
npx drizzle-kit push
npx tsx scripts/seed.ts

# 4. Run
npm run dev
```

**Demo login:** `demo@linkforge.dev / demo1234` → http://localhost:3000/demo

---

## 🧩 Provider Switching (ek env var se sab badal jata hai)

```env
DATABASE_PROVIDER=neon       # postgres | neon | supabase | turso | d1
STORAGE_PROVIDER=b2          # local | b2 | r2 | s3 | minio | vercel-blob
AUTH_PROVIDER=builtin        # builtin | neon | supabase | clerk | nextauth
DEPLOYMENT_PLATFORM=vercel   # vercel | cloudflare | netlify | railway | render
```

Abstraction layers (`db` → `storage` → `auth`) kohi bhi provider ko **same
unified API** ke peeche chhupa dete hain — application code kabhi provider
ko directly touch nahi karta.

```
src/
├── config/           # db.config.ts · storage.config.ts · auth.config.ts
├── db/
│   ├── schema.ts         # PostgreSQL dialect (Neon/Supabase/local)
│   ├── schema.sqlite.ts  # SQLite dialect (Turso/D1) — isomorphic mirror
│   └── providers/        # postgres.ts · neon.ts · turso.ts · d1.ts
└── lib/
    ├── auth/         # builtin sessions + external provider adapters
    ├── storage/      # local + S3-compatible factory (B2/R2/S3/MinIO) + Vercel Blob
    ├── analytics/    # privacy-first tracking + aggregations
    └── rate-limit.ts # in-memory + Upstash Redis distributed mode
```

⚡ **Free tier stack (₹0/month):** Neon (0.5 GB) + D1 (5 GB) + B2 (10 GB) + Vercel/Cloudflare hosting.

---

## 📚 Docs

| Guide | Kya milega |
| :--- | :--- |
| [docs/database.md](docs/database.md) | Neon / Turso / D1 / Supabase / Upstash setup + migrations |
| [docs/storage.md](docs/storage.md) | B2 / R2 / S3 / MinIO / Vercel Blob setup + presigned uploads |
| [docs/auth.md](docs/auth.md) | Built-in / Supabase / Clerk / NextAuth / Neon Auth setup |
| [docs/deployment.md](docs/deployment.md) | Vercel / Cloudflare / Netlify / Railway / Render / Docker guides |
| [docs/security.md](docs/security.md) | Security model, rate limits, CSP, test suite |

---

## 🧪 Quality Gates

```bash
npm run build        # production build (0 errors)
npm run typecheck    # TypeScript strict — 0 errors
npm run lint         # ESLint — 0 warnings
npx vitest run       # 65 security tests
```

## 🐳 Docker

```bash
docker compose --profile postgres up   # app + postgres
docker compose --profile minio up      # app + minio (S3)
docker compose --profile full up       # sab kuch + mailhog
```

## 📄 License

MIT — free for personal aur commercial use. Based on the open-source
[coleam00/link-in-bio-page-builder](https://github.com/coleam00/link-in-bio-page-builder) architecture, extended to a multi-cloud enterprise edition.

Samajh gaya — existing features aur data preserve karke visual editor ko aur advanced banaunga: real icons, sizing/spacing/colors/fonts controls, safer file uploads, richer analytics, aur polished landing page. Demo ke liye SudhirDevOps1 ka public GitHub data fetch karunga aur repository links bhi aapke repo par update karunga.


Exploring
Explored
,
0
1
2
3
4
5
6
7
8
9
0
1
2
3
4
5
6
7
8
9
0
1
2
3
4
5
6
7
8
9
 read
s
,
0
1
2
3
4
5
6
7
8
9
0
1
2
3
4
5
6
7
8
9
0
1
2
3
4
5
6
7
8
9
 list
s
List
/
Read
package.json L1-49
Read
appearance-editor.tsx L1-146

GitHub REST API get user list public repositories users username repos docs X-GitHub-Api-Version 3 results
Abhi editor mein sirf theme/layout controls hain; unhe saved design settings aur per-link controls ke saath extend karunga. GitHub import sirf public profile/repos tak limited rahega—existing links delete nahi honge.


Exploring
Explored
,
0
1
2
3
4
5
6
7
8
9
0
1
2
3
4
5
6
7
8
9
0
1
2
3
4
5
6
7
8
9
 read
s
Read
queries.ts L1-42
Read
index.ts L1-111
Read
index.ts L1-195
Read
route.ts L1-59
Fetched

REST API endpoints for users - GitHub Docs
docs.github.com
Fetched

REST API endpoints for users - GitHub Docs
docs.github.com

Ran node --input-type=module -e 'const h={Accept:"appl…
GitHub se real profile mil gaya: Sudhir Singh (SudhirDevOps1), public website aur repositories available hain. Main homepage ko warm, clean editorial design dunga, aur editor mein 30+ saved controls, searchable brand icons, undo/redo aur share/QR tools add karunga.


Installed 3 packages

AWS SDK v3 S3 presigned PutObject HeadObject GetObject Range content length browser upload docs 3 results

simple-icons npm individual icon import siGithub qrcode.react QRCodeSVG file-type fileTypeFromBuffer documentation 3 results

Fetched 2 assets for sand dunes pastel desert landscape

Fetched 2 assets for sand dunes pastel desert landscape

Exploring
Explored
,
0
1
2
3
4
5
6
7
8
9
0
1
2
3
4
5
6
7
8
9
0
1
2
3
4
5
6
7
8
9
 read
s
Read
bio-renderer.tsx L210-301
Read
index.ts L1-173
Read
s3.ts L1-133
Read
eslint.config.mjs L1-9
Dependencies ready hain. Ab appearance validation/store aur additive database tables bana raha hoon—design preferences aur upload tickets alag rahenge, isliye purane profile/link records untouched rahenge.

Created src/lib/appearance.ts

Created src/lib/appearance.ts
Created src/config/site.ts

Created src/config/site.ts
Edited src/db/schema.ts
+1
-1

Edited src/db/schema.ts
+19
-1
Edited src/db/schema.sqlite.ts
+1
-1

Edited src/db/schema.sqlite.ts
+15
-1

Ran node --input-type=module -e 'import * as s from "s…
Design schema, official brand icons aur cover asset ready hain. Nayi tables apply karne se pehle runtime bootstrap kar raha hoon; migration sirf tables add karegi.

Built and started the application
Bootstrap pass hai. Ab preferences API, GitHub fetch/import service aur migration add karunga—GitHub imports duplicate URLs skip karenge aur manual links preserve karenge.


Ran npx drizzle-kit push
Created src/lib/design-store.ts

Created src/lib/design-store.ts
Created src/app/api/design/route.ts

Created src/app/api/design/route.ts
Created src/lib/github.ts

Created src/lib/github.ts
Created src/lib/github-sync.ts

Created src/lib/github-sync.ts
Created src/app/api/integrations/github/route.ts

Created src/app/api/integrations/github/route.ts
Nayi tables aur owner-only APIs apply ho gayi hain. Ab real SVG icon library, QR/share dialog aur bio renderer upgrade karunga—font/icon sizing, custom colors, per-card styles aur click-to-load embeds public page par bhi work karenge.

Created src/components/icons.tsx

Created src/components/icons.tsx
Created src/components/icon-picker.tsx

Created src/components/icon-picker.tsx
Created src/components/share-button.tsx

Created src/components/share-button.tsx
Created src/components/bio-renderer.tsx

Created src/components/bio-renderer.tsx
Renderer upgrade ready hai. Ab Design Studio mein live device preview, undo/redo, 16 templates, background uploads, typography, spacing aur individual card controls jodunga. Changes explicit Save se persist honge; card order drag-and-drop se save hoga.

Created src/components/appearance-editor.tsx

Created src/components/appearance-editor.tsx
Created src/app/studio.css

Created src/app/studio.css
Edited src/app/globals.css
+1
-1

Edited src/app/globals.css
+2
-1
Edited src/lib/themes.ts
+1
-1

Edited src/lib/themes.ts
+8
-1
Design Studio ready hai. Ab saved styles ko editor, live bio page aur previews se connect karunga; GitHub integration page mein preview-before-import flow hoga. Purane demos ko preserve karke /developer alias bhi available karunga.

Created src/components/github-integration.tsx

Created src/components/github-integration.tsx
Created src/app/(dashboard)/dashboard/integrations/page.tsx

Created src/app/(dashboard)/dashboard/integrations/page.tsx
Created src/lib/queries.ts

Created src/lib/queries.ts
Ran python3 - <<'PY' from pathlib import Path for name…
Saved designs live pages se connected hain. Ab homepage ko cream-and-sage visual direction mein rebuild karunga: real Sudhir profile preview, interactive template gallery, working customization playground, animated details aur clear privacy/terms links—fake testimonials ya made-up statistics ke bina.

Created src/app/page.tsx

Created src/app/page.tsx
Created src/components/marketing-home.tsx

Created src/components/marketing-home.tsx
Created src/app/marketing.css

Created src/app/marketing.css
Naya homepage layout ready hai. Ab playground ko Sudhir ke real public data se connect karunga, aur uploads mein filename/type validation plus S3 completion checks ki foundation add karunga.

Created src/components/landing/theme-playground.tsx

Created src/components/landing/theme-playground.tsx
Edited src/components/marketing-home.tsx
+1
-1

Edited src/components/marketing-home.tsx
+1
-1
Created src/app/playground.css

Created src/app/playground.css
Edited src/app/globals.css
+1
-1

Edited src/app/globals.css
+2
-1
Created src/lib/upload-validation.ts

Created src/lib/upload-validation.ts
Playground ab real GitHub profile use karta hai. Upload flow mein ab presigned S3 uploads, size/signature verification, progress/cancel aur ownership checks add karunga. Local file serving ko range requests bhi milengi, taaki audio/video seek properly chale.

Edited src/lib/storage/index.ts
+1
-1

Edited src/lib/storage/index.ts
+2
-1
Created src/app/api/media/presign/route.ts

Created src/app/api/media/presign/route.ts
Created src/app/api/media/complete/route.ts

Created src/app/api/media/complete/route.ts
Created src/app/api/media/route.ts

Created src/app/api/media/route.ts
Created src/app/api/media/[id]/route.ts

Created src/app/api/media/[id]/route.ts
Ran python3 - <<'PY' from pathlib import Path p=Path('…
S3 upload tickets aur server verification routes ready hain. Ab upload UI mein real progress, cancel/retry aur clear errors jodunga; file delete se pehle active link references check honge, taaki published links accidentally na tootें.

Created src/components/file-dropzone.tsx

Created src/components/file-dropzone.tsx
Created src/app/api/files/[folder]/[name]/route.ts

Created src/app/api/files/[folder]/[name]/route.ts

Ran npm exec eslint -- src --max-warnings=0 > /tmp/lin…
Upload UI ready hai. Checks mein kuch purane lint issues aur Next.js ki security advisory bhi mili—ab unhe fix karke patched release install karunga. Saath hi analytics mein period comparison, device filters, activity feed aur refresh controls add karunga.


Installed 3 packages
Ran python3 - <<'PY' from pathlib import Path p=Path('…
Created src/components/analytics-extras.tsx

Created src/components/analytics-extras.tsx
Next.js update ho gaya; critical advisory हट गई है. Analytics UI controls bhi ready hain. Ab unhe real database calculations se wire karunga aur CSV formula-injection protection add karunga. Demo traffic ko clearly sample label milega.

Created src/lib/analytics/index.ts

Created src/lib/analytics/index.ts
Created src/lib/csv.ts

Created src/lib/csv.ts
Ran python3 - <<'PY' from pathlib import Path p=Path('…
Analytics calculations connect ho gayi hain. Ab demo ko GitHub se sync karunga: pehle local backup, phir public name/avatar/repos import; purane example links retained rahenge. JSON export/import mein design settings bhi include karunga, with non-destructive merge as the default.

Created scripts/sync-github.ts

Created scripts/sync-github.ts
Created src/app/api/profile/import/route.ts

Created src/app/api/profile/import/route.ts

Ran python3 - <<'PY' from pathlib import Path p=Path('…
GitHub sync successful: 10 real links add हुए और 11 पुराने links preserve हुए; backup bhi bana hai. Ab deployment guide, repo documentation aur legal pages update karunga—provider requirements aur current verification limits clearly documented rahenge.

Created src/components/legal-document.tsx

Created src/components/legal-document.tsx
Created src/app/privacy/page.tsx

Created src/app/privacy/page.tsx
Created src/app/terms/page.tsx

Created src/app/terms/page.tsx
Created src/app/docs/page.tsx

Created src/app/docs/page.tsx
Legal pages aur setup guide update ho gaye hain. Ab final safety pass mein webhook SSRF protection, clearer API errors, GitHub-ready docs/config aur regression tests add karunga; uske baad browser mein actual editing/upload flows verify karunga.


Installed 1 package
Edited src/app/docs/page.tsx
+1
-1

Edited src/app/docs/page.tsx
+1
-1
Created src/lib/outbound.ts

Created src/lib/outbound.ts
Created src/lib/webhooks.ts

Created src/lib/webhooks.ts
Created drizzle.config.ts

Created drizzle.config.ts

Ran python3 - <<'PY' from pathlib import Path p=Path('…
Ek compatibility issue bhi mila: SQLite adapters par PostgreSQL table objects reuse ho rahe the. Main schema selection ko runtime-correct karunga aur Turso/libSQL ko local fixture par test karunga. Neon ke Node runtime adapter mein transaction-compatible PostgreSQL connection use hoga.


site.orm.drizzle.team turso dialect turso libsql transaction schema drizzle-kit 3 results
Ran python3 - <<'PY' from pathlib import Path p=Path('…
Created src/db/providers/neon.ts

Created src/db/providers/neon.ts
Created drizzle.config.turso.ts

Created drizzle.config.turso.ts
Created scripts/check-database.ts

Created scripts/check-database.ts
Schema adapters update ho gaye hain. Ab PostgreSQL aur local libSQL par transaction/rollback checks chalaunga. Saath hi request body limits, import round-trip preservation aur auth redirect handling ko regression tests mein cover karunga.


Ran npx tsx scripts/check-database.ts && DATABASE_PROV…
Created src/lib/request-body.ts

Created src/lib/request-body.ts
Created src/lib/safe-redirect.ts

Created src/lib/safe-redirect.ts

Ran python3 - <<'PY' from pathlib import Path p=Path('…
PostgreSQL aur local libSQL dono par inserts, UUIDs, timestamps, transactions aur rollback checks pass hue. Dependency audit mein ab 0 critical/high issues hain; 4 moderate migration-tool issues remain. Ab automated browser tests aur final regression suite taiyar kar raha hoon.

Created tests/studio.test.ts

Created tests/studio.test.ts
Created playwright.config.ts

Created playwright.config.ts
Created tests/workspace.spec.ts

Created tests/workspace.spec.ts
Regression tests ready hain. Ab repo ko upload-friendly bana raha hoon: safe environment example, CI workflow, Docker notes, verified provider-status docs aur remaining audit notes. GitHub par push nahi kar raha—source folder aapke repo ke liye prepare ho raha hai.

Created README.md

Created README.md
Created .env.example

Created .env.example
Created docs/media.md

Created docs/media.md
Created docs/production.md

Created docs/production.md
Created .github/workflows/ci.yml

Created .github/workflows/ci.yml
Created .dockerignore

Created .dockerignore
Ran python3 - <<'PY' from pathlib import Path p=Path('…
Repo handoff files ready hain. Final polish mein dialog accessibility, signed-upload headers, abandoned-upload cleanup aur real database healthcheck finish karunga. Phir tests/build run karke desktop/mobile screenshots inspect karunga.

Created scripts/cleanup-uploads.ts

Created scripts/cleanup-uploads.ts
Created src/app/api/health/route.ts

Created src/app/api/health/route.ts
Created docker-compose.yml

Created docker-compose.yml
Ran python3 - <<'PY' from pathlib import Path p=Path('…
Final implementation pass complete ho raha hai. Ab keyboard/focus handling aur CORS headers polish karke unit tests, lint aur type generation chalaunga; failing checks ko fix kiye bina final link nahi dunga.


Ran python3 - <<'PY' from pathlib import Path p=Path('…
Created src/app/(public)/domain/page.tsx

Created src/app/(public)/domain/page.tsx
Edited src/middleware.ts
+1
-1

Edited src/middleware.ts
+4
-2
Edited src/middleware.ts
+1
-1

Edited src/middleware.ts
+1
-1
156 tests pass hue. Lint mein sirf do old navigation warnings bachi hain; unhe fix karke ab strict typecheck aur production build chala raha hoon.


Ran python3 - <<'PY' from pathlib import Path p=Path('…
Typegen, TypeScript, lint aur production build pass hain. Build ne runtime uploads folder ki tracing warnings dikhayi hain; unhe final cleanup mein address karunga. Ab production preview start karke actual browser flows test kar raha hoon.

Built and started the application
Updated production preview start ho gaya. Ab browser tests se design persistence, drag reorder, QR download, PDF upload, protected deletion, analytics filters aur mobile layout verify karunga.


Running set -o pipefail; PLAYWRIGHT_BASE_URL=https://3000-… failed
Browser test app tak pahunchne se pehle ruk gaya: sandbox mein Chromium ki required system libraries missing hain. Unhe install karke tests rerun karunga; yeh abhi application failure nahi hai.


Ran head -18 /tmp/playwright.log; npx playwright insta…
Chromium dependencies install ho gayi hain. Ab same production build par browser tests dobara chala raha hoon.


Ran set -o pipefail; PLAYWRIGHT_BASE_URL=https://3000-…
Dono end-to-end browser tests pass hain—including saved design, real drag reorder, PDF upload/serving, QR download aur analytics filters. Ab desktop/mobile screenshots dekhkar visual check kar raha hoon.


Exploring
Explored
,
0
1
2
3
4
5
6
7
8
9
0
1
2
3
4
5
6
7
8
9
0
1
2
3
4
5
6
7
8
9
 read
s
Read
home-desktop.png
Read
home-mobile.png
Read
design-studio.png
Screenshots generate ho gaye hain, aur automated mobile overflow check bhi pass hai. Ek desktop capture ko directly inspect karunga, phir build tracing warnings clean karke final validation repeat karunga.


https://3000-ic452rbfhozknir2pcrwo.e2b.app/dashboard/analytics add more features and landing page achha ho bahut se customization ho ..etc and drag drop krke pdf ya kuchh bhi dal sake samjhe s3 compatible mein chala jaye ya link bhi ..etc saly fix kro bina kuchh hatye production grade banao main page https://3000-ic452rbfhozknir2pcrwo.e2b.app/ ye achh abanao animation efeect ahut kuchh ho privacy policy terms ..etc advanced samjhe safly add add more advanced features bahut se customization features ho samjhe and yesa yesa do na drag drop krke ek real web app bana de pura samjhe manuly customize kr sake sab kuchh icon ize bahut kuchh sab real icon ..etc and es folder mein upload honga github pr https://github.com/SudhirDevOps1/LinkForge.git uskebad mera username developer ..etc and demo wala mein SudhirDevOps1 se sab fetch krke real adata add krna smjhe add bina kuchh hatye


