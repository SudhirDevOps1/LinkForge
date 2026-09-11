# 📦 Object Storage & Media Infrastructure Guide

LinkForge implements a high-performance **Universal Storage Adapter** capable of interfacing with 6 storage backends through a unified interface (`StorageService`). Uploads utilize authenticated presigned tickets for direct browser-to-bucket transfers, eliminating server bandwidth bottlenecks.

---

## ☁️ Storage Providers Matrix

| Provider | Free Tier | S3-Compatible | Direct Presigned PUT | Recommended Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **`local`** (Default) | Unlimited (Disk) | ❌ | Multipart Streaming | Local development, self-hosted single Docker instance |
| **`b2`** (Backblaze B2) | **10 GB Free** | ✅ | ✅ | Best overall value for production, daily blog storage |
| **`r2`** (Cloudflare R2) | **10 GB Free** | ✅ | ✅ | Zero egress fees, Cloudflare Pages integration |
| **`s3`** (AWS S3) | Pay-as-you-go | ✅ | ✅ | Enterprise AWS cloud infrastructure |
| **`minio`** (MinIO) | Unlimited (Self-hosted)| ✅ | ✅ | Private clouds, on-premises Kubernetes clusters |
| **`vercel-blob`** | 10 GB Free | ❌ | Client Token PUT | Seamless zero-configuration Vercel deployments |

---

## 🚀 Direct Presigned Upload Architecture

Rather than proxying multi-megabyte payloads through serverless functions (which incur latency and payload size limits), LinkForge leverages direct client-to-storage presigned uploads:

```
┌──────────┐                     ┌───────────────┐                     ┌─────────────────┐
│  Client  │                     │  LinkForge    │                     │  Object Storage │
│ (Browser)│                     │  API Server   │                     │  (B2 / R2 / S3) │
└────┬─────┘                     └───────┬───────┘                     └────────┬────────┘
     │                                   │                                      │
     │ 1. Request Upload Ticket          │                                      │
     │    POST /api/media/presign ──────>│ (Generates single-use ticket         │
     │    {fileName, mime, size}         │  and presigned S3 PUT URL)           │
     │                                   │                                      │
     │ 2. Return Ticket + Presigned URL  │                                      │
     │<──────────────────────────────────│                                      │
     │                                                                          │
     │ 3. Direct Binary Upload (Real Progress + Abort Signal)                  │
     │    PUT https://bucket.s3.region.amazonaws.com/uploads/xyz... ──────────>│
     │<─────────────────────────────────────────────────────────────────────────│
     │                                                                          │
     │ 4. Complete & Validate Ticket                                            │
     │    POST /api/media/complete ─────>│ (Inspects magic-bytes,               │
     │    {ticketId}                     │  validates size, creates DB record)  │
     │                                   │                                      │
     │ 5. Verified File Record           │                                      │
     │<──────────────────────────────────│                                      │
```

---

## 🛠️ Storage Setup Guides

### 1. Local Disk (`local`)
Stores uploaded assets on the server's local filesystem in `./uploads` (configurable via `UPLOAD_DIR`).

```env
STORAGE_PROVIDER=local
UPLOAD_DIR=./uploads
```

> **Note**: For Docker deployments, mount `./uploads` as a persistent volume to preserve assets across container restarts.

### 2. Backblaze B2 (`b2`) — Recommended Free Cloud Storage
Provides 10 GB free object storage with full S3-compatibility.

1. Create a free account at [backblaze.com/b2](https://www.backblaze.com/b2).
2. Create a bucket (e.g. `linkforge-assets`).
3. Navigate to **Application Keys** and create an App Key with read/write access to your bucket.
4. Note your `keyID`, `applicationKey`, and endpoint region.
5. Configure your `.env`:

```env
STORAGE_PROVIDER=b2
B2_APPLICATION_KEY_ID="004..."
B2_APPLICATION_KEY="K004..."
B2_BUCKET_NAME="linkforge-assets"
B2_REGION="us-west-004"
B2_ENDPOINT="s3.us-west-004.backblazeb2.com"
```

#### Private vs Public Buckets
* **Public Buckets**: Files can be served directly from Backblaze B2 CDN URLs.
* **Private Buckets**: Set `B2_PRIVATE_BUCKET=true`. LinkForge will securely stream media through `/api/file/[...key]` with HTTP 206 Range seeking and immutable cache headers.

### 3. Cloudflare R2 (`r2`) — Zero Egress Fees
1. In Cloudflare Dashboard, go to **R2 Object Storage → Create bucket**.
2. Go to **Manage R2 API Tokens** and create an API token with `Object Read & Write` permissions.
3. Configure your `.env`:

```env
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET="linkforge"
R2_PUBLIC_URL="https://pub-xxxxxx.r2.dev"    # Or custom domain
```

### 4. AWS S3 (`s3`)
```env
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
S3_BUCKET_NAME="linkforge-prod"
```

### 5. MinIO (`minio`) — Self-Hosted S3
```env
STORAGE_PROVIDER=minio
MINIO_ENDPOINT="minio.internal.yourdomain.com"
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="miniopassword"
MINIO_BUCKET="linkforge"
```

### 6. Vercel Blob (`vercel-blob`)
```env
STORAGE_PROVIDER=vercel-blob
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

---

## 🌐 Bucket CORS Configuration (S3 / B2 / R2)

To enable browser-direct uploads, configure your bucket's CORS rules:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```
LinkForge also provides an automated CORS configuration API route: `POST /api/storage/cors`.
