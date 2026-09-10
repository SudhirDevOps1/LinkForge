<div align="center">

# ⚡ LinkForge — Enterprise Link-in-Bio Platform

**Production-grade, privacy-first, zero lock-in link-in-bio platform.**  
Run on any database, any cloud, and any object storage provider with enterprise multi-tenancy, Backblaze B2 private vaults, and in-memory DuckDB OLAP analytics.

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.6-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Vitest-145%20Passed-success?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Live Demo](https://inkorge-demo.vercel.app/) · [Architecture](#-architecture) · [Quickstart](#-quickstart) · [Environment Variables](#-environment-variables-reference) · [API Reference](#-api-endpoints)

</div>

---

## 🌟 Highlights & Enterprise Features

### 🗄️ Universal Database Engine (Zero Lock-In)
- **PostgreSQL & Serverless**: Native support for **Neon** (serverless Postgres with connection pooling), **Supabase**, and local/hosted PostgreSQL.
- **Edge SQLite**: Native support for **Turso** (distributed LibSQL) and **Cloudflare D1**.
- **Automated Idempotent Migrations**: Zero-downtime automated schema migration via `/api/db/migrate` that guarantees zero data loss for existing users (`CREATE TABLE IF NOT EXISTS` & `ADD COLUMN IF NOT EXISTS`).

### 📦 100% Private Cloud Storage Vault (Backblaze B2 & S3)
- **Zero-Leak Security**: B2/S3 buckets operate with **zero public permissions**. All master credentials remain strictly on the server.
- **Dual Direct Access**:
  - **Presigned Browser PUT**: High-speed direct client-to-B2 uploads bypassing serverless payload limits (4.5MB).
  - **Authenticated Streaming Proxy**: Transparent server-side streaming with immutable edge caching and seekable Range headers.
- **Strict Multi-Tenant Isolation**: Uploads partition into per-user directories (`uploads/${userId}/...`, `files/${userId}/...`, `avatars/${userId}/...`). Deletions are gated by cryptographic ownership checks — users can never delete another user's files.
- **Dynamic CORS Engine**: Configurable allowed origins (`B2_CORS_ALLOWED_ORIGINS`) with one-click automated B2 bucket CORS sync via `/api/storage/cors`.

### 🦆 DuckDB OLAP Analytics & 98% Space-Saving Rollups
- **DuckDB Analytical Engine**: In-memory OLAP processor computing multi-dimensional metrics:
  - **24x7 Hourly Heatmap**: Click & view traffic matrix across all 168 hours of the week.
  - **Conversion Funnel**: Page Views $\to$ Link Engagements $\to$ CTR and drop-off analysis.
  - **Retention Cohorts**: Salted IP hash analysis tracking single-day vs. returning visitors.
  - **Ready-to-Run DuckDB SQL**: Copy-paste queries for DuckDB CLI, Python, MotherDuck, and BigQuery.
- **Daily Rollups Database Compactor**: Automatically rolls up thousands of raw click events into daily aggregate rows (`analytics_rollups`), reducing database storage usage by **over 98%**.
- **High-Compression Exports**: Download analytics in `.csv`, `.csv.gz` (85% smaller), `.ndjson.gz` (DuckDB/Snowflake native), or `.sql` loader scripts.

### 🎨 Bento Grid & 12 Theme Engine
- **Visual Builder**: Live interactive phone mock preview with instant real-time synchronization.
- **Layout Modes**: Vertical List or Bento Grid (standard, wide, tall, and feature card spans).
- **Embedded Media**: YouTube, Spotify, X (Twitter), Instagram, TikTok, GitHub repos, and custom iframes.
- **Design Customization**: Accent colors, corner radiuses, font scale, and custom favicon/OG banners.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    Client([Web Browser / Client])
    
    subgraph Edge & API Gateway
        Edge[Next.js App Router / Middleware]
        RateLimit[In-Memory / Upstash Rate Limiter]
        AuthGuard[Lucia-Style Session / JWT Auth]
    end

    subgraph Analytics & OLAP
        DuckDB[DuckDB OLAP Engine]
        Rollups[Compact Daily Rollups Aggregator]
    end

    subgraph Storage Layer
        B2[Backblaze B2 Private Bucket]
        LocalDisk[Local Storage Adapter]
        S3[AWS S3 / Cloudflare R2]
    end

    subgraph Database Layer
        Neon[Neon Serverless Postgres]
        Supabase[Supabase Postgres]
        Turso[Turso / LibSQL]
    end

    Client -->|Direct Upload via Presigned URL| B2
    Client -->|API Requests & Streaming| Edge
    Edge --> RateLimit --> AuthGuard
    AuthGuard --> DuckDB
    AuthGuard --> Rollups --> Neon
    AuthGuard --> B2
    AuthGuard --> LocalDisk
```

---

## 🚀 Quickstart

### 1. Prerequisites
- **Node.js**: v18.18.0 or higher
- **Package Manager**: `npm` (v9+) or `pnpm`

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/SudhirDevOps1/LinkForge.git
cd LinkForge

# Install production dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### 3. Database Initialization & Seeding
```bash
# Automatically initialize database tables (Neon / Postgres / Turso)
npm run db:migrate

# (Optional) Seed demo user and link templates
npx tsx scripts/seed.ts
```

### 4. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Default demo credentials: `demo@linkforge.dev` / `demo1234`.

---

## ⚙️ Environment Variables Reference

LinkForge cleanly separates sensitive secrets from plain-text configuration.  
👉 **For step-by-step console setup (Neon, Backblaze B2, Vercel), see the [Complete Environment Setup Guide (ENV_SETUP_GUIDE.md)](ENV_SETUP_GUIDE.md).**

### 🔒 Sensitive Secrets (Mark as "Secret / Sensitive" in Vercel / Cloud)
| Variable | Description | Example / Format |
| :--- | :--- | :--- |
| `AUTH_SECRET` | 32-byte cryptographic secret for sessions & IP hashing | `b79a32c4e1f85d9082ac3f0982d...` |
| `DATABASE_URL` | Primary database connection string | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `B2_APPLICATION_KEY` | Backblaze B2 Application Key (Never expose client-side) | `K005abc123...` |

### 📄 Configuration & Public Settings (Plain Text)
| Variable | Default / Recommended | Description |
| :--- | :--- | :--- |
| `DATABASE_PROVIDER` | `neon` (or `postgres`, `supabase`, `turso`, `d1`) | Target database dialect |
| `STORAGE_PROVIDER` | `b2` (or `local`, `r2`, `s3`, `minio`, `vercel-blob`) | Cloud storage adapter |
| `B2_BUCKET_NAME` | `my-private-vault` | Backblaze B2 Bucket Name |
| `B2_APPLICATION_KEY_ID` | `005abc...` | B2 Application Key ID |
| `B2_ENDPOINT` | `s3.us-east-005.backblazeb2.com` | B2 S3 API Endpoint |
| `B2_REGION` | `us-east-005` | S3 Cluster Region |
| `B2_PRIVATE_BUCKET` | `true` | Enforces 100% private vault security |
| `B2_PRESIGN_PUT_EXPIRY_SEC` | `600` | Presigned upload ticket TTL (seconds) |
| `B2_PRESIGN_GET_EXPIRY_SEC` | `300` | Presigned download ticket TTL (seconds) |
| `B2_CORS_ALLOWED_ORIGINS` | `https://your-domain.com,http://localhost:3000` | Comma-separated CORS allowed domains |
| `DEPLOYMENT_PLATFORM` | `vercel` | Deployment target host |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Base public URL of your app |
| `ANALYTICS_ENABLED` | `true` | Enables/disables analytics tracking |
| `ANALYTICS_RETENTION_DAYS` | `30` | Retention period before event GC |

---

## 🔌 API Endpoints

### 🔐 Authentication & Session
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Create new user account |
| `POST` | `/api/auth/login` | Authenticate and issue session cookie |
| `POST` | `/api/auth/logout` | Invalidate current session |
| `POST` | `/api/auth/logout-all` | Revoke all active sessions across devices |
| `POST` | `/api/auth/forgot` | Issue password reset token |
| `POST` | `/api/auth/reset` | Complete password reset |

### 👤 Profile & Links
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET / PUT` | `/api/profile` | Read or update bio, slug, theme, and bento layout |
| `POST` | `/api/profile/avatar` | Upload and crop user profile picture |
| `GET / POST` | `/api/links` | List or create draggable link items |
| `PUT / DELETE` | `/api/links/[id]` | Update or delete a link |
| `PUT` | `/api/links/reorder` | Update drag-and-drop sort order position |

### 📁 Storage & Media Vault
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/storage/presign-upload` | Issue user-scoped presigned B2 PUT ticket |
| `GET` | `/api/storage/file/[...key]` | Authenticated streaming proxy with Range support |
| `DELETE` | `/api/storage/file` | Strictly validated multi-tenant file deletion |
| `GET / POST` | `/api/storage/cors` | View or push CORS configuration directly to B2 |
| `POST` | `/api/media/complete` | Verify magic-bytes & commit presigned file |

### 📊 DuckDB Analytics & Exports
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/analytics` | Fetch standard traffic summary and timeseries |
| `GET` | `/api/analytics/duckdb?days=30` | 24x7 Heatmap, Funnels, Cohorts, and DuckDB SQL |
| `POST` | `/api/analytics/duckdb` | Run on-demand daily rollup compaction |
| `GET` | `/api/analytics/export?format=csv.gz` | High-compression GZIP CSV export |
| `GET` | `/api/analytics/export?format=ndjson.gz`| GZIP JSON-Lines for DuckDB/BigQuery |
| `GET` | `/api/analytics/export?format=duckdb` | DuckDB CLI automated loader script |

### 🛠️ Operations & Health
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Comprehensive DB ping and storage health check |
| `GET / POST` | `/api/db/migrate` | Idempotent zero-loss schema synchronizer |

---

## 🧪 Quality Gates & Testing

LinkForge enforces strict automated quality standards:

```bash
# Run full Vitest test suite (145 tests covering auth, storage, duckdb, and security)
npm test

# Run strict TypeScript typechecking
npm run typecheck

# Run production Next.js compilation (Turbopack)
npm run build
```

---

## 🐳 Docker Deployment

For self-hosted instances on VPS, Hetzner, or AWS EC2:

```bash
# Production stack: LinkForge + PostgreSQL
docker compose --profile postgres up -d

# Full stack with MinIO S3 storage + MailHog
docker compose --profile full up -d
```

---

## 📄 License

Distributed under the **MIT License**. Free for personal and commercial usage.
