# 🚀 LinkForge — Complete Production Environment & Deployment Guide

This guide details **every environment variable**, **where to get each value** from provider consoles, **what each value looks like**, whether it should be configured as a **Secret** or **Plain Text** in Vercel, and the **exact post-deployment checklist** to ensure all features (Database, B2 Storage, DuckDB Analytics, CORS) work seamlessly.

---

## 📑 Table of Contents
1. [Environment Variables Matrix](#-environment-variables-matrix)
2. [Step 1: Database Setup (Neon Postgres)](#step-1-database-setup-neon-serverless-postgres)
3. [Step 2: Auth & Session Secret](#step-2-auth--session-secret-auth_secret)
4. [Step 3: Object Storage Vault (Backblaze B2)](#step-3-object-storage-vault-backblaze-b2)
5. [Step 4: Vercel Deployment & Configuration](#step-4-vercel-deployment--configuration)
6. [Step 5: Post-Deployment One-Click Verification](#step-5-post-deployment-one-click-verification)
7. [Ready-to-Copy Production `.env` Template](#-ready-to-copy-production-env-template)

---

## 📊 Environment Variables Matrix

| Variable Name | Required | Vercel Type | Description | Example / Recommended Value |
| :--- | :---: | :---: | :--- | :--- |
| **`DATABASE_URL`** | **YES** | 🔒 **SECRET** | Primary PostgreSQL connection string | `postgresql://neondb_owner:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| **`DATABASE_PROVIDER`** | **YES** | 📄 Plain Text | Database engine dialect | `neon` *(or `postgres`, `supabase`, `turso`)* |
| **`AUTH_SECRET`** | **YES** | 🔒 **SECRET** | 32-byte hex secret for session signing & IP hashing | `b79a32c4e1f85d9082ac3f0982d61b3e7a1c5d9e0f2b4c6e8a1d3f5b7c9e1a3d` |
| **`AUTH_PROVIDER`** | **YES** | 📄 Plain Text | Authentication provider | `builtin` |
| **`STORAGE_PROVIDER`** | **YES** | 📄 Plain Text | Object storage driver | `b2` *(or `local`, `r2`, `s3`, `minio`)* |
| **`STORAGE_DRIVER`** | **YES** | 📄 Plain Text | Alias for `STORAGE_PROVIDER` | `b2` |
| **`B2_BUCKET_NAME`** | **YES** | 📄 Plain Text | 100% Private Backblaze B2 bucket name | `my-linkforge-private-vault` |
| **`B2_BUCKET`** | **YES** | 📄 Plain Text | Alias for `B2_BUCKET_NAME` | `my-linkforge-private-vault` |
| **`B2_APPLICATION_KEY_ID`** | **YES** | 📄 Plain Text | Backblaze B2 Application Key ID | `005abc1234567890000000001` |
| **`B2_KEY_ID`** | **YES** | 📄 Plain Text | Alias for `B2_APPLICATION_KEY_ID` | `005abc1234567890000000001` |
| **`B2_APPLICATION_KEY`** | **YES** | 🔒 **SECRET** | Backblaze B2 Application Key secret | `K005abcDefGhi123JklMnoPqr456Stu` |
| **`B2_ENDPOINT`** | **YES** | 📄 Plain Text | S3 Endpoint hostname (no `https://`) | `s3.us-east-005.backblazeb2.com` |
| **`B2_REGION`** | **YES** | 📄 Plain Text | S3 cluster region code | `us-east-005` |
| **`B2_PRIVATE_BUCKET`** | **YES** | 📄 Plain Text | Enforces zero public access security | `true` |
| **`B2_PRESIGN_PUT_EXPIRY_SEC`**| Optional | 📄 Plain Text | Upload ticket TTL (seconds) | `600` |
| **`B2_PRESIGN_GET_EXPIRY_SEC`**| Optional | 📄 Plain Text | Download ticket TTL (seconds) | `300` |
| **`B2_CORS_ALLOWED_ORIGINS`** | **YES** | 📄 Plain Text | Direct browser-to-B2 upload origins | `https://inkorge-demo.vercel.app,https://linkforge-delta.vercel.app,http://localhost:3000` |
| **`DEPLOYMENT_PLATFORM`** | **YES** | 📄 Plain Text | Target host provider | `vercel` |
| **`NEXT_PUBLIC_APP_URL`** | **YES** | 📄 Plain Text | Public production domain URL | `https://inkorge-demo.vercel.app` |
| **`ANALYTICS_ENABLED`** | **YES** | 📄 Plain Text | Enables DuckDB tracking & rollups | `true` |
| **`ANALYTICS_RETENTION_DAYS`** | **YES** | 📄 Plain Text | Raw event retention period (days) | `30` |

---

## Step 1: Database Setup (Neon Serverless Postgres)

Neon provides a generous free tier with **0.5 GB storage** and serverless scaling.

### Where to get it:
1. Open the [Neon Console](https://console.neon.tech/).
2. Create a new project (e.g. `linkforge-prod`).
3. On the **Dashboard**, locate the **Connection Details** card.
4. Select **Pooled connection** (recommended for serverless environments) or **Direct**.
5. Copy the connection string.

### What it looks like:
```text
postgresql://neondb_owner:npg_xYz123AbC@ep-cool-frost-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### In Vercel:
- **Key**: `DATABASE_URL`
- **Value**: *(Paste your copied string)*
- **Type**: 🔒 **Sensitive / Secret** (Check the checkbox)

---

## Step 2: Auth & Session Secret (`AUTH_SECRET`)

`AUTH_SECRET` signs session tokens and acts as the cryptographic salt for privacy-preserving SHA-256 IP hashing.

### How to generate:
Run either command in your local terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
*Or using OpenSSL:*
```bash
openssl rand -hex 32
```

### What it looks like:
```text
b79a32c4e1f85d9082ac3f0982d61b3e7a1c5d9e0f2b4c6e8a1d3f5b7c9e1a3d
```
*(A 64-character hexadecimal string)*

### In Vercel:
- **Key**: `AUTH_SECRET`
- **Value**: *(Paste your generated 64-char string)*
- **Type**: 🔒 **Sensitive / Secret**

---

## Step 3: Object Storage Vault (Backblaze B2)

Backblaze B2 provides **10 GB free storage** with zero egress fees when accessed via Cloudflare, and native S3 compatibility.

### 3.1 Create a 100% Private Bucket
1. Open [Backblaze B2 Buckets Console](https://secure.backblaze.com/b2_buckets.htm).
2. Click **Create a Bucket**:
   - **Bucket Unique Name**: Enter a globally unique name (e.g., `my-linkforge-private-vault`).
   - **Files in Bucket are**: Select **`Private`** ⚠️ *(DO NOT select Public)*.
   - **Default Encryption**: Enabled.
3. Copy your Bucket Name:
   - `B2_BUCKET_NAME` = `my-linkforge-private-vault`
   - `B2_BUCKET` = `my-linkforge-private-vault`

### 3.2 S3 Endpoint & Region
1. Look at your bucket in the Buckets list.
2. Find the **Endpoint** column.
   - Example: `s3.us-east-005.backblazeb2.com`
3. Enter values:
   - `B2_ENDPOINT` = `s3.us-east-005.backblazeb2.com` *(Do NOT include `https://`)*
   - `B2_REGION` = `us-east-005` *(The cluster code between `s3.` and `.backblazeb2.com`)*

### 3.3 Create Application Key
1. Open [Backblaze Application Keys](https://secure.backblaze.com/app_keys.htm).
2. Click **Add a New Application Key**:
   - **Name of Key**: `linkforge-app-key`
   - **Allow access to Bucket(s)**: Select your bucket.
   - **Type of Access**: `Read and Write`.
3. Click **Create New Key**. Backblaze displays your credentials **only once**:
   - **keyID**: Looks like `005abc1234567890000000001`
     - Set in `B2_APPLICATION_KEY_ID` and `B2_KEY_ID` (📄 Plain Text).
   - **applicationKey**: Looks like `K005abcDefGhi123JklMnoPqr456Stu`
     - Set in `B2_APPLICATION_KEY` (🔒 **Secret**).

### 3.4 Direct Upload CORS Origins
Set `B2_CORS_ALLOWED_ORIGINS` to a comma-separated list of your deployment URLs:
```text
https://inkorge-demo.vercel.app,https://linkforge-delta.vercel.app,http://localhost:3000
```

---

## Step 4: Vercel Deployment & Configuration

1. In your **Vercel Project Dashboard**:
   - Navigate to **Settings** $\to$ **Environment Variables**.
2. Add all variables listed in the [Environment Variables Matrix](#-environment-variables-matrix).
3. Ensure **Production** and **Preview** environments are checked.
4. Click **Redeploy** (or trigger a new commit push on `main`).

---

## Step 5: Post-Deployment One-Click Verification

Once Vercel finishes deploying, run these three quick API calls in your browser or curl:

### 1. Database Schema Synchronization
```http
GET https://YOUR-APP.vercel.app/api/db/migrate
```
* **Expected Response**: `{"ok":true,"count":13,"message":"Database schema synchronized successfully (13 tables ensured)"}`
* *This creates all 13 tables including `analytics_rollups` idempotently with zero data loss.*

### 2. Backblaze B2 CORS Sync
```http
POST https://YOUR-APP.vercel.app/api/storage/cors
```
* **Expected Response**: `{"ok":true,"message":"Bucket CORS rules synchronized successfully with Backblaze B2"}`
* *This automatically configures Backblaze B2 CORS rules for direct browser uploads.*

### 3. Comprehensive System Health Check
```http
GET https://YOUR-APP.vercel.app/api/health
```
* **Expected Response**:
  ```json
  {
    "status": "healthy",
    "db": { "ok": true, "provider": "neon", "pingMs": 35 },
    "storage": { "ok": true, "provider": "b2", "bucket": "your-bucket" }
  }
  ```

---

## 📋 Ready-to-Copy Production `.env` Template

```env
# =============================================================================
# 🚀 LINKFORGE PRODUCTION ENVIRONMENT CONFIGURATION
# =============================================================================

# ===== 1. DATABASE (NEON SERVERLESS POSTGRES) =====
DATABASE_PROVIDER=neon
DATABASE_URL=postgresql://neondb_owner:YOUR_NEON_PASSWORD@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require

# ===== 2. AUTHENTICATION & SECURITY =====
AUTH_PROVIDER=builtin
AUTH_SECRET=b79a32c4e1f85d9082ac3f0982d61b3e7a1c5d9e0f2b4c6e8a1d3f5b7c9e1a3d

# ===== 3. STORAGE (BACKBLAZE B2 PRIVATE VAULT) =====
STORAGE_PROVIDER=b2
STORAGE_DRIVER=b2

B2_BUCKET_NAME=my-linkforge-private-vault
B2_BUCKET=my-linkforge-private-vault

B2_APPLICATION_KEY_ID=005abc1234567890000000001
B2_KEY_ID=005abc1234567890000000001

# 🔒 Sensitive Secret:
B2_APPLICATION_KEY=K005abcDefGhi123JklMnoPqr456Stu

B2_ENDPOINT=s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_PRIVATE_BUCKET=true
B2_PRESIGN_PUT_EXPIRY_SEC=600
B2_PRESIGN_GET_EXPIRY_SEC=300

# CORS Allowed Domains:
B2_CORS_ALLOWED_ORIGINS=https://inkorge-demo.vercel.app,https://linkforge-delta.vercel.app,http://localhost:3000

# ===== 4. DEPLOYMENT & ROUTING =====
DEPLOYMENT_PLATFORM=vercel
NEXT_PUBLIC_APP_URL=https://inkorge-demo.vercel.app

# ===== 5. DUCKDB ANALYTICS & SPACE SAVINGS =====
ANALYTICS_ENABLED=true
ANALYTICS_RETENTION_DAYS=30
API_CORS_ORIGINS=*
```
