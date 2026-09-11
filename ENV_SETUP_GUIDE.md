# 🚀 LinkForge — Production Environment & Deployment Guide

This guide details **every environment variable**, **where to get each value** from provider consoles, whether it should be configured as a **Secret** or **Plain Text** in Vercel or cloud hosts, and the **exact verification steps** to ensure all 21 tables, object storage, ALTCHA bot defense, and Better Auth work seamlessly.

---

## 📑 Table of Contents
1. [Environment Variables Matrix](#-environment-variables-matrix)
2. [Step 1: Database Setup (Neon Serverless Postgres)](#step-1-database-setup-neon-serverless-postgres)
3. [Step 2: Authentication & Cryptographic Secrets](#step-2-authentication--cryptographic-secrets)
4. [Step 3: Object Storage Vault (Backblaze B2)](#step-3-object-storage-vault-backblaze-b2)
5. [Step 4: ALTCHA Proof-of-Work Bot Defense](#step-4-altcha-proof-of-work-bot-defense)
6. [Step 5: Cloud Deployment & Configuration](#step-5-cloud-deployment--configuration)
7. [Step 6: Post-Deployment Verification](#step-6-post-deployment-verification)
8. [Production `.env` Template](#-production-env-template)

---

## 📊 Environment Variables Matrix

| Variable Name | Required | Host Secret Type | Description | Example / Recommended Value |
| :--- | :---: | :---: | :--- | :--- |
| **`DATABASE_URL`** | **YES** | 🔒 **Secret** | Primary PostgreSQL connection string | `postgresql://neondb_owner:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| **`DATABASE_PROVIDER`** | **YES** | 📄 Plain Text | Database engine dialect (`postgres`, `neon`, `supabase`, `turso`, `d1`) | `neon` |
| **`BETTER_AUTH_SECRET`** | **YES** | 🔒 **Secret** | 32-byte secret key for Better Auth tokens and cookies | `b79a32c4e1f85d9082ac3f0982d61b3e7a1c5d9e0f2b4c6e8a1d3f5b7c9e1a3d` |
| **`BETTER_AUTH_URL`** | **YES** | 📄 Plain Text | Public URL of your LinkForge application | `https://yourdomain.com` *(or `http://localhost:3000`)* |
| **`AUTH_SECRET`** | **YES** | 🔒 **Secret** | 32-byte secret for session signing & IP hashing salt | `a41d92c7e3f85d9082ac3f0982d61b3e7a1c5d9e0f2b4c6e8a1d3f5b7c9e1a3d` |
| **`ALTCHA_HMAC_KEY`** | **YES** | 🔒 **Secret** | Secret key for signing client Proof-of-Work challenges | `c92b45f1e8a93d0124ba56fe78dc9012a4b5c6d7e8f901a2b3c4d5e6f7a8b9c0` |
| **`STORAGE_PROVIDER`** | **YES** | 📄 Plain Text | Object storage driver (`local`, `b2`, `r2`, `s3`, `minio`, `vercel-blob`) | `b2` |
| **`B2_BUCKET_NAME`** | **YES** | 📄 Plain Text | Backblaze B2 bucket name | `my-linkforge-vault` |
| **`B2_APPLICATION_KEY_ID`**| **YES**| 📄 Plain Text | Backblaze B2 Application Key ID | `005abc1234567890000000001` |
| **`B2_APPLICATION_KEY`** | **YES** | 🔒 **Secret** | Backblaze B2 Application Key Secret | `K005abcDefGhi123JklMnoPqr456Stu` |
| **`B2_ENDPOINT`** | **YES** | 📄 Plain Text | S3 Endpoint hostname (without `https://`) | `s3.us-east-005.backblazeb2.com` |
| **`B2_REGION`** | **YES** | 📄 Plain Text | S3 cluster region identifier | `us-east-005` |
| **`B2_PRIVATE_BUCKET`** | **YES** | 📄 Plain Text | Enforces private proxy streaming with HTTP 206 support | `true` |
| **`B2_CORS_ALLOWED_ORIGINS`**| **YES**| 📄 Plain Text | Direct browser-to-B2 upload origins (comma-separated) | `https://yourdomain.com,http://localhost:3000` |
| **`NEXT_PUBLIC_APP_URL`**| **YES** | 📄 Plain Text | Public production domain URL | `https://yourdomain.com` |
| **`ANALYTICS_ENABLED`** | **YES** | 📄 Plain Text | Enables DuckDB tracking & compact rollups | `true` |
| **`ANALYTICS_RETENTION_DAYS`**| Optional | 📄 Plain Text | Raw event retention period (days) | `30` |

---

## Step 1: Database Setup (Neon Serverless Postgres)

Neon provides a generous free tier with **0.5 GB storage** and instant serverless scaling.

1. Open the [Neon Console](https://console.neon.tech/).
2. Create a new project (e.g. `linkforge-prod`).
3. Under **Connection Details**, copy your pooled connection string:
   ```text
   postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Set in your environment:
   * `DATABASE_PROVIDER=neon`
   * `DATABASE_URL="postgresql://..."`

---

## Step 2: Authentication & Cryptographic Secrets

Generate high-entropy 32-byte hexadecimal strings for `BETTER_AUTH_SECRET`, `AUTH_SECRET`, and `ALTCHA_HMAC_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Configure in your host environment:
* `BETTER_AUTH_SECRET` = *(Generated 64-character hex string)* (🔒 Secret)
* `BETTER_AUTH_URL` = `https://yourdomain.com` (📄 Plain Text)
* `AUTH_SECRET` = *(Generated 64-character hex string)* (🔒 Secret)

---

## Step 3: Object Storage Vault (Backblaze B2)

Backblaze B2 offers **10 GB free object storage** with native S3 compatibility.

1. In [Backblaze B2 Buckets](https://secure.backblaze.com/b2_buckets.htm), create a bucket (e.g. `linkforge-vault`).
2. Set bucket type to **`Private`**.
3. Under **Application Keys**, click **Add a New Application Key**:
   * Allow access to your bucket.
   * Access type: `Read and Write`.
4. Copy the credentials:
   * `B2_APPLICATION_KEY_ID`: Plain Text.
   * `B2_APPLICATION_KEY`: 🔒 Secret.
   * `B2_ENDPOINT`: `s3.region.backblazeb2.com` (without `https://`).
   * `B2_REGION`: e.g. `us-west-004` or `us-east-005`.
   * `B2_PRIVATE_BUCKET`: `true`.

---

## Step 4: ALTCHA Proof-of-Work Bot Defense

Generate an HMAC secret for challenge verification:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Configure:
* `ALTCHA_HMAC_KEY` = *(Generated hex string)* (🔒 Secret)

---

## Step 5: Cloud Deployment & Configuration

1. In your cloud provider's dashboard (e.g. Vercel, Netlify, Railway):
   * Add the variables specified in the [Environment Variables Matrix](#-environment-variables-matrix).
2. Trigger deployment (`git push origin main` or via CLI).
3. The zero-config auto-migrator (`src/db/auto-migrate.ts`) will automatically provision all 21 tables during the first application boot.

---

## Step 6: Post-Deployment Verification

Verify your production deployment with these verification checks:

### 1. Database Schema Verification (21 Tables)
```http
GET https://yourdomain.com/api/db/migrate
```
* **Expected Response**:
  ```json
  {
    "ok": true,
    "count": 21,
    "message": "Database schema synchronized successfully"
  }
  ```

### 2. Backblaze B2 CORS Sync
```http
POST https://yourdomain.com/api/storage/cors
```
* **Expected Response**:
  ```json
  {
    "ok": true,
    "message": "Bucket CORS rules synchronized successfully"
  }
  ```

### 3. System & Database Health Probe
```http
GET https://yourdomain.com/api/health
```
* **Expected Response**:
  ```json
  {
    "status": "healthy",
    "db": { "ok": true, "provider": "neon" },
    "storage": { "ok": true, "provider": "b2" }
  }
  ```

---

## 📋 Production `.env` Template

```env
# =============================================================================
# 🚀 LINKFORGE PRODUCTION ENVIRONMENT CONFIGURATION
# =============================================================================

# ===== 1. DATABASE (NEON SERVERLESS POSTGRES) =====
DATABASE_PROVIDER=neon
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# ===== 2. AUTHENTICATION & SECURITY =====
BETTER_AUTH_SECRET=b79a32c4e1f85d9082ac3f0982d61b3e7a1c5d9e0f2b4c6e8a1d3f5b7c9e1a3d
BETTER_AUTH_URL=https://yourdomain.com
AUTH_SECRET=a41d92c7e3f85d9082ac3f0982d61b3e7a1c5d9e0f2b4c6e8a1d3f5b7c9e1a3d

# ===== 3. BOT DEFENSE (ALTCHA PROOF-OF-WORK) =====
ALTCHA_HMAC_KEY=c92b45f1e8a93d0124ba56fe78dc9012a4b5c6d7e8f901a2b3c4d5e6f7a8b9c0

# ===== 4. STORAGE (BACKBLAZE B2 PRIVATE VAULT) =====
STORAGE_PROVIDER=b2
STORAGE_DRIVER=b2
B2_BUCKET_NAME=my-linkforge-vault
B2_BUCKET=my-linkforge-vault
B2_APPLICATION_KEY_ID=005abc1234567890000000001
B2_KEY_ID=005abc1234567890000000001
B2_APPLICATION_KEY=K005abcDefGhi123JklMnoPqr456Stu
B2_ENDPOINT=s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_PRIVATE_BUCKET=true
B2_PRESIGN_PUT_EXPIRY_SEC=600
B2_PRESIGN_GET_EXPIRY_SEC=300
B2_CORS_ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:3000

# ===== 5. DEPLOYMENT & ROUTING =====
DEPLOYMENT_PLATFORM=vercel
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# ===== 6. DUCKDB ANALYTICS =====
ANALYTICS_ENABLED=true
ANALYTICS_RETENTION_DAYS=30
```
