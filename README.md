<div align="center">

<br/>

<img src="https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js" alt="Next.js">
<img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
<img src="https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
<img src="https://img.shields.io/badge/DrizzleORM-0.45-C5F74F?style=for-the-badge" alt="Drizzle ORM">
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">

<br/><br/>

# ⚡ LinkForge

### **One link. Every platform. Zero lock-in.**

Advanced link-in-bio builder — runs on any database, any cloud, any storage.  
100% open-source · Self-host anywhere · Privacy-first by design.

<br/>

[**Live Demo**](https://inkorge-demo.vercel.app) · [**GitHub**](https://github.com/SudhirDevOps1/LinkForge) · [**Report Bug**](https://github.com/SudhirDevOps1/LinkForge/issues) · [**Request Feature**](https://github.com/SudhirDevOps1/LinkForge/issues)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Providers](#database-providers)
- [Storage Providers](#storage-providers)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [Documentation](#documentation)
- [License](#license)

---

## Overview

**LinkForge** is a production-grade, open-source link-in-bio platform built with the modern web stack. It gives creators, developers, and businesses a fully sovereign digital presence page — without subscriptions, vendor lock-in, or data held hostage on third-party servers.

Unlike cloud-only alternatives, LinkForge is designed to be **self-hostable from day one**: swap databases, storage backends, and hosting platforms using a single environment variable. The same codebase runs on Vercel, Cloudflare Workers, Netlify, Railway, Render, and Docker — with zero code changes.

**What makes it different:**

| Capability | Detail |
|---|---|
| 🗄️ Multi-database | Neon, Turso, Cloudflare D1, Supabase, Postgres — one env var |
| 📦 Multi-storage | Backblaze B2, Cloudflare R2, AWS S3, MinIO, Vercel Blob, local disk |
| ☁️ Multi-cloud | Vercel, Cloudflare Pages, Netlify, Railway, Render, Docker |
| 🔒 Privacy-first | Zero cookies · Zero raw IP storage · Salted SHA-256 IP hashing |
| 📝 Blog engine | Built-in markdown blog with live editor, drafts, and public reader |
| 💰 Creator monetization | Digital products, courses, and download gating via creator studio |
| 📊 Real analytics | Clicks, views, devices, geo, referrers — OLAP-compressed rollups |
| 🎨 Deep theming | 12 themes, bento grid, custom accent/font/radius per profile |

---

## Features

### 🔗 Link Management
- Unlimited links with **drag-and-drop reordering** (dnd-kit)
- **12 link types**: standard, YouTube embed, Spotify embed, Twitter/X, Instagram, TikTok, GitHub, PDF, audio player, video player, email, phone
- **Bento grid layout** — standard / wide / tall / feature card sizes
- **Link scheduling** — show after a date, hide after expiry
- **Pin links** to keep them at the top regardless of sort order
- Per-link toggle (active/inactive) without deleting
- Custom thumbnail upload per link card

### 🎨 Appearance & Theming
- **12 built-in themes**: Midnight, Aurora, Cyber Neon, Ocean Depth, Forest Dusk, Solar Flare, Rose Gold, Arctic Ice, Lava, Sage, Dusk Purple, Monochrome
- **Two layout modes**: List (vertical stack) and Bento (masonry grid)
- **Per-profile design overrides**: accent color, border radius, font scale, icon size
- **Announcement banner** with emoji, link, and auto-expiry date
- Live **phone preview** in the dashboard (no save required to see changes)
- Custom **OG image** upload for social sharing cards
- **SEO controls**: custom title, description, noIndex toggle

### 📊 Privacy-First Analytics
- Page views, link clicks, unique visitors
- Device breakdowns (mobile / tablet / desktop)
- Country geo-location (no raw IP stored — salted SHA-256 hash only)
- Browser and OS breakdown
- Referrer tracking
- **OLAP daily rollups** — 98% database space savings vs raw event rows
- **DuckDB-powered** in-browser analytics view with Recharts visualizations
- Configurable data retention window (default 30 days for raw events)

### ✍️ Blog Studio
- Full **markdown blog editor** with live preview
- Draft / publish workflow
- Slug auto-generation from title
- Public reader page at `/{username}/blog/{post-slug}`
- Dual-manifest storage (ID + slug) for zero-miss resolution
- Compatible with local disk, Backblaze B2, R2, S3, and MinIO

### 💰 Creator Studio (Monetization)
- **Digital product listings** with description, price, and file attachment
- **Course creation** with module/lesson structure
- **Download gating** — attach media files to products
- Shareable product pages

### 🔌 Integrations Hub
- **20+ platform integrations**: YouTube, Spotify, GitHub, Twitter/X, Instagram, TikTok, LinkedIn, Twitch, Discord, Telegram, WhatsApp, Snapchat, Pinterest, Behance, Dribbble, Substack, Medium, Dev.to, Ko-fi, and more
- OAuth-based external auth integrations (GitHub, Google)
- Per-integration enable/disable toggle

### 📧 Newsletter & Subscribers
- Public **email subscribe widget** on every profile page
- Subscriber management dashboard (view, export, delete)
- Privacy-safe: subscriber IP hashed, not stored raw

### 📁 Media Manager
- Drag-and-drop file uploader
- Supported types: images (JPEG, PNG, WebP, GIF, AVIF), PDF, audio (MP3, WAV, OGG, AAC, FLAC), video (MP4, WebM, MOV, AVI, MKV), documents (DOCX, XLSX, PPTX), ZIP, CSV, Markdown
- Up to **100 files per profile** (configurable)
- Default **50 MB per file** (configurable via env)
- **Presigned S3 uploads** — browser uploads directly to storage, server only verifies
- Full **media library** with search, sort, and one-click copy URL

### 🔐 Security & Privacy
- Built-in **email + password authentication** with bcrypt hashing
- **Session-based auth** (Lucia-style opaque token sessions)
- Password reset via secure one-time tokens
- **Profile password protection** (bcrypt-gated private profiles)
- AES-256-GCM **data-at-rest encryption** for sensitive storage keys in database
- **API key management** — personal `lfk_` prefixed keys, SHA-256 hash stored (raw key shown once)
- **HMAC-signed webhooks** for click/view events
- Role-based access: `owner`, `editor`, `viewer`
- `noIndex` flag to hide profiles from search engines
- Zero cookies by default — session stored in `HttpOnly` cookie

### 🌐 Public Profile Page
- SEO-optimized OpenGraph image generation per profile
- QR code generator for profile URL
- vCard download button
- Share sheet (Web Share API)
- Password gate for private profiles
- Dynamic sitemap and robots.txt

### 🏗️ Developer Features
- **REST API** (`/api/v1/links`, `/api/v1/profile`) with Bearer token auth
- **Webhooks** — HMAC-signed outbound HTTP callbacks on link click/page view events
- **Health endpoint** (`/api/health`) — database, storage, and system status
- Database admin endpoint (`/api/db`) for schema inspection
- **Team collaboration** — invite team members (owner / editor / viewer roles)
- Self-hosted mail outbox — password reset emails queued when SMTP is not configured

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router, Turbopack) | 16.3.4 |
| **Language** | TypeScript | 5.9.3 |
| **Styling** | Tailwind CSS | 4.1.17 |
| **ORM** | Drizzle ORM | 0.45.2 |
| **UI Components** | Lucide React icons | 1.43.0 |
| **Charts** | Recharts | 3.10.1 |
| **Drag & Drop** | dnd-kit/core + dnd-kit/sortable | 6.3.1 / 10.0.0 |
| **Toasts** | Sonner | 2.0.8 |
| **Validation** | Zod | 4.5.4 |
| **QR Codes** | qrcode + qrcode.react | 1.5.4 / 4.2.0 |
| **S3 Client** | AWS SDK v3 (S3 + Presigner) | 3.1128.0 |
| **Runtime** | Node.js 22 / Cloudflare Workers | — |
| **Test Runner** | Vitest | 5.0.0 |
| **DB Migration** | drizzle-kit | 0.31.10 |
| **Linter** | ESLint (eslint-config-next) | 9.39.4 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        LinkForge                            │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │
│  │ Landing Page │   │  Dashboard   │   │Public Profile│   │
│  │     /        │   │  /dashboard  │   │   /[slug]    │   │
│  └──────────────┘   └──────┬───────┘   └──────────────┘   │
│                             │                               │
│         ┌───────────────────┼──────────────────┐            │
│         ▼                   ▼                  ▼            │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Auth Layer │  │   API Routes     │  │ Blog Engine  │  │
│  │  (sessions) │  │  /api/* /api/v1  │  │  /api/blog   │  │
│  └─────────────┘  └────────┬─────────┘  └──────────────┘  │
│                             │                               │
│         ┌───────────────────┼──────────────────┐            │
│         ▼                   ▼                  ▼            │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Database   │  │ Storage Adapter  │  │  Analytics   │  │
│  │  Adapter    │  │ (multi-backend)  │  │  Engine      │  │
│  └──────┬──────┘  └────────┬─────────┘  └──────────────┘  │
│         │                   │                               │
│  ┌──────┴──────────────┐    │  ┌───────────────────────┐   │
│  │ Neon │ Turso │ D1   │    │  │ B2 │ R2 │ S3 │ Local │   │
│  │ PG   │ Supabase     │    │  │ MinIO │ Vercel Blob   │   │
│  └──────────────────────┘   └──└───────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Database abstraction**: Drizzle ORM with separate schema files for PostgreSQL-compatible (`schema.ts`) and SQLite-compatible (`schema.sqlite.ts`) dialects. App code is fully dialect-agnostic.
- **Storage abstraction**: Two storage interfaces — `StorageService` (media uploads) and `StorageAdapter` (blog manifests). Both are lazy-loaded via `src/lib/storage/index.ts`, selected by `STORAGE_DRIVER` env.
- **Analytics**: Raw `events` table with configurable retention + `analytics_rollups` table for compressed daily aggregates. Rollup strategy achieves 98%+ space savings.
- **Session management**: Opaque random token sessions stored in `sessions` table. Raw IP never stored — salted SHA-256 hash only. AES-256-GCM encryption on sensitive DB columns.
- **Blog storage**: Dual manifest mirroring — every blog manifest is written to both `blogs/{profileId}/manifest.json` and `blogs/{profileSlug}/manifest.json`, ensuring zero-miss resolution from either path.

---

## Getting Started

### Prerequisites

- Node.js 22+ (see `.nvmrc`)
- A supported database (see [Database Providers](#database-providers))
- `npm` or compatible package manager

### Local Development (SQLite, Zero Config)

```bash
# 1. Clone the repository
git clone https://github.com/SudhirDevOps1/LinkForge.git
cd LinkForge

# 2. Install dependencies
npm install

# 3. Create your local environment file
cp .env.example .env
```

Edit `.env` and set the minimum required variables for local development:

```env
# Use local SQLite — no external database needed
DATABASE_PROVIDER=turso
TURSO_DATABASE_URL=file:local.db

# Use local disk storage — no cloud account needed
STORAGE_PROVIDER=local
STORAGE_DRIVER=local

# Generate a secure secret:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET=your_64_char_hex_secret_here

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
# 4. Push the database schema
npm run db:push

# 5. Start the development server (Turbopack)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign up at `/signup` to create your first account.

### Database Schema Commands

| Command | Provider |
|---|---|
| `npm run db:push` | Default (`drizzle.config.ts`) |
| `npm run db:push:turso` | Turso / LibSQL |
| `npm run db:push:d1` | Cloudflare D1 |
| `npm run db:migrate` | Auto-migration script |

---

## Environment Variables

A complete reference is available in [`.env.example`](.env.example). Below is a grouped summary.

### 1. Database

| Variable | Required | Description |
|---|---|---|
| `DATABASE_PROVIDER` | Yes | `postgres` · `neon` · `supabase` · `turso` · `d1` |
| `DATABASE_URL` | Postgres only | Full PostgreSQL connection string |
| `TURSO_DATABASE_URL` | Turso only | `libsql://…turso.io` or `file:local.db` |
| `TURSO_AUTH_TOKEN` | Turso remote | JWT auth token from Turso CLI |

### 2. Authentication

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | **Critical** | 32-byte hex secret for session signing and IP hashing |
| `AUTH_PROVIDER` | Yes | `builtin` · `neon` · `supabase` · `clerk` · `nextauth` |
| `DB_ENCRYPTION_KEY` | Optional | AES-256 key for at-rest column encryption (falls back to `AUTH_SECRET`) |

### 3. Storage

| Variable | Required | Description |
|---|---|---|
| `STORAGE_PROVIDER` / `STORAGE_DRIVER` | Yes | `local` · `b2` · `r2` · `s3` · `minio` · `vercel-blob` |
| `B2_BUCKET_NAME` | B2 only | Backblaze B2 bucket name |
| `B2_ENDPOINT` | B2 only | S3 endpoint (e.g. `s3.us-east-005.backblazeb2.com`) |
| `B2_REGION` | B2 only | Region code (e.g. `us-east-005`) |
| `B2_APPLICATION_KEY_ID` | B2 only | Application key ID |
| `B2_APPLICATION_KEY` | B2 only | Application key secret |
| `NEXT_PUBLIC_MAX_UPLOAD_MB` | Optional | Max upload size in MB (default `50`) |
| `UPLOAD_DIR` | Local only | Local upload directory (default `./uploads`) |

### 4. Deployment

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Production URL without trailing slash |
| `DEPLOYMENT_PLATFORM` | Optional | `vercel` · `cloudflare` · `netlify` · `railway` · `render` |
| `APP_DOMAIN` | Optional | Custom root domain (e.g. `yourdomain.com`) |

### 5. Analytics

| Variable | Default | Description |
|---|---|---|
| `ANALYTICS_ENABLED` | `true` | Enable/disable event tracking |
| `ANALYTICS_RETENTION_DAYS` | `30` | Days before raw events are pruned |
| `API_CORS_ORIGINS` | `*` | Allowed origins for `/api/v1/*` endpoints |

---

## Database Providers

| Provider | Free Tier | Best For |
|---|---|---|
| **Neon** *(recommended for Vercel)* | 0.5 GB | Serverless Postgres, auto-scaling |
| **Supabase** | 500 MB | Postgres + built-in auth + storage |
| **Turso (LibSQL)** | 1 GB | Edge SQLite, ultra-low latency |
| **Cloudflare D1** | 5 GB | Cloudflare Workers deployments |
| **Local Postgres** | Unlimited | Self-hosted, full control |
| **Local SQLite** | Unlimited | Development, Docker, zero-config |

---

## Storage Providers

| Provider | Free Tier | Notes |
|---|---|---|
| **Backblaze B2** | 10 GB | S3-compatible, private vault, presigned uploads |
| **Cloudflare R2** | 10 GB | Zero egress fees, S3-compatible |
| **AWS S3** | Pay-as-you-go | Industry standard, all regions |
| **MinIO** | Unlimited | Self-hosted S3-compatible object storage |
| **Vercel Blob** | 1 GB | Zero-config on Vercel deployments |
| **Local Disk** | Unlimited | Default for development and Docker |

Auto-detection is built in — if `B2_APPLICATION_KEY_ID` is present, B2 is selected automatically. Override any time with `STORAGE_DRIVER=local`.

---

## Deployment

### Vercel

```bash
npm run deploy:vercel
```

Set all environment variables in **Project Settings → Environment Variables**.  
Mark `AUTH_SECRET`, `DB_ENCRYPTION_KEY`, and `B2_APPLICATION_KEY` as **Sensitive**.

### Cloudflare Workers (Edge)

```bash
npm run deploy:cloudflare
```

Configure `wrangler.toml` with your Cloudflare account ID and D1 database binding.

### Netlify

```bash
npm run deploy:netlify
```

### Docker (Self-Hosted)

```bash
# Build the production image
docker build -t linkforge .

# Run with local SQLite + disk storage
docker run -p 3000:3000 \
  -e AUTH_SECRET=your_secret \
  -e DATABASE_PROVIDER=turso \
  -e TURSO_DATABASE_URL=file:/data/local.db \
  -e STORAGE_PROVIDER=local \
  -e NEXT_PUBLIC_APP_URL=https://yourdomain.com \
  -v linkforge-data:/data \
  linkforge
```

A [`docker-compose.yml`](docker-compose.yml) is included for local multi-container setups.

### Railway / Render

Deploy using the Dockerfile directly. Set environment variables in the platform dashboard. Both platforms support persistent volumes for local storage mode.

---

## API Reference

### Public REST API (`/api/v1`)

All endpoints require `Authorization: Bearer lfk_…` (generate from dashboard **Settings → API Keys**).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/profile` | Authenticated user's profile data |
| `GET` | `/api/v1/links` | All links for the authenticated profile |

### Internal API Routes

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST/PATCH/DELETE` | `/api/links` | Link CRUD |
| `GET/POST/PATCH` | `/api/profile` | Profile CRUD |
| `GET/POST/DELETE` | `/api/blog` | Blog post management |
| `GET/PATCH/DELETE` | `/api/blog/[postSlug]` | Single blog post |
| `GET/POST/DELETE` | `/api/media` | Media library management |
| `POST` | `/api/file` | Presigned upload ticket creation |
| `POST` | `/api/files/complete` | Complete presigned upload |
| `GET/POST/DELETE` | `/api/subscribers` | Subscriber management |
| `POST` | `/api/subscribe` | Public subscribe endpoint |
| `GET` | `/api/analytics` | Analytics data |
| `GET/POST/DELETE` | `/api/integrations` | Platform integrations |
| `GET/POST/DELETE` | `/api/keys` | API key management |
| `GET/POST/DELETE` | `/api/webhooks` | Webhook management |
| `GET/POST` | `/api/account` | Account settings |
| `GET` | `/api/health` | System health check |
| `GET/POST` | `/api/storage/cors` | B2 CORS configuration |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/signup` | Create account |
| `POST` | `/api/auth/logout` | Sign out |
| `POST` | `/api/auth/reset-password` | Password reset flow |
| `GET` | `/api/username` | Check username availability |
| `GET` | `/r/[id]` | Click-tracking redirect (records event → 307) |

### Webhooks

LinkForge sends HMAC-SHA256 signed `POST` requests to your configured endpoint on `click` and `view` events.

```json
{
  "event": "click",
  "profileId": "uuid",
  "linkId": "uuid",
  "timestamp": "2026-09-10T00:00:00Z"
}
```

Verify authenticity using the `X-LinkForge-Signature` header with your webhook secret.

---

## Project Structure

```
linkforge/
├── src/
│   ├── app/
│   │   ├── (auth)/               # Login, signup, password reset pages
│   │   ├── (dashboard)/          # Protected dashboard routes
│   │   │   └── dashboard/
│   │   │       ├── page.tsx      # Dashboard home (link editor + live preview)
│   │   │       ├── analytics/    # Analytics dashboard
│   │   │       ├── appearance/   # Theme & layout editor
│   │   │       ├── blog/         # Blog studio
│   │   │       ├── integrations/ # Integrations hub
│   │   │       ├── links/        # Full-page link editor
│   │   │       ├── media/        # Media library
│   │   │       ├── settings/     # Account, API keys, webhooks, team
│   │   │       ├── store/        # Creator studio (products, courses)
│   │   │       └── subscribers/  # Subscriber management
│   │   ├── (public)/
│   │   │   └── [slug]/           # Public profile page
│   │   │       └── blog/         # Public blog reader
│   │   ├── api/                  # All API route handlers (20 groups)
│   │   ├── docs/                 # In-app documentation pages
│   │   ├── privacy/              # Privacy Policy page
│   │   ├── terms/                # Terms of Service page
│   │   └── page.tsx              # Public landing page
│   ├── components/
│   │   ├── appearance-editor.tsx     # Full theming UI (12 themes, custom design)
│   │   ├── bio-renderer.tsx          # Public profile renderer (list + bento)
│   │   ├── blog-studio.tsx           # Blog editor (markdown, draft/publish)
│   │   ├── creator-studio.tsx        # Creator monetization (products, courses)
│   │   ├── dashboard-shell.tsx       # Dashboard layout + collapsible sidebar
│   │   ├── duckdb-analytics-view.tsx # DuckDB-powered analytics dashboard
│   │   ├── integrations-hub.tsx      # 20+ platform integrations
│   │   ├── links-editor.tsx          # Drag-and-drop link manager
│   │   ├── media-manager.tsx         # File upload + media library
│   │   ├── phone-preview.tsx         # Live mobile preview panel
│   │   ├── settings-client.tsx       # Account, API keys, webhooks, team
│   │   ├── analytics-charts.tsx      # Recharts visualization components
│   │   └── landing/                  # Landing page section components
│   ├── db/
│   │   ├── schema.ts             # PostgreSQL schema (Drizzle)
│   │   ├── schema.sqlite.ts      # SQLite schema (Turso / D1)
│   │   ├── index.ts              # DB connection factory
│   │   └── providers/            # Per-provider adapters
│   ├── lib/
│   │   ├── blog.ts               # Blog manifest service (dual-path resolution)
│   │   ├── themes.ts             # 12 theme definitions
│   │   ├── auth/                 # Auth helpers + provider abstraction
│   │   ├── storage/              # Storage adapters (b2, r2, s3, local, blob)
│   │   └── api.ts                # Shared API utilities + rate limiting
│   └── config/
│       └── storage.config.ts     # Storage provider selection + CORS helpers
├── docs/                         # Developer documentation
├── scripts/
│   ├── auto-migrate.ts           # Cross-provider DB migration runner
│   └── cleanup-uploads.ts        # Orphaned file cleanup utility
├── tests/                        # Vitest test suite
├── Dockerfile                    # Multi-stage production Docker image
├── docker-compose.yml            # Local multi-container setup
├── wrangler.toml                 # Cloudflare Workers configuration
├── netlify.toml                  # Netlify configuration
├── vercel.json                   # Vercel configuration
├── drizzle.config.ts             # Drizzle config (Postgres)
├── drizzle.config.turso.ts       # Drizzle config (Turso)
├── drizzle.config.d1.ts          # Drizzle config (Cloudflare D1)
└── .env.example                  # Complete environment variable reference
```

---

## Database Schema

LinkForge uses **14 database tables**:

| Table | Purpose |
|---|---|
| `users` | User accounts (email, password hash, avatar, role) |
| `sessions` | Opaque session tokens with IP hash and expiry |
| `password_reset_tokens` | Single-use password reset tokens (hashed) |
| `profiles` | Public bio pages (slug, theme, layout, SEO, privacy, announcement) |
| `links` | Individual link cards (type, schedule, pin, size, thumbnail) |
| `events` | Raw analytics events (view/click, device, country, referrer) |
| `analytics_rollups` | Compressed daily OLAP aggregates (98% space savings) |
| `webhooks` | Outbound HTTP webhooks with HMAC signing secrets |
| `api_keys` | Personal API keys (prefix displayed, SHA-256 hash stored only) |
| `team_members` | Collaborative access (owner / editor / viewer) |
| `media_files` | File metadata and storage URLs |
| `upload_tickets` | Single-use presigned upload authorization records |
| `subscribers` | Newsletter subscribers from public profile page |
| `mail_outbox` | Dev-mode email queue (no SMTP required) |

---

## Contributing

Contributions, bug reports, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

**Before submitting:**
- Run `npm run typecheck` — must pass with 0 errors
- Run `npm run lint` — must pass with 0 warnings
- Run `npm run build` — must compile all routes successfully
- Add tests in `tests/` for any new business logic

**Code Style:**
- TypeScript strict mode — no `any` types
- All user-facing strings in English only
- Error messages must be descriptive and actionable
- Components default to Server Components; add `"use client"` only when needed

---

## Documentation

| Document | Location |
|---|---|
| Environment Variables Reference | [`.env.example`](.env.example) |
| Authentication Guide | [`docs/auth.md`](docs/auth.md) |
| Database Setup | [`docs/database.md`](docs/database.md) |
| Storage Configuration | [`docs/storage.md`](docs/storage.md) |
| Media Upload Guide | [`docs/media.md`](docs/media.md) |
| Deployment Guide | [`docs/deployment.md`](docs/deployment.md) |
| Security Architecture | [`docs/security.md`](docs/security.md) |
| Environment Setup Guide | [`ENV_SETUP_GUIDE.md`](ENV_SETUP_GUIDE.md) |

---

## License

[MIT](LICENSE) © 2026 Sudhir Singh

---

<div align="center">

Built with ❤️ using Next.js, Drizzle ORM, and Tailwind CSS.

**[⭐ Star this repo](https://github.com/SudhirDevOps1/LinkForge)** if LinkForge saves you time!

</div>
