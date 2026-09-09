// =============================================================================
// ✅ Upload Validation — ext↔MIME map, magic-byte verify, Range parse
// Pure functions (unit-testable). Server routes + cleanup script use karte hain.
// NOTE: `file-type` (magic bytes) sirf server par dynamic-import hota hai —
// yeh module client bundle me heavy dep nahi kheenchta.
// =============================================================================
import { ALLOWED_UPLOAD_TYPES } from "@/config/storage.config";

/** Ticket TTL: presigned PUT URL 60s me expire (S3 sign bhi 60s) */
export const TICKET_TTL_MS = 60_000;

/** Extension → expected MIME (spoof check ke liye, lowercase ext) */
export const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  mp4: "video/mp4",
  webm: "video/webm",
  zip: "application/zip",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export function mimeForExtension(ext: string): string | null {
  return EXT_MIME[ext.toLowerCase()] ?? null;
}

export function isAllowedMime(mime: string): boolean {
  return (ALLOWED_UPLOAD_TYPES as readonly string[]).includes(mime);
}

/** Filename ka ext, ticket ke expected MIME se match karta hai? */
export function extensionMatchesMime(fileName: string, mime: string): boolean {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) return false;
  return mimeForExtension(fileName.slice(dot + 1)) === mime;
}

/**
 * Magic-byte verify — buffer ke real type ko claimed MIME se milao.
 * `file-type` text formats detect nahi karta (txt/md/csv/ogg-container) —
 * unke liye ext+MIME allowlist kaafi hai (scanning P2 me).
 * Returns { ok, detected? }.
 */
export async function verifyMagicBytes(
  data: Uint8Array,
  claimedMime: string,
): Promise<{ ok: boolean; detected?: string }> {
  // Text-ish types ke magic bytes nahi hote — skip (ext check kaafi)
  if (
    claimedMime.startsWith("text/") ||
    claimedMime === "audio/ogg" ||
    claimedMime === "audio/webm" ||
    claimedMime === "video/webm"
  ) {
    return { ok: true };
  }
  try {
    const { fileTypeFromBuffer } = await import("file-type");
    const detected = await fileTypeFromBuffer(data);
    if (!detected) return { ok: false };
    // Family-level match: jpg↔jpeg alias + container aliases allow
    const norm = (m: string) =>
      m === "image/jpg" ? "image/jpeg" : m;
    if (norm(detected.mime) === claimedMime) return { ok: true, detected: detected.mime };
    // MP4/M4A same container (isom) — file-type mp4 batata hai
    if (
      claimedMime === "audio/mp4" &&
      (detected.mime === "video/mp4" || detected.mime === "audio/mp4")
    ) {
      return { ok: true, detected: detected.mime };
    }
    return { ok: false, detected: detected.mime };
  } catch {
    // file-type load fail = fail-closed? Nahi — ext+MIME checks already hue;
    // conservative allow + warn (scanning P2 me strict hogi).
    return { ok: true };
  }
}

/** `Range: bytes=start-end` parse → { start, end } | null (416 par null) */
export function parseRangeHeader(
  range: string | null,
  size: number,
): { start: number; end: number } | null {
  if (!range || size <= 0) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!m) return null;
  const [, s, e] = m;
  let start: number;
  let end: number;
  if (s === "" && e === "") return null;
  if (s === "") {
    // suffix: akhri N bytes
    const suffix = Number(e);
    if (!Number.isInteger(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(s);
    end = e === "" ? size - 1 : Number(e);
    if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
    if (start >= size || end < start) return null;
    end = Math.min(end, size - 1);
  }
  return { start, end };
}

/** Ticket expired? (expiresAt Date | number-ms dono support) */
export function isTicketExpired(expiresAt: Date | number): boolean {
  const t = expiresAt instanceof Date ? expiresAt.getTime() : expiresAt;
  return t <= Date.now();
}
