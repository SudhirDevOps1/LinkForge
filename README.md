<div align="center">

# ⚡ LinkForge — Enterprise Privacy-First Link-in-Bio Platform

**Production-ready, zero-lock-in link-in-bio platform with end-to-end zero-knowledge encryption, MX DNS verified newsletter engine, 0% fee UPI payments, and high-performance DuckDB OLAP analytics.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.6-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Encryption](https://img.shields.io/badge/Security-AES--256--GCM-success?style=for-the-badge&logo=shield)](https://github.com/SudhirDevOps1/LinkForge)
[![Tests](https://img.shields.io/badge/Vitest-145%20Passed-success?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[GitHub Repository](https://github.com/SudhirDevOps1/LinkForge) · [Architecture](#-system-architecture) · [Key Features](#-key-features) · [Quickstart](#-quickstart) · [Environment Variables](#-environment-variables-reference) · [API Endpoints](#-api-endpoints)

</div>

---

## 🌟 Key Features

### 🛍️ Superprofile Creator Monetization Studio
- **Masterclasses & Paid Courses**: Multi-chapter curriculum syllabus builder with duration badges and locked vs free sample lesson previews.
- **Paid 1:1 Mentorship & Video Calls**: Offer paid consulting, architecture audits, and mock interviews with slot duration and rate badges (`₹999 / 45m`). Direct booking triggers for Topmate, Cal.com, and Calendly.
- **Digital Downloads**: Instant delivery for code boilerplates, Figma templates, presets, and PDF e-books with high-converting "Get Now" CTA cards.
- **0% Fee India UPI & Global Tipping**: Direct zero-middleman payments via Google Pay, PhonePe, Paytm QR, Stripe, and Buy Me A Coffee.

### 📝 Backblaze B2-Backed Daily Blog & Micro-Journal (Zero DB Bloat)
- **100% Object Storage Backed**: Write and publish daily blog posts and developer journals in Markdown, HTML, or Plain Text. All article bodies are stored directly in Backblaze B2 / S3 Object Storage — keeping Neon PostgreSQL completely free of text bloat.
- **Creator Studio & Reader**: Dedicated studio at `/dashboard/blog` with reading time estimation and tags, plus a fast WordPress-grade public feed (`/[slug]/blog`) and single article reader (`/[slug]/blog/[postSlug]`).

### 🔐 Dual-Layer Zero-Knowledge Encryption
- **Backblaze B2 Payload Encryption (AES-256-GCM)**:
  - All avatars, media, documents, and assets are encrypted on the server before entering the B2 storage bucket using authenticated AES-256-GCM.
  - Packed with binary format: `LENC\x01` magic bytes (5 bytes) + 12-byte random IV + 16-byte authentication tag + encrypted ciphertext.
  - Even if your storage bucket is inspected, attackers only see high-entropy encrypted blobs.
- **Database Field-Level Cipher (Neon / PostgreSQL)**:
  - Sensitive user data (creator email, display name, subscriber lists) is automatically encrypted with deterministically keyed AES-256-GCM (`enc:em:...` and `enc:v1:...`).
  - Allows exact lookup matching while ensuring database dumps contain zero plaintext emails or personal identification data.
  - **Zero-Downtime Auto-Migration**: Built-in automated boot migrator transparently upgrades plaintext database rows into encrypted format.

### 📬 Real-Time MX DNS Verified Newsletter Engine
- **Dual-Resolver DNS MX Validation**: Built-in verification via Google DNS (`8.8.8.8`) and Cloudflare DNS (`1.1.1.1`) ensures submitted emails belong to active domains configured with real mail exchanger records.
- **Anti-Disposable Shield**: Automatically detects and rejects over 300+ disposable and temporary mailbox providers (e.g., `10minutemail`, `tempmail`, `guerrillamail`).
- **Subscriber CRM Dashboard**: Dedicated dashboard (`/dashboard/subscribers`) for creators to view active audience members with 1-click **CSV export**.

### ⚡ Global Edge CDN Decryption Proxy (Zero Egress Costs)
- **1-Year Edge CDN Caching**: Route `/api/storage/file/[...key]` serves decrypted assets with `Cache-Control: public, s-maxage=31536000, immutable` and ETag HTTP 304 revalidation.
- **Zero Bandwidth Bill**: After the initial cache warm-up, assets are served directly from Vercel's global edge network, reducing Backblaze B2 egress download costs to practically zero.

### 📱 In-App Media Viewer & 0% Fee UPI Direct Payments
- **Seamless Document & PDF Reader**: Readers view PDF portfolios, menus, guides, and resumes directly inside the mobile profile without forced file downloads.
- **Audio & Video Player**: Native inline playback for creator audio tracks, podcasts, and video snippets.
- **India UPI Instant Payments**: Direct deep links and dynamic QR codes for PhonePe, Google Pay, Paytm, BHIM, and CRED with **0% middleman platform fees**.
- **Vector QR Code Generator**: Creators can customize and download high-resolution vector SVG/PNG QR codes for packaging, flyers, and business cards.

### 🗄️ Universal Database & Cloud Storage Engine (Zero Lock-In)
- **Database Adapters**:
  - **Neon**: Serverless PostgreSQL with connection pooling.
  - **Supabase / Self-Hosted PostgreSQL**: Full native PostgreSQL compatibility.
  - **Turso**: Distributed edge LibSQL.
  - **Cloudflare D1**: Serverless SQLite at the edge.
- **Storage Adapters**:
  - **Backblaze B2**: Enterprise object storage with private bucket enforcement.
  - **AWS S3 / Cloudflare R2 / MinIO**: Standard S3-compatible cloud storage.
  - **Vercel Blob / Local Disk**: Flexible dev and serverless storage options.

### 🦆 DuckDB OLAP Analytics & 98% Space-Saving Rollups
- **DuckDB Analytical Engine**: In-memory OLAP computation delivering:
  - **24x7 Hourly Heatmap**: Multi-dimensional view & click patterns across 168 hours of the week.
  - **Conversion Funnels**: Page Views $\to$ Link Engagements $\to$ CTR and drop-off analysis.
  - **Retention Cohorts**: Salted cryptographic hash tracking single-day vs. recurring visitors.
  - **Ready-to-Run SQL**: Exportable SQL queries for DuckDB CLI, Python notebooks, MotherDuck, and BigQuery.
- **Compaction Rollups**: Automatically aggregates granular click streams into daily aggregate rows (`analytics_rollups`), reducing long-term database storage by **over 98%**.
- **High-Compression Exports**: Export analytics in `.csv`, `.csv.gz` (85% smaller), `.ndjson.gz` (DuckDB/Snowflake), or `.sql` format.

### 🎨 Bento Grid & 12 Theme Engine
- **Visual Drag-and-Drop Builder**: Live interactive phone mock preview with instant real-time synchronization.
- **Layout Variations**: Vertical classic stack or Bento Grid (standard, wide, tall, and feature card spans).
- **Embedded Integrations**: YouTube, Spotify, X (Twitter), Instagram, TikTok, GitHub repositories, and custom embeds.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    Client([Web Client / Visitor])
    
    subgraph Edge & API Layer [Next.js App Router & Edge Runtime]
        Edge[Edge Decryption Proxy & Cache Engine]
        DnsVerify[MX DNS Dual Resolver: 8.8.8.8 / 1.1.1.1]
        AuthGuard[Session Auth Guard & Rate Limiter]
    end

    subgraph Data & Encryption Security [Zero-Knowledge Core]
        DbCipher[AES-256-GCM DB Field Cipher]
        StorageCipher[AES-256-GCM B2 Payload Cipher]
    end

    subgraph Storage Layer [Private Cloud Storage]
        B2[(Backblaze B2 Private Vault)]
        S3[(AWS S3 / Cloudflare R2)]
        LocalDisk[(Local File Storage)]
    end

    subgraph Database Layer [Universal SQL Engine]
        Neon[(Neon Serverless Postgres)]
        Supabase[(Supabase / PostgreSQL)]
        Turso[(Turso / LibSQL)]
    end

    subgraph Analytics Layer [DuckDB OLAP]
        DuckDB[In-Memory DuckDB Engine]
        Rollups[Daily Event Compactor -98%]
    end

    Client -->|View Profile / Decrypted Media| Edge
    Edge -->|Verify Cache ETag / Stream| StorageCipher
    StorageCipher -->|Encrypted Binary LENC01| B2
    
    Client -->|Subscribe Newsletter| DnsVerify
    DnsVerify -->|Verified Valid Domain| DbCipher
    DbCipher -->|Deterministic enc:em:...| Neon

    Client -->|Creator Dashboard / Login| AuthGuard
    AuthGuard --> DuckDB
    AuthGuard --> Rollups --> Neon
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

# Copy environment template
cp .env.example .env
```

### 3. Database Setup & Migrations
```bash
# Run automated idempotent database migrations
npm run db:migrate
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- Visit `/signup` to create your own creator profile and claim your custom handle.
- Visit `/dashboard` to manage links, themes, bento blocks, and view real-time analytics.
- Visit `/dashboard/subscribers` to inspect your verified email subscribers and export CSVs.

---

## ⚙️ Environment Variables Reference

LinkForge cleanly isolates sensitive cryptographic credentials from general configuration.  
👉 **For step-by-step console setup (Neon, Backblaze B2, Vercel), see the [Complete Environment Setup Guide (ENV_SETUP_GUIDE.md)](ENV_SETUP_GUIDE.md).**

### 🔒 Sensitive Secrets (Mark as "Secret" in Cloud / Vercel)
| Variable | Description | Example / Format |
| :--- | :--- | :--- |
| `AUTH_SECRET` | 32-byte random cryptographic secret for session tokens & IP salting | `openssl rand -hex 32` |
| `DB_ENCRYPTION_KEY` | 32-byte secret key for AES-256 database field encryption | `openssl rand -hex 32` |
| `DATABASE_URL` | Primary database connection string | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `B2_APPLICATION_KEY` | Backblaze B2 Application Key (Never exposed to client) | `K005abc123...` |

### 📄 Configuration & Public Settings
| Variable | Default / Recommended | Description |
| :--- | :--- | :--- |
| `DATABASE_PROVIDER` | `neon` (or `postgres`, `supabase`, `turso`, `d1`) | Target database provider |
| `STORAGE_PROVIDER` | `b2` (or `local`, `r2`, `s3`, `minio`, `vercel-blob`) | Cloud storage provider |
| `B2_BUCKET_NAME` | `my-private-vault` | Backblaze B2 bucket name |
| `B2_APPLICATION_KEY_ID` | `005abc...` | Backblaze B2 key ID |
| `B2_ENDPOINT` | `s3.us-east-005.backblazeb2.com` | B2 S3-compatible endpoint |
| `B2_REGION` | `us-east-005` | Storage region cluster |
| `B2_PRIVATE_BUCKET` | `true` | Enforces zero public read bucket security |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Public base URL of your application |
| `ANALYTICS_ENABLED` | `true` | Enables/disables visitor analytics tracking |

---

## 🔌 API Endpoints

### 🔐 Authentication & Session
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new creator account with encrypted identity |
| `POST` | `/api/auth/login` | Authenticate creator and issue secure session cookie |
| `POST` | `/api/auth/logout` | Invalidate active session cookie |
| `POST` | `/api/auth/logout-all` | Revoke all active sessions across all devices |
| `POST` | `/api/auth/forgot` | Generate password reset token |
| `POST` | `/api/auth/reset` | Complete password reset verification |

### 👤 Profile, Links & Discovery
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET / PUT` | `/api/profile` | Read or update bio, handle, theme, and bento layout |
| `POST` | `/api/profile/avatar` | Encrypt and upload user profile avatar |
| `GET` | `/api/username/check?username=...` | Instant username availability check |
| `GET / POST` | `/api/links` | List or create interactive link items |
| `PUT / DELETE` | `/api/links/[id]` | Update or delete a link item |
| `PUT` | `/api/links/reorder` | Update drag-and-drop sort order position |

### 📬 Verified Newsletter Engine
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/subscribe` | Submit email with real-time MX DNS & disposable inbox check |
| `GET` | `/api/subscribers` | List encrypted subscribers for creator's bio |
| `GET` | `/api/subscribers?format=csv` | 1-Click CSV export of verified audience |

### 📁 Encrypted Storage & CDN Streaming
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/storage/presign-upload` | Issue scoped presigned upload ticket |
| `GET` | `/api/storage/file/[...key]` | Global Edge CDN AES-256 streaming decrypt proxy (1-yr cache) |
| `DELETE` | `/api/storage/file` | Cryptographically validated multi-tenant file deletion |
| `GET / POST` | `/api/storage/cors` | View or push CORS configuration directly to B2 |

### 📊 DuckDB Analytics & Data Exports
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/analytics` | Fetch standard traffic summary and timeseries |
| `GET` | `/api/analytics/duckdb?days=30` | 24x7 Heatmap, Funnels, Retention Cohorts & SQL |
| `POST` | `/api/analytics/duckdb` | Trigger daily rollup event compaction (-98% storage) |
| `GET` | `/api/analytics/export?format=csv.gz` | High-compression GZIP CSV export |
| `GET` | `/api/analytics/export?format=ndjson.gz` | GZIP JSON-Lines for BigQuery / Snowflake |
| `GET` | `/api/analytics/export?format=duckdb` | DuckDB CLI automated loader script |

---

## 🧪 Quality Gates & Testing

LinkForge maintains strict test coverage and static analysis across all critical security, encryption, and analytics modules:

```bash
# Run Vitest test suite (145 tests covering auth, encryption, B2, duckdb)
npm test

# Run strict TypeScript typechecking
npm run typecheck

# Run production Next.js compilation
npm run build
```

---

## 🐳 Deployment Options

### 1. Vercel (Recommended)
Deploy directly to Vercel with zero server configuration. Ensure you add `AUTH_SECRET`, `DB_ENCRYPTION_KEY`, and `DATABASE_URL` in your Vercel Project Settings $\to$ Environment Variables.

### 2. Docker & Self-Hosted (VPS / Hetzner / AWS)
```bash
# Production stack: LinkForge + PostgreSQL
docker compose --profile postgres up -d

# Full stack with MinIO S3 storage + MailHog
docker compose --profile full up -d
```

---

## 📄 License

Distributed under the **MIT License**. Free for personal and commercial usage.
