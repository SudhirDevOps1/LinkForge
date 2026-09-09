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
