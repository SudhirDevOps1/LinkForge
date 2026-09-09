# 📁 Media & Uploads — ticket flow, CORS, lifecycle

> Purana multipart `POST /api/media` waise hi working hai (local/blob +
> fallback). Neeche **naya** S3 ticket flow hai — kuch hataya nahi gaya.

## The actual flow

1. Dropzone `POST /api/media/presign` (`{ fileName, mime, size }`) se ticket
   maangta hai — owner-bound, 60s TTL, single-use.
2. S3-compatible provider par browser **seedha storage par** `PUT` karta hai
   (server bandwidth zero, real progress + cancel).
3. Browser `POST /api/media/complete` (`{ ticketId }`) bhejta hai. Server
   verify karta hai: ticket owner, expiry, provider-match, actual size
   (`HeadObject`/`stat`) aur file signature (magic bytes). Sab pass →
   `media_files` row (201). Fail → object delete + ticket consume (422/413/410).
4. `PUT` URL expiry tak reusable hai; **ticket single-use** hai.
5. Local/blob providers par presign `501` deta hai → dropzone automatic
   multipart fallback use karta hai.

## Completion checks (fail-closed)

| Check | Fail code |
|---|---|
| Wrong owner / ticket nahi mili | 404 |
| Already used / expired | 410 |
| Provider switch (ticket vs current) | 400 |
| Object nahi mila (PUT nahi hua) | 422 |
| Size mismatch | 413 + object delete |
| Signature mismatch (spoofed ext/type) | 422 + object delete |

Magic-byte note: text formats (`txt/md/csv`), `ogg`/`webm` containers ke
reliable magic bytes nahi hote — unke liye ext+MIME allowlist kaafi hai.
Malware scanning/quarantine **nahi** hai (P2) — untrusted public uploads ke
liye scanning service jodo.

## B2, R2, S3, MinIO

`STORAGE_PROVIDER` + credentials `.env.example` se (server-side only).
Bucket-scoped keys: PutObject, GetObject, HeadObject, DeleteObject.

### B2 private bucket (free tier) — recommended agar public paid ho

```env
STORAGE_PROVIDER=b2
B2_PRIVATE_BUCKET=true
# B2_PUBLIC_URL NOT needed
```

Private bucket par public file URLs 403 dete — isliye app **proxy** se serve
karta hai: upload/complete flows automatically `/api/file/<key>` URLs banate
hain, aur `GET /api/file/[...key]` server credentials se B2 se laakar stream
karta hai (Range/206 seek + immutable edge-cache ke saath). Koi code change
upload flows me nahi chahiye — sirf env flag.

### B2 public bucket (paid) / R2 / S3 / MinIO

`STORAGE_PROVIDER` + credentials `.env.example` se (server-side only).
Bucket-scoped keys: PutObject, GetObject, HeadObject, DeleteObject.
R2 me `R2_PUBLIC_URL` = public/custom domain (S3 API endpoint **nahi**).

Bucket CORS — apne exact app origin ke liye (example, apne domain se replace
karke bucket me lagayein):

```json
[
  {
    "AllowedOrigins": ["https://your-app.example.com"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Disposition"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Signed PUT me `Content-Type` sign hota hai — browser wahi header bheje
(dropzone bhejta hai). Wildcard origins / credentials allow mat karo.

## Persistence and cleanup

- Local uploads ko persistent writable volume chahiye (serverless ephemeral
  disks par **nahi**).
- `STORAGE_PROVIDER` badalne se purane objects move **nahi** hote. Delete
  provider-mismatch refuse karta hai (400) aur live links me referenced file
  refuse karta hai (409 + `referencedBy`) — pehle unlink karo.
- Cleanup cron: `npm run cleanup:uploads` (daily) — expired unused tickets +
  unke orphan objects. Poori `files/` prefix par short lifecycle rule **mat**
  lagao (completed uploads bhi usi prefix me hain).
- File URL public hai — bio page unpublish karne ke baad bhi URL khula rehta hai.

## Supported files

JPEG, PNG, GIF, WebP, AVIF, PDF, text, Markdown, CSV, MP3, WAV, Ogg, M4A,
MP4, WebM, ZIP, DOCX, XLSX, PPTX. Default max 10 MiB (`MAX_UPLOAD_BYTES`).
SVG, HTML, executables blocked. Local serving: Content-Type, nosniff,
disposition, length + **byte-range** (`Accept-Ranges`, 206 seek supported).
