# 📁 Media Engine & File Upload Lifecycle

LinkForge provides an end-to-end media upload and asset management pipeline designed for high performance, bandwidth preservation, and strict file validation.

---

## 🔄 The Upload Lifecycle

1. **Request Upload Ticket (`POST /api/media/presign`)**:
   * Client provides `{ fileName, mime, size }`.
   * Server validates user authentication, profile ownership, and MIME allowlists.
   * Generates a single-use `upload_tickets` record with a 60-second TTL and an S3 presigned PUT URL.

2. **Direct Binary Upload (Client-to-Storage)**:
   * Client uploads binary directly to the object storage bucket (e.g. Backblaze B2, Cloudflare R2, AWS S3) via HTTP `PUT`.
   * Real-time upload progress tracking and `AbortSignal` cancellation are handled directly in the browser without tying up server threads.

3. **Complete & Validate Ticket (`POST /api/media/complete`)**:
   * Client submits `{ ticketId }` once the upload finishes.
   * Server executes **fail-closed verification** checks:
     * Validates ticket ownership and unexpired TTL.
     * Queries the storage backend (`HeadObject`) to verify actual byte size matches expected size.
     * Inspects **file magic bytes** to prevent disguised executables and malicious file extensions.
   * On passing all checks, records the file in `media_files` and consumes the ticket.
   * On failure, automatically deletes the uploaded object from storage and returns a descriptive HTTP error code.

---

## 🛡️ Fail-Closed Security Checks

| Check | Failure Condition | HTTP Response | Remediation Action |
|---|---|---|---|
| **Ticket Ownership** | User does not own the profile associated with ticket | `404 Not Found` | Request rejected |
| **Ticket Expiration**| Ticket older than 60 seconds or already consumed | `410 Gone` | Must request new ticket |
| **Provider Mismatch**| Active storage engine differs from ticket engine | `400 Bad Request` | Prevent split-state leaks |
| **Missing Object** | Object was not uploaded to the bucket | `422 Unprocessable` | Abort database write |
| **Size Discrepancy** | Actual size differs from ticket reservation | `413 Payload Too Large` | Delete object from bucket |
| **Signature Spoofing**| Magic bytes do not match declared MIME type | `422 Unprocessable` | Delete object from bucket |

---

## 🎥 Private Bucket Proxy Streaming (`/api/file/[...key]`)

For private storage buckets (such as Backblaze B2 private buckets with `B2_PRIVATE_BUCKET=true`):
* Public CDN URLs are inaccessible without authorization.
* LinkForge serves media through an authenticated, streaming proxy endpoint: `/api/file/[...key]`.
* **Features**:
  * **HTTP 206 Partial Content**: Full support for `Range` headers, enabling instant video seeking and audio scrub bars.
  * **Edge Caching**: Returns immutable `Cache-Control: public, max-age=31536000, immutable` headers for static media keys.
  * **Zero Server Memory Bloat**: Streams chunks directly from the upstream S3 endpoint into the client HTTP response buffer.
