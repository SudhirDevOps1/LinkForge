<div align="center">

<br/>

<img src="https://img.shields.io/badge/Next.js-16.3_Turbopack-black?style=for-the-badge&logo=next.js" alt="Next.js">
<img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
<img src="https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
<img src="https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=for-the-badge&logo=drizzle" alt="Drizzle ORM">
<img src="https://img.shields.io/badge/Better_Auth-Enterprise-9333EA?style=for-the-badge" alt="Better Auth">
<img src="https://img.shields.io/badge/WebAuthn-Passkeys-0070F3?style=for-the-badge" alt="WebAuthn Passkeys">
<img src="https://img.shields.io/badge/ALTCHA-Proof_of_Work-10B981?style=for-the-badge" alt="ALTCHA PoW">
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">

<br/><br/>

# ⚡ LinkForge

### **The Enterprise Open-Source Link-in-Bio & Creator Platform**

One link. Every platform. Zero vendor lock-in.  
Runs on any database · Any object storage · Any cloud host · 100% self-hostable.

<br/>

[**Live Demo**](https://inkorge-demo.vercel.app) · [**Interactive Web Docs**](/docs) · [**GitHub Docs**](docs/) · [**Troubleshooting & Errors**](docs/troubleshooting.md) · [**Report Issue**](https://github.com/SudhirDevOps1/LinkForge/issues)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Enterprise Feature Matrix](#-enterprise-feature-matrix)
  - [🔐 Hardened Authentication & Better Auth Stack](#1--hardened-authentication--better-auth-plugin-stack)
  - [🛡️ Bot Defense & Rate Limiting](#2-️-bot-defense--rate-limiting)
  - [🔒 Zero-Knowledge Storage Bucket Encryption](#3--zero-knowledge-storage-bucket-encryption-file-cipher)
  - [📱 Multi-Device Responsive Presentation](#4--multi-device-responsive-presentation)
  - [🔗 Dynamic Link & Bento Builder](#5--dynamic-link--bento-builder)
  - [✍️ Serverless Object Storage Blog Engine](#6-️-serverless-object-storage-blog-engine)
  - [🛍️ Creator Monetization Studio](#7-️-creator-monetization-studio)
  - [📊 Privacy Analytics & OLAP Engine](#8--privacy-analytics--olap-engine)
  - [🗄️ Multi-Dialect Database (21 Tables)](#9-️-multi-dialect-database-21-tables)
  - [📦 Universal S3 Object Storage](#10--universal-s3-object-storage)
- [Quick Start](#-quick-start)
- [Configuration & Environment Variables](#-configuration--environment-variables)
- [Database Schema Reference](#-database-schema-reference-21-tables)
- [API Reference](#-api-reference)
- [Multi-Cloud Deployment](#-multi-cloud-deployment)
- [Documentation Index](#-documentation-index)
- [License](#-license)

---

## 🌟 Overview

**LinkForge** is a sovereign, production-ready link-in-bio builder and creator monetization storefront built with the modern web stack. It gives creators, developers, and businesses a high-converting digital home — without recurring platform subscriptions, proprietary data silos, or invasive third-party tracking.

### 🏆 Why Choose LinkForge?

* **Zero Vendor Lock-In**: Swap database engines and cloud storage providers with a single environment variable change.
* **Biometric Hardware Passkeys**: Instant, phishing-resistant WebAuthn logins via Touch ID, Face ID, Windows Hello, and YubiKeys.
* **Proof-of-Work Bot Defense**: Embedded ALTCHA cryptographic challenges eliminate bot spam and credential stuffing without tracking cookies or third-party CAPTCHAs.
* **Serverless Object Storage Blogging**: Store daily long-form blog articles directly in Backblaze B2 or Cloudflare R2 with dual manifest auto-healing and zero relational database bloat.
* **0% Platform Commission Monetization**: Sell courses, book paid 1:1 mentorship calls, distribute digital downloads, and accept direct payments via UPI QR and global tip jars.
* **Privacy-First Analytics**: In-browser DuckDB OLAP aggregation achieving **98%+ database space savings** with zero tracking cookies and salted SHA-256 IP hashes.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               LINKFORGE PRESENTATION LAYER                             │
│     Next.js 16 App Router · Tailwind CSS 4 · Adaptive Bento Grid · Desktop Glass Frame │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               SECURITY & BOT GATEWAY                                   │
│  • ALTCHA Proof-of-Work Verification      • Dual-Bucket Sliding Window Rate Limiting   │
│  • Constant-Time DUMMY_HASH Defense       • Zero-Knowledge AES-256-GCM db-cipher       │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  CORE APPLICATION ENGINES                              │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ 🔐 Better Auth Stack     │ ✍️ Daily Blog Engine         │ 🛍️ Creator Studio           │
│ • WebAuthn Passkeys      │ • S3/B2 Object Storage      │ • Video Courses & Syllabi     │
│ • RFC 6238 TOTP 2FA      │ • Dual Manifest Healing     │ • 1:1 Mentorship Booking      │
│ • Multi-Tenant Orgs      │ • Markdown Live Editor      │ • Digital File Fulfillment    │
│ • Anonymous Guest Trial  │ • Zero-Cache Dynamic Routes │ • Direct 0% Commission UPI    │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
                                            │
                                            ▼
┌───────────────────────────────────────────┴────────────────────────────────────────────┐
│                         MULTI-DIALECT DATABASE LAYER (21 TABLES)                       │
│      PostgreSQL (Self-hosted / Docker)  ·  Neon (Serverless HTTP)  ·  Supabase Pooler  │
│             Turso (libSQL Global Edge)  ·  Cloudflare D1 (Native Edge SQLite)          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Enterprise Feature Matrix

### 1. 🔐 Hardened Authentication & Better Auth Plugin Stack
* **Transparent AES-256 Database Encryption (`db-cipher`)**: All sensitive PII (`users.email`, `users.name`, `subscribers.email`, `subscribers.name`) is encrypted at rest in Neon DB / Postgres / SQLite. Emails are encrypted with deterministic AES-256-CBC (`enc:em:...`) and names with AES-256-GCM (`enc:v1:...`). Database inspection and SQL dumps reveal **zero raw personal data**.
* **Encrypted Drizzle Adapter**: Our custom `encryptedDrizzleAdapter` wraps `@better-auth/drizzle-adapter` to seamlessly transform queries (e.g. `WHERE email = ?` -> `WHERE email = enc:em:...`) and decrypt records in application memory so Better Auth plugins run with 100% native compatibility.
* **WebAuthn / FIDO2 Passkeys (`@better-auth/passkey`)**: Hardware-backed biometric authentication via Touch ID, Face ID, Windows Hello, and YubiKeys with public-key cryptographic verification.
* **Two-Factor Authentication (`twoFactor`)**: Zero-cost TOTP authenticator app support (Google Authenticator, Microsoft Authenticator, 1Password) with 10 offline recovery backup codes and visual QR Code generation.
* **Phone Number OTP (`phoneNumber`)**: Free multi-channel dispatch (WhatsApp webhooks, Telegram bots, or console outbox) without expensive SMS vendor fees.
* **Self-Sovereign 2FA Password Reset**: Users with active TOTP or backup codes can reset their credentials directly without third-party email dependencies.
* **Multi-Tenant Organizations (`organization`)**: Workspace management with team role hierarchies (`owner`, `admin`, `member`) and time-limited invitations.
* **Anonymous Guest Trials (`anonymous`)**: Instant creator customization exploration that converts seamlessly to permanent accounts.
* **Administrative Controls (`admin`)**: Role-based access control, user bans, and audit-friendly session impersonation.

### 2. 🛡️ Bot Defense & Rate Limiting
* **ALTCHA Proof-of-Work Shield**: Eliminates tracking-based CAPTCHAs by issuing SHA-256 cryptographic challenges solved client-side across Login, Signup, Password Reset, 2FA Reset, and Newsletter Subscriptions.
* **Dual-Bucket Sliding Window Rate Limiting**: Simultaneous protection across IP origin buckets and target account email buckets with standard RFC `Retry-After: <sec>` headers.
* **Client-Side Throttling & Cooldown UX**: Live 1-second countdown cooldown banner and reactively disabled submission controls after repeated failed attempts.
* **Generic Error Messages & Timing Attack Defense**: Constant-time `DUMMY_HASH` verification and generic error notifications ("Invalid email or password") eliminate user enumeration side channels.

### 3. 🔒 Zero-Knowledge Storage Bucket Encryption (`file-cipher`)
* **Payload Encryption at Rest**: Every media file, avatar, and document uploaded to Backblaze B2, S3, or local storage is encrypted before writing using AES-256-GCM with the `LENC\x01` binary magic header.
* **Zero-Leak Storage Security**: Direct inspection of the storage bucket or local directory reveals only unreadable ciphertext; files are decrypted on-the-fly only during authenticated proxy streaming or download.

### 4. 📱 Multi-Device Responsive Presentation
* **Adaptive Mobile-First Layout**: Sleek, thumb-friendly vertical links on compact viewports (< 640px).
* **Desktop Glassmorphism Framing**: Automatic transformation on tablets and wide screens into an elevated, centered glassmorphism canvas (`max-w-2xl`, subtle borders, backdrop-blur).
* **Ambient Lighting Glow**: Eliminates empty dark voids on widescreen displays with ambient blurred color orbs.
* **Dynamic Typography Scaling**: Display names, avatars, and bio descriptions scale seamlessly across mobile, desktop, and ultra-wide displays.

### 5. 🔗 Dynamic Link & Bento Builder
* **Interactive Bento Grid**: Switch between vertical list mode and masonry Bento grid layouts with standard, wide, tall, and hero cards.
* **12 Interactive Card Embeds**: YouTube player, Spotify streams, Twitter/X, Instagram, TikTok, GitHub repositories, PDF viewer, custom audio, email, phone, and standard links.
* **Drag-and-Drop Reordering**: Smooth animations powered by `@dnd-kit`.
* **Link Scheduling & Pinned Cards**: Automatic visibility triggers based on start and expiration dates, with pinned cards remaining fixed at the top.

### 6. ✍️ Serverless Object Storage Blog Engine
* **Direct Object Storage Persistence**: Long-form markdown articles and manifests are saved directly to your S3/B2 bucket (`blogs/${slug}/`).
* **Dual Manifest Auto-Healing**: Maintains manifest synchronization across both profile slugs and internal UUIDs, auto-repairing legacy links on-the-fly.
* **Instant Publication**: Uses Next.js dynamic routing with `revalidate = 0` and `Cache-Control: no-store` headers so new articles appear instantly.
* **In-App Markdown Studio**: Live side-by-side editing, cover image uploads, tag assignment, and reading time calculation.

### 7. 🛍️ Creator Monetization Studio
* **Multi-Module Courses**: Structured masterclasses with chapter breakdowns, lesson duration badges, and sample preview tags.
* **1:1 Mentorship Booking**: Dedicated consultation blocks with duration selectors and direct links to Cal.com, Calendly, or Google Meet.
* **Digital Download Fulfillment**: Sell engineering PDFs, design UI kits, and source code bundles with instant post-purchase delivery.
* **0% Commission Direct Payments**: Accept direct UPI peer-to-peer payments via QR code (Google Pay, PhonePe, Paytm) and global tip jars (Stripe, PayPal, Buy Me a Coffee).

### 8. 📊 Privacy Analytics & OLAP Engine
* **Zero Tracking Cookies**: 100% GDPR/CCPA compliant without cookie consent banners.
* **Salted SHA-256 IP Hashes**: Visitor IPs are hashed with server entropy; raw IP addresses are never saved to disk.
* **DuckDB In-Browser OLAP**: Query millions of visitor events using in-browser DuckDB WebAssembly.
* **Compact Daily Rollups**: Aggregates raw views into daily buckets, reducing database storage requirements by **over 98%**.

### 9. 🗄️ Multi-Dialect Database (21 Tables)
* **Unified Query Interface**: Powered by Drizzle ORM for PostgreSQL and SQLite.
* **Zero-Config Auto-Migrator (`src/db/auto-migrate.ts`)**: Automatically provisions and verifies all 21 tables during cold starts.
* **Single-Click Bootstrap Scripts**: Includes [`neon-reset.sql`](neon-reset.sql) and [`scripts/neon-reset.sql`](scripts/neon-reset.sql) for instant cloud database resets.

### 10. 📦 Universal S3 Object Storage
* **Universal Adapter Interface**: Switch seamlessly between Backblaze B2, Cloudflare R2, AWS S3, MinIO, Vercel Blob, and Local Disk.
* **Direct Client PUT**: Browser uploads stream directly to storage buckets using short-lived presigned tickets.
* **Fail-Closed Magic Byte Validation**: Protects against executable spoofing by validating binary signatures before committing records.
* **Private Proxy Streaming**: Streams private media through `/api/file/[...key]` with HTTP 206 Range seeking and immutable caching.

---

## 💻 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/SudhirDevOps1/LinkForge.git
cd LinkForge
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment file and configure your credentials:
```bash
cp .env.example .env
```

Generate your cryptographic secrets:
```bash
# Generate 32 random bytes for BETTER_AUTH_SECRET and AUTH_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Configuration & Environment Variables

```env
# =============================================================================
# 🔐 Authentication (Better Auth & Core)
# =============================================================================
BETTER_AUTH_SECRET="your-32-byte-secret-hex"
BETTER_AUTH_URL="http://localhost:3000"
AUTH_SECRET="your-32-byte-secret-hex"

# =============================================================================
# 🛡️ ALTCHA Proof-of-Work Bot Defense
# =============================================================================
ALTCHA_HMAC_KEY="your-altcha-hmac-secret"

# =============================================================================
# 🗄️ Database Configuration
# Options: postgres | neon | supabase | turso | d1
# =============================================================================
DATABASE_PROVIDER="postgres"
DATABASE_URL="postgresql://postgres:password@127.0.0.1:5432/linkforge"

# Neon Serverless PostgreSQL:
# DATABASE_PROVIDER="neon"
# NEON_DATABASE_URL="postgresql://user:pass@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Turso SQLite:
# DATABASE_PROVIDER="turso"
# TURSO_DATABASE_URL="libsql://your-db.turso.io"
# TURSO_AUTH_TOKEN="your-turso-token"

# =============================================================================
# 📦 Object Storage Configuration
# Options: local | b2 | r2 | s3 | minio | vercel-blob
# =============================================================================
STORAGE_PROVIDER="local"
UPLOAD_DIR="./uploads"

# Backblaze B2 (10 GB Free):
# STORAGE_PROVIDER="b2"
# B2_APPLICATION_KEY_ID="004..."
# B2_APPLICATION_KEY="K004..."
# B2_BUCKET_NAME="linkforge-assets"
# B2_REGION="us-west-004"

# Cloudflare R2 (Zero Egress):
# STORAGE_PROVIDER="r2"
# R2_ACCOUNT_ID="..."
# R2_ACCESS_KEY_ID="..."
# R2_SECRET_ACCESS_KEY="..."
# R2_BUCKET="linkforge"
```

---

## 📋 Database Schema Reference (21 Tables)

| # | Table Name | Purpose & Primary Responsibilities |
|---|---|---|
| **1** | `users` | Primary user identity, role (`user`/`admin`), 2FA flag, account ban controls, encrypted PII. |
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
| **13** | `analytics_rollups` | Daily OLAP aggregate buckets (profile, date, device, country) — **98%+ DB space savings**. |
| **14** | `subscribers` | Newsletter audience collected directly from creator bio profiles. |
| **15** | `media_files` | Registered assets (PDFs, images, audio, video) with storage keys and public URLs. |
| **16** | `upload_tickets` | Time-limited presigned upload tokens ensuring authenticated direct-to-cloud uploads. |
| **17** | `webhooks` | Automated event delivery endpoints with HMAC-SHA256 signatures. |
| **18** | `api_keys` | Developer REST access keys (prefix-indexed, hashed with SHA-256). |
| **19** | `team_members` | Profile-level collaborators (`editor`, `analyst`). |
| **20** | `mail_outbox` | Resilient local mail queue for asynchronous SMTP delivery. |
| **21** | `password_reset_tokens` | Single-use, time-limited password recovery tokens. |

---

## 🌐 API Reference

| Route | Method | Description |
|---|---|---|
| `/api/auth/[...all]` | `GET`, `POST` | Better Auth catch-all endpoint (Passkeys, 2FA, Orgs, Sessions) |
| `/api/auth/altcha` | `GET`, `POST` | ALTCHA challenge generation and Proof-of-Work validation |
| `/api/profile` | `GET`, `PATCH` | Fetch and update authenticated creator profile |
| `/api/links` | `GET`, `POST` | Fetch and create bio links |
| `/api/links/[id]` | `PATCH`, `DELETE` | Update link properties, schedule, or remove link |
| `/api/links/reorder` | `POST` | Update display order of links via drag-and-drop |
| `/api/blog` | `GET`, `POST` | Retrieve author post manifest or publish post to object storage |
| `/api/blog/[postSlug]` | `GET`, `DELETE` | Fetch post markdown body or delete post object |
| `/api/media/presign` | `POST` | Generate authenticated S3 presigned upload ticket |
| `/api/media/complete` | `POST` | Commit upload ticket with magic byte verification |
| `/api/file/[...key]` | `GET` | Stream private storage assets with HTTP 206 Range seeking |
| `/api/analytics` | `GET` | Retrieve aggregate analytics and device breakdowns |
| `/api/analytics/duckdb`| `GET` | Stream raw event parquet batches for in-browser OLAP |
| `/api/health` | `GET` | Unauthenticated system and database health check probe |

---

## ☁️ Multi-Cloud Deployment

| Target | Recommended Setup | Commands |
|---|---|---|
| **Vercel** | Neon Postgres + Backblaze B2 | `vercel --prod` |
| **Cloudflare Pages** | Cloudflare D1 + Cloudflare R2 | `npx opennextjs-cloudflare build && npx wrangler pages deploy` |
| **Netlify** | Neon Postgres + Backblaze B2 | `netlify deploy --prod` |
| **Railway** | Managed Postgres + S3 | Connect GitHub repo in Railway UI |
| **Render** | Managed Postgres + S3 | Connect GitHub repo in Render UI |
| **Docker** | Self-Hosted Compose | `docker compose up -d` |

---

## 📚 Documentation Index

For in-depth architectural guides, refer to the [`docs/`](docs/) directory:

* [**Authentication & Passkeys**](docs/auth.md) — Better Auth, WebAuthn, TOTP 2FA, and multi-tenant organizations.
* [**Database Architecture**](docs/database.md) — 21-table schema, multi-dialect Drizzle setup, and auto-migration.
* [**Storage Providers**](docs/storage.md) — Universal S3 adapter for Backblaze B2, Cloudflare R2, AWS S3, and MinIO.
* [**Media & Upload Engine**](docs/media.md) — Presigned tickets, magic byte verification, and stream proxy.
* [**Security Model**](docs/security.md) — ALTCHA PoW, dual-bucket rate limits, constant-time defenses, and encryption.
* [**Serverless Daily Blog**](docs/daily-blog-b2.md) — Dual manifest auto-healing, S3 blog storage, and live markdown studio.
* [**Creator Monetization**](docs/superprofile-monetization.md) — Courses, 1:1 mentorship calls, downloads, and direct payments.
* [**Multi-Cloud Deployment**](docs/deployment.md) — Step-by-step guides for Vercel, Cloudflare, Netlify, Railway, and Docker.
* [**Troubleshooting & Error Guide**](docs/troubleshooting.md) — Exhaustive 1-minute solutions for database migrations, DNS MX checks, CSRF, ALTCHA, and Webhook/Google Apps Script errors.
* [**Production Readiness**](docs/production.md) — Operational checklist, automated backups, and health monitoring.

---

## 📄 License

LinkForge is licensed under the [MIT License](LICENSE).  
Contributions and pull requests are welcome!
