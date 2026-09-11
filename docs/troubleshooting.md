# 🛠️ LinkForge Enterprise Troubleshooting & Error Resolution Guide

This exhaustive guide catalogs every potential setup, deployment, database, authentication, webhook, and build error encountered in LinkForge — along with exact root causes and 1-minute fixes.

---

## 📑 Table of Contents
1. [Database & Migration Errors](#1-database--migration-errors)
2. [Authentication & Signup Errors](#2-authentication--signup-errors)
3. [Webhook & Google Apps Script Errors](#3-webhook--google-apps-script-errors)
4. [Deployment & Build Errors (Vercel / Cloudflare / Netlify)](#4-deployment--build-errors)
5. [Storage & Media Upload Errors](#5-storage--media-upload-errors)
6. [Security & Rate Limiting Errors](#6-security--rate-limiting-errors)

---

## 1. Database & Migration Errors

### ❌ Error: `relation "subscribers" does not exist` or `relation "profiles" does not exist`
- **Cause**: The PostgreSQL database was freshly created on Neon / Supabase, but Drizzle migrations have not been pushed yet.
- **Immediate Fix**:
  1. LinkForge has built-in auto-migration on every request (`autoMigrate()`). Trigger it automatically by visiting any page.
  2. Or run manually in your terminal:
     ```bash
     npm run db:push
     # For Turso / SQLite:
     npm run db:push:turso
     ```

### ❌ Error: `column "meta_pixel_id" does not exist` (React Minified Error #441)
- **Cause**: Existing database created before the monetization patch was missing newly added columns.
- **Fix**: LinkForge includes a self-healing engine in `src/db/auto-migrate.ts` that detects missing columns and issues safe non-destructive `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS ...` commands automatically on startup. If running self-hosted, re-run `npm run db:push`.

### ❌ Error: `Neon connection timeout / terminating connection due to administrator command`
- **Cause**: Neon serverless Postgres suspends compute after 5 minutes of inactivity (Scale to Zero). Connecting without connection pooling causes slow cold-starts.
- **Fix**:
  1. Always use Neon's **Pooled connection string** (ends with `-pooler` in the host).
  2. In your `.env` or Vercel environment variables:
     ```env
     DATABASE_URL=postgresql://user:pass@ep-cool-fog-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

---

## 2. Authentication & Signup Errors

### ❌ Error: `Email domain "..." has no mail exchange (MX) servers configured`
- **Cause**: The user attempted to register or subscribe with a domain that has no active mail servers (e.g. `test.com`, `duku.com`, `example.com`).
- **Fix**: This is an intended security feature! LinkForge verifies real Google/Cloudflare DNS MX records to prevent dummy accounts. Use a genuine active email address (e.g., `@gmail.com`, `@outlook.com`, `@yourcompany.com`).

### ❌ Error: `Origin header missing — request must originate from the browser` (403 Forbidden)
- **Cause**: CSRF protection blocked a state-changing request (POST/PATCH/DELETE) because the `Origin` header was missing or did not match the `Host` header.
- **Fix**:
  - In browser: Ensure `NEXT_PUBLIC_APP_URL` matches your actual domain (e.g., `https://linkforge.xyz`).
  - In API scripts / Postman: Set `Origin: https://yourdomain.com` or use LinkForge API Key authentication via `/api/v1/*` routes (which use Bearer tokens instead of cookie sessions).

### ❌ Error: `Security verification failed. Please complete the challenge.` (ALTCHA)
- **Cause**: Proof-of-Work anti-bot protection failed or token was replayed.
- **Fix**: In development, ensure `ALTCHA_HMAC_KEY` is set in `.env` (defaults to a safe development fallback). Clear browser cache and ensure system clock is synchronized.

---

## 3. Webhook & Google Apps Script Errors

### ❌ Error: Webhook test returns `HTTP 302 Redirect Blocked`
- **Cause**: Google Apps Script web apps return a 302 redirect to `script.googleusercontent.com` upon receiving a POST request. Default fetch engines reject redirects to prevent SSRF attacks.
- **Fix**: LinkForge automatically handles this! LinkForge detects `script.google.com` URLs and enables `followSafeRedirects: true` inside `safeFetch()`, verifying destination IP safety before following.

### ❌ Error: Google Sheet not updating / Webhook returns `HTTP 401` or Google Login HTML
- **Cause**: When deploying the Google Apps Script Web App, **"Who has access"** was set to *"Only myself"*, requiring Google OAuth login.
- **Fix**:
  1. Open your Google Sheet ➔ **Extensions ➔ Apps Script**.
  2. Click **Deploy ➔ Manage deployments** (or *New deployment*).
  3. Set **Who has access** to **`Anyone`** (⚠️ Mandatory for automated webhooks).
  4. Copy the new Web App URL (`https://script.google.com/macros/s/.../exec`) into LinkForge.

---

## 4. Deployment & Build Errors

### ❌ Error: `Vercel Serverless Function size exceeds 250MB limit`
- **Cause**: Node.js dependencies (like `@swc/core`, `@esbuild`, or uploaded media) were traced into the serverless bundle.
- **Fix**: LinkForge's `next.config.ts` includes optimized exclusions:
  ```typescript
  outputFileTracingExcludes: {
    "**/*": ["./uploads/**/*", "./node_modules/@swc/**/*", "./node_modules/@esbuild/**/*"]
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@dnd-kit/core", "@dnd-kit/sortable", "drizzle-orm"]
  }
  ```

### ❌ Error: `Could not resolve pg-cloudflare` on Cloudflare Pages / OpenNext
- **Cause**: Cloudflare worker runtime requires native workerd shims.
- **Fix**: Pre-configured in `next.config.ts` via `outputFileTracingIncludes`:
  ```typescript
  outputFileTracingIncludes: {
    "**/*": ["./node_modules/pg-cloudflare/dist/**/*", "./node_modules/pg-cloudflare/esm/**/*"]
  }
  ```

---

## 5. Storage & Media Upload Errors

### ❌ Error: `403 Forbidden` on Direct Browser Upload (B2 / R2 / S3 CORS Error)
- **Cause**: Bucket does not have CORS enabled to allow `PUT` requests from your frontend domain.
- **Fix**: Add CORS rule to your S3 / B2 / R2 bucket:
  ```json
  [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
  ```

---

## 6. Security & Rate Limiting Errors

### ❌ Error: `429 Too Many Requests. Please try again in ... seconds.`
- **Cause**: Rate limit exceeded (Anti-DDoS / Brute-force protection).
  - Login / Signup: Max 10 per 15 min per IP, Max 5 per email.
  - Subscribe: Max 10 per 15 min per IP, Max 5 per target creator profile.
- **Fix**: Wait for the `Retry-After` window to expire. In local development, you can flush Redis or restart the server to clear in-memory sliding window counters.
