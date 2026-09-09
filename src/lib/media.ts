// =============================================================================
// 📁 Media helpers — pure functions (unit-testable, server + client safe)
// =============================================================================

/** Display/download ke liye filename sanitize — path parts + unsafe chars strip */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "");
  const safe = cleaned || "file";
  if (safe.length <= 100) return safe;
  // Lambi names: extension bachakar truncate karo
  const dot = safe.lastIndexOf(".");
  if (dot > 0 && safe.length - dot <= 12) {
    return `${safe.slice(0, 100 - (safe.length - dot))}${safe.slice(dot)}`;
  }
  return safe.slice(0, 100);
}

export type FileCategory =
  | "image"
  | "pdf"
  | "audio"
  | "video"
  | "doc"
  | "archive"
  | "other";

export function fileCategory(mime: string): FileCategory {
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/zip") return "archive";
  if (
    mime.startsWith("text/") ||
    mime.includes("officedocument") ||
    mime === "application/msword"
  )
    return "doc";
  return "other";
}

/** 1536 → "1.5 KB" — human readable bytes */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / 1024 ** i;
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[i]}`;
}

/** "Report.PDF" → "pdf" — extension nikaalo (lowercase) */
export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

/** "my-file.pdf" → "my-file" — link title ke liye extension hatao */
export function nameWithoutExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot).replace(/[-_]+/g, " ").trim() : fileName;
}
