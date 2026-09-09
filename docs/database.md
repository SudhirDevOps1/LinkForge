# 🗄️ Database Providers — Setup Guides

LinkForge ek hi codebase se **5 database providers** support karta hai.
`DATABASE_PROVIDER` env var se switch karein — application code bilkul same
rehta hai (Drizzle ORM ka unified query API).

| Provider | Dialect | Free Tier | Best For | Status |
| :--- | :--- | :--- | :--- | :--- |
| `postgres` (default) | PostgreSQL | Self-hosted | Docker, Railway, Render | ✅ Working |
| `neon` | PostgreSQL (HTTP) | 0.5 GB | Vercel/Netlify serverless | ✅ Driver working (interactive-tx nahi — HTTP driver) |
| `supabase` | PostgreSQL (URL preset) | 500 MB | Supabase ecosystem users | ✅ Postgres-compatible URL se chalta hai (alag driver nahi) |
| `turso` | SQLite (libSQL) | 1 GB | Global edge replicas | ✅ Driver working (local libSQL verified) |
| `d1` | SQLite | 5 GB | Cloudflare Pages/Workers | 🚧 EXPERIMENTAL — Workers binding wiring verify nahi |
| Upstash Redis | Redis | 10k cmds/day | Rate-limit/cache (DB nahi) | ✅ Working (fail-open fallback ke saath) |

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

## 5. Cloudflare D1 — 🚧 EXPERIMENTAL (verify nahi hua)

> Workers/Pages par native binding wiring **baki hai** (`wrangler.toml` me
> `[[d1_databases]]` commented hai, `getRequestContext` wiring nahi).
> Production D1 par jaane se pehle hosted binding test zaroori hai.

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
  │               ├───* team_members
  │               └───* media_files (+ upload_tickets: presign flow)
  ├───* sessions
  ├───* api_keys
  ├───* password_reset_tokens
  └───* mail_outbox (reset-mail queue)
```

Dono dialects (`schema.ts` pg / `schema.sqlite.ts` sqlite) mirror hain.
Ids app-level par `crypto.randomUUID()` se banti hain — cross-dialect inserts
identical rehte hain (sqlite `id` columns par client-side default bhi hai).

> ⚠️ D1/SQLite limits (honest notes):
> - `.returning()` purane D1/SQLite builds par toot sakta hai — app me 13+
>   jagah use hota hai; D1 production se pehle D1-local par verify karo.
> - `neon-http` me interactive transactions nahi — `db.transaction` wale
>   paths (links reorder) Neon par single-statement fallback chahte hain (P1).
