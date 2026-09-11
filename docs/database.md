# 🗄️ Database Architecture & Providers Guide

LinkForge is engineered with a **multi-dialect, zero-lock-in database abstraction layer** powered by [Drizzle ORM](https://orm.drizzle.team/). A single environment variable (`DATABASE_PROVIDER`) switches between serverless PostgreSQL and edge SQLite without any application code changes.

---

## 📊 Supported Database Engines

| Provider | Dialect | Free Tier | Optimal Deployment Environment | Driver & Transport | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`postgres`** (Default) | PostgreSQL | Self-hosted | Docker, Railway, Render, Bare Metal | `postgres.js` (TCP connection pool) | ✅ Production Ready |
| **`neon`** | PostgreSQL | 0.5 GB storage | Vercel, Netlify, Cloudflare Workers | `@neondatabase/serverless` (HTTP fetch) | ✅ Production Ready |
| **`supabase`** | PostgreSQL | 500 MB storage | Supabase ecosystem, Vercel | Supabase Transaction Pooler (Port 6543) | ✅ Production Ready |
| **`turso`** | SQLite (libSQL) | 1 GB storage | Global edge nodes, Fly.io, Vercel | `@libsql/client` (HTTP / WebSocket) | ✅ Production Ready |
| **`d1`** | SQLite | 5 GB storage | Cloudflare Pages / Workers | Cloudflare Native D1 Binding | ✅ Edge Native |
| **Upstash Redis** | Key-Value | 10k cmds/day | Distributed rate-limiting cache | REST API (Fail-open fallback) | ✅ Production Ready |

---

## ⚡ Zero-Config Auto-Migration Engine

LinkForge features an intelligent, runtime auto-migrator (`src/db/auto-migrate.ts`) designed specifically for serverless environments:
1. **Zero CLI Dependency**: Automatically checks and provisions all 21 tables (`CREATE TABLE IF NOT EXISTS`) during initial application boot or cold starts.
2. **Non-Destructive Column Sync**: Safely adds new columns (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) if existing tables were created with an earlier schema version.
3. **Zero-Knowledge Data Cipher Migration**: Automatically detects unencrypted legacy user records and migrates emails and names to AES-256 encrypted ciphertext (`enc:em:...` and `enc:v1:...`).
4. **Cold-Start Caching**: Caches migration state in-memory so serverless function invocations incur near-zero overhead.

---

## 🛠️ Provider Setup Guides

### 1. Local or Standard PostgreSQL (`postgres`)
Recommended for local development, self-hosted VMs, Docker, Railway, and Render.

```env
DATABASE_PROVIDER=postgres
DATABASE_URL="postgresql://postgres:password@127.0.0.1:5432/linkforge"
```

To initialize via Docker:
```bash
docker compose up -d postgres
```

### 2. Neon Serverless PostgreSQL (`neon`)
Recommended for serverless cloud deployments on Vercel or Netlify.

1. Create a free database on [neon.tech](https://neon.tech).
2. Copy your pooled connection string from the Neon Console.
3. Configure your `.env`:

```env
DATABASE_PROVIDER=neon
NEON_DATABASE_URL="postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

> **Manual Reset Script**: To clean-bootstrap all 21 tables in Neon SQL Editor, copy and run [`neon-reset.sql`](../neon-reset.sql).

### 3. Supabase (`supabase`)
Recommended for teams already utilizing Supabase services.

1. In Supabase Dashboard, navigate to **Project Settings → Database**.
2. Copy the **Transaction Pooler** connection string (Port `6543`).
3. Configure your `.env`:

```env
DATABASE_PROVIDER=supabase
SUPABASE_DATABASE_URL="postgresql://postgres.projectref:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

### 4. Turso libSQL (`turso`)
Recommended for low-latency distributed global edge deployments.

1. Install the Turso CLI: `curl -sSfL https://get.tur.so/install.sh | bash`
2. Create a database: `turso db create linkforge`
3. Retrieve credentials: `turso db show linkforge --url` and `turso db tokens create linkforge`
4. Configure your `.env`:

```env
DATABASE_PROVIDER=turso
TURSO_DATABASE_URL="libsql://linkforge-org.turso.io"
TURSO_AUTH_TOKEN="your-turso-jwt-auth-token"
```

### 5. Cloudflare D1 (`d1`)
Recommended when deploying directly to Cloudflare Pages.

1. Create your D1 database: `npx wrangler d1 create linkforge-db`
2. Configure `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "linkforge-db"
database_id = "your-database-uuid-from-cli"
```
3. Set environment variable: `DATABASE_PROVIDER=d1`

---

## 📋 Comprehensive Database Schema (21 Tables)

LinkForge organizes data into 21 relational tables designed for security, analytics efficiency, and creator monetization:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               LinkForge 21-Table Schema                                 │
├──────────────────────────────┬────────────────────────────┬─────────────────────────────┤
│ Core Identity & Security     │ Public Profiles & Content  │ Analytics & Infrastructure  │
├──────────────────────────────┼────────────────────────────┼─────────────────────────────┤
│ 1.  users                    │ 9.  profiles               │ 17. events                  │
│ 2.  sessions                 │ 10. links                  │ 18. analytics_rollups       │
│ 3.  accounts                 │ 11. subscribers            │ 19. webhooks                │
│ 4.  verifications            │ 12. media_files            │ 20. api_keys                │
│ 5.  passkeys                 │ 13. upload_tickets         │ 21. mail_outbox             │
│ 6.  two_factors              │ 14. team_members           │                             │
│ 7.  organizations            │ 15. password_reset_tokens  │                             │
│ 8.  members / invitations    │ 16. courses / store        │                             │
└──────────────────────────────┴────────────────────────────┴─────────────────────────────┘
```

### Detailed Table Specifications

| # | Table Name | Purpose & Primary Fields |
|---|---|---|
| **1** | `users` | Primary user identity, role (`user`/`admin`), 2FA state, ban controls, encrypted email & name. |
| **2** | `sessions` | Active sessions, tokens, IP address, user-agent, active organization, impersonation audit. |
| **3** | `accounts` | Better Auth OAuth links, provider accounts, and hashed credential pairs. |
| **4** | `verifications` | One-time passwordless email and SMS verification tokens. |
| **5** | `passkeys` | WebAuthn credentials (`credential_id`, `public_key`, `counter`, `transports`, `aaguid`). |
| **6** | `two_factors` | Encrypted TOTP authenticator secrets, verified status, and recovery backup codes. |
| **7** | `organizations` | Multi-tenant team workspaces (`name`, `slug`, `logo`, `metadata`). |
| **8** | `members` | Organization memberships mapping users to workspace roles (`owner`, `admin`, `member`). |
| **9** | `invitations` | Time-limited team invitations with role definitions and expiration timestamps. |
| **10** | `profiles` | Bio page configuration, unique slug, theme, layout, SEO tags, custom domains. |
| **11** | `links` | Bio cards & embeds, position, 12 types, pin state, active toggle, scheduling dates. |
| **12** | `events` | High-throughput privacy-preserving views and clicks (salted SHA-256 IP hash, geo headers). |
| **13** | `analytics_rollups`| Daily OLAP aggregate buckets (profile, date, device, country) — **98%+ DB space savings**. |
| **14** | `subscribers` | Newsletter audience collected directly from creator bio profiles. |
| **15** | `media_files` | Registered assets (PDFs, images, audio, video) with storage keys and public URLs. |
| **16** | `upload_tickets` | Time-limited presigned upload tokens ensuring authenticated direct-to-cloud uploads. |
| **17** | `webhooks` | Automated event delivery endpoints with HMAC-SHA256 signatures. |
| **18** | `api_keys` | Developer REST access keys (prefix-indexed, hashed with SHA-256). |
| **19** | `team_members` | Profile-level collaborators (`editor`, `analyst`). |
| **20** | `mail_outbox` | Resilient local mail queue for asynchronous SMTP delivery. |
| **21** | `password_reset_tokens`| Single-use, time-limited password recovery tokens. |
