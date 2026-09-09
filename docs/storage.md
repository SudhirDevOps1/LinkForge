# 📦 Storage Providers — Setup Guides

Avatar aur file uploads ke liye **6 storage backends** — `STORAGE_PROVIDER`
se switch. Sab backends ek hi `StorageService` interface implement karte hain:

```ts
interface StorageService {
  upload(data, key, contentType): Promise<{ key; url }>;
  delete(key): Promise<void>;
  getUrl(key): string;
  getPresignedUploadUrl?(key, contentType); // S3-family only
}
```

| Provider | Free Tier | S3-Compatible | Presigned Uploads |
| :--- | :--- | :--- | :--- |
| `local` (default) | Unlimited (self-hosted) | — | — |
| `b2` Backblaze B2 | **10 GB** | ✅ | ✅ |
| `r2` Cloudflare R2 | **10 GB** (zero egress fees) | ✅ | ✅ |
| `s3` AWS S3 | Pay-as-you-go | ✅ | ✅ |
| `minio` MinIO | Unlimited (self-hosted) | ✅ | ✅ |
| `vercel-blob` | 10 GB | — | put/del API |

---

## 1. Local Disk (default)

Koi setup nahi — files `./uploads` (ya `UPLOAD_DIR`) me likhi jati hain aur
`GET /api/files/[folder]/[name]` route se serve hoti hain (immutable cache
headers ke saath). Docker me `uploads` volume persist karein.

```env
STORAGE_PROVIDER=local
UPLOAD_DIR=./uploads
```

> ⚠️ Vercel/Netlify (ephemeral filesystem) par `local` use na karein —
> wahan B2/R2/Vercel-Blob choose karein.

## 2. Backblaze B2 (₹0 — 10 GB free)

1. [backblaze.com/b2](https://www.backblaze.com/b2) → bucket banayein (public)
2. **App Keys** → key create (`keyID` + `applicationKey`)
3. `.env`:

```env
STORAGE_PROVIDER=b2
B2_APPLICATION_KEY_ID=...
B2_APPLICATION_KEY=...
B2_BUCKET_NAME=linkforge
B2_REGION=us-west-004            # bucket region se match karein
B2_PUBLIC_URL=https://f004.backblazeb2.com/file/linkforge   # optional pretty URLs
```

## 3. Cloudflare R2 (zero egress fees)

1. Cloudflare dashboard → **R2** → bucket create
2. **Manage R2 API Tokens** → token create (Object Read & Write)
3. Account ID dashboard URL se
4. `.env`:

```env
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=linkforge
R2_PUBLIC_URL=https://pub-xxxx.r2.dev   # bucket → Settings → Public access
```

## 4. AWS S3

```env
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_BUCKET_NAME=linkforge
AWS_PUBLIC_URL=https://cdn.example.com   # optional CloudFront
```

Bucket policy: uploads ke liye least-privilege IAM user recommended.

## 5. MinIO (self-hosted, unlimited)

```bash
docker compose --profile minio up   # MinIO + auto-created 'linkforge' bucket
```

```env
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=linkforge
MINIO_PUBLIC_URL=http://localhost:9000/linkforge
```

## 6. Vercel Blob

1. Vercel project → **Storage** → Blob store create
2. `BLOB_READ_WRITE_TOKEN` copy karein → `.env`:

```env
STORAGE_PROVIDER=vercel-blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

---

## Presigned Uploads (server bandwidth = 0)

S3-family providers par browser **seedha storage par** upload kar sakta hai:

```http
POST /api/storage/presign
{ "contentType": "image/png", "folder": "avatars" }
→ { "url": "<PUT url, 60s valid>", "key": "...", "publicUrl": "..." }
```

Browser fir `PUT <url>` par file bhejta hai aur `publicUrl` ko profile me
save karta hai. Default avatar flow server-proxy hai (sab providers par kaam
karta hai); presign large files ke liye optimized path hai.
