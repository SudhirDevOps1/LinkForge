# ☁️ Multi-Cloud Deployment Guide

LinkForge is engineered to run seamlessly across any cloud platform with zero code modifications. The same codebase deploys to Vercel, Cloudflare Pages, Netlify, Railway, Render, and self-hosted Docker environments.

---

## 🚀 Deployment Matrix

| Platform | Database Compatibility | Storage Compatibility | Edge / Serverless Support | Recommended Setup |
|---|---|---|---|---|
| **Vercel** | Neon, Supabase, Postgres | Backblaze B2, R2, S3, Vercel Blob | Serverless Node.js + Edge Middleware | Neon + B2 + Upstash |
| **Cloudflare Pages** | Cloudflare D1, Turso | Cloudflare R2, Backblaze B2 | Native Cloudflare Workers Edge | D1 + R2 (Zero egress) |
| **Netlify** | Neon, Supabase, Turso | Backblaze B2, AWS S3 | Netlify Serverless Functions | Neon + B2 |
| **Railway** | Managed Postgres | Backblaze B2, AWS S3, MinIO | Containerized Node.js Service | Railway Postgres + B2 |
| **Render** | Managed Postgres | Backblaze B2, AWS S3 | Managed Web Service | Render Postgres + B2 |
| **Docker / VPS** | Local Postgres / SQLite | Local Disk, MinIO, S3 | Self-Hosted Container | Docker Compose (All-in-one) |

---

## 🛠️ Platform Instructions

### 1. Vercel (Recommended for Neon Serverless)

1. Import your Git repository via [vercel.com/new](https://vercel.com/new).
2. Configure environment variables in the Vercel Dashboard:
   * `DATABASE_PROVIDER=neon`
   * `NEON_DATABASE_URL=postgresql://...`
   * `BETTER_AUTH_SECRET=...`
   * `BETTER_AUTH_URL=https://your-custom-domain.com`
   * `STORAGE_PROVIDER=b2` (or `vercel-blob`)
3. Deploy! LinkForge's auto-migration engine will automatically provision all 21 tables during the first request.

```bash
# Or deploy via Vercel CLI:
npm i -g vercel
vercel --prod
```

### 2. Cloudflare Pages (Recommended for D1 + R2)

1. Ensure `@opennextjs/cloudflare` and `wrangler` are available:
```bash
npm i -D @opennextjs/cloudflare wrangler
```
2. In `wrangler.toml`, ensure the D1 database binding is specified:
```toml
[[d1_databases]]
binding = "DB"
database_name = "linkforge-db"
database_id = "your-database-id"
```
3. Build and deploy:
```bash
npx opennextjs-cloudflare build
npx wrangler pages deploy
```

### 3. Netlify

Netlify configuration is pre-configured via `netlify.toml`:
```bash
npm i -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### 4. Railway

1. In [Railway Dashboard](https://railway.app), create a new project from your GitHub repository.
2. Click **Add Service → Database → PostgreSQL**.
3. Railway automatically injects `DATABASE_URL`. Set `DATABASE_PROVIDER=postgres`.
4. Deploy the service.

### 5. Docker & Docker Compose (Self-Hosted)

A production-ready `Dockerfile` and `docker-compose.yml` are included in the repository.

```bash
# Start LinkForge with local PostgreSQL:
docker compose up -d
```

To include the development mail catcher profile:
```bash
docker compose --profile mail up -d
```

---

## 🌐 Custom Domains & Subdomain Routing

LinkForge features built-in custom domain resolution in Next.js middleware:
1. When a visitor navigates to `yourcreator.bio` or `links.yourcompany.com`, the edge middleware detects the custom host.
2. It looks up the associated profile in the database via `profiles.custom_domain`.
3. The request is transparently rewritten to the creator's profile page without URL redirects.
