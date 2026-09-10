// =============================================================================
// 🗜️ Client-Side GZIP Compression & Decompression Utility
// -----------------------------------------------------------------------------
// Uses browser-native CompressionStream('gzip') / DecompressionStream('gzip')
// Saves 50-70% storage and network bandwidth on PDFs, documents, SVGs, JSON, etc.
// Automatically skips already-compressed multimedia (images, mp3, mp4, zip).
// =============================================================================

// File types that are already compressed by definition — compressing them again
// wastes CPU cycles and can sometimes even increase file size.
const PRE_COMPRESSED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "webp", "gif", "avif",
  "mp3", "m4a", "wav", "aac", "ogg", "flac",
  "mp4", "webm", "mov", "mkv", "avi",
  "zip", "gz", "tar", "rar", "7z", "bz2",
]);

export interface CompressionResult {
  blob: Blob;
  isCompressed: boolean;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  encoding?: string;
}

/**
 * Checks if the browser supports CompressionStream('gzip')
 */
export function isCompressionStreamSupported(): boolean {
  return typeof window !== "undefined" && typeof (window as unknown as { CompressionStream?: unknown }).CompressionStream === "function";
}

/**
 * Checks if a file is a candidate for GZIP compression based on extension/MIME
 */
export function isCompressibleFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (PRE_COMPRESSED_EXTENSIONS.has(ext)) {
    return false;
  }
  if (
    file.type.startsWith("image/") && !file.type.includes("svg") && !file.type.includes("xml")
  ) {
    return false;
  }
  if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
    return false;
  }
  return true;
}

/**
 * Compresses a file using browser-native CompressionStream('gzip').
 * If the browser doesn't support it or if the file isn't suitable, returns the original file.
 */
export async function compressFileGzip(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  if (!isCompressionStreamSupported() || !isCompressibleFile(file) || originalSize < 512) {
    return {
      blob: file,
      isCompressed: false,
      originalSize,
      compressedSize: originalSize,
      savingsPercent: 0,
    };
  }

  try {
    const stream = file.stream().pipeThrough(new CompressionStream("gzip"));
    const response = new Response(stream);
    const compressedBlob = await response.blob();

    // Only use compressed version if it actually saves space!
    if (compressedBlob.size < originalSize) {
      const savingsPercent = Math.round(((originalSize - compressedBlob.size) / originalSize) * 100);
      return {
        blob: compressedBlob,
        isCompressed: true,
        originalSize,
        compressedSize: compressedBlob.size,
        savingsPercent,
        encoding: "gzip",
      };
    }
  } catch (err) {
    console.warn("[compression] Client GZIP compression skipped:", err);
  }

  return {
    blob: file,
    isCompressed: false,
    originalSize,
    compressedSize: originalSize,
    savingsPercent: 0,
  };
}

/**
 * Decompresses a GZIP blob using browser-native DecompressionStream('gzip')
 */
export async function decompressBlobGzip(blob: Blob, targetMimeType?: string): Promise<Blob> {
  if (typeof (window as unknown as { DecompressionStream?: unknown }).DecompressionStream !== "function") {
    return blob;
  }

  try {
    const stream = blob.stream().pipeThrough(new DecompressionStream("gzip"));
    const response = new Response(stream);
    const decompressed = await response.blob();
    return targetMimeType ? new Blob([decompressed], { type: targetMimeType }) : decompressed;
  } catch (err) {
    console.warn("[compression] Decompression failed (blob may already be uncompressed):", err);
    return blob;
  }
}
