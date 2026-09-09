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
