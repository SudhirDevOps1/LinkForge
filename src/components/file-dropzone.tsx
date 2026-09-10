"use client";

// =============================================================================
// 📤 FileDropzone — reusable drag-and-drop upload
// Media Library page + Links dialog dono isi ko use karte hain.
// Upload seedha configured storage provider (local/B2/R2/S3/MinIO/Blob) par.
// =============================================================================
import { FileUp, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/components/ui";

export interface UploadedFile {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  storageKey: string;
  storageProvider: string;
}

export function FileDropzone({
  onUploaded,
  onError,
  multiple = false,
  compact = false,
  accept,
  maxBytes = 10 * 1024 * 1024,
}: {
  onUploaded: (file: UploadedFile) => void;
  onError?: (message: string) => void;
  multiple?: boolean;
  compact?: boolean;
  accept?: string;
  maxBytes?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<{ abort: () => void } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const maxLabel = `${Math.round(maxBytes / 1024 / 1024)} MB`;

  function cancelUpload() {
    abortRef.current?.abort();
  }

  /** S3 presign flow: ticket → direct PUT (progress + cancel) → complete */
  async function uploadViaPresign(file: File): Promise<UploadedFile> {
    const pre = await fetch("/api/media/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, mime: file.type, size: file.size }),
    });
    if (pre.status === 501) throw new Error("__FALLBACK__"); // local/blob → multipart
    const ticket = (await pre.json().catch(() => ({}))) as {
      ticketId?: string;
      url?: string;
      error?: string;
    };
    if (!pre.ok || !ticket.ticketId || !ticket.url) {
      throw new Error(ticket.error ?? "Presign failed");
    }
    // Direct PUT with real progress + cancel (XHR — fetch me upload progress nahi)
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      abortRef.current = { abort: () => xhr.abort() };
      xhr.open("PUT", ticket.url as string);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error(`Storage upload failed (${xhr.status})`));
      xhr.onerror = () => reject(new Error("Storage upload failed"));
      xhr.onabort = () => reject(new Error("Upload cancel kiya gaya"));
      xhr.send(file);
    });
    const done = await fetch("/api/media/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: ticket.ticketId }),
    });
    const data = (await done.json().catch(() => ({}))) as {
      file?: UploadedFile;
      error?: string;
    };
    if (!done.ok || !data.file) throw new Error(data.error ?? "Verify failed");
    return data.file;
  }

  /** Classic multipart (local/blob + fallback) — pehle jaisa, untouched logic */
  async function uploadViaMultipart(file: File): Promise<UploadedFile> {
    const fd = new FormData();
    fd.append("file", file);
    const ctrl = new AbortController();
    abortRef.current = { abort: () => ctrl.abort() };
    const res = await fetch("/api/media", {
      method: "POST",
      body: fd,
      signal: ctrl.signal,
    });
    const data = (await res.json().catch(() => ({}))) as {
      file?: UploadedFile;
      error?: string;
    };
    if (!res.ok || !data.file) throw new Error(data.error ?? "Upload failed");
    return data.file;
  }

  async function uploadOne(file: File) {
    if (file.size > maxBytes) {
      onError?.(`"${file.name}" bahut badi hai (max ${maxLabel})`);
      return;
    }
    if (file.size === 0) {
      onError?.(`"${file.name}" empty file hai`);
      return;
    }
    setUploading(file.name);
    setProgress(null);
    try {
      let uploaded: UploadedFile;
      try {
        uploaded = await uploadViaPresign(file);
      } catch (err) {
        // Direct presigned upload failed (e.g. Backblaze B2 CORS restriction or network issue)
        // Seamlessly fallback to server-side multipart upload (/api/media) which always succeeds!
        console.warn(
          "[upload] Direct storage upload failed (e.g. CORS), falling back to server multipart:",
          (err as Error).message,
        );
        setProgress(null);
        uploaded = await uploadViaMultipart(file);
      }
      onUploaded(uploaded);
    } catch (err) {
      if ((err as Error).name !== "AbortError") onError?.((err as Error).message);
    } finally {
      abortRef.current = null;
      setUploading(null);
      setProgress(null);
    }
  }

  async function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    const files = multiple ? [...list] : [list[0]];
    for (const f of files) {
      if (f) await uploadOne(f); // sequential — server-friendly
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={multiple}
        accept={accept}
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={!!uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center transition-all duration-200 focus-ring disabled:opacity-70",
          compact ? "p-4" : "p-8",
          dragOver
            ? "scale-[1.01] border-violet-400 bg-violet-500/10"
            : "border-white/15 bg-white/[0.02] hover:border-violet-400/40 hover:bg-violet-500/5",
        )}
      >
        {uploading ? (
          <>
            <Loader2
              className={cn("animate-spin text-violet-300", compact ? "h-5 w-5" : "h-8 w-8")}
            />
            <span className="max-w-full truncate text-xs text-zinc-400">
              Uploading {uploading}…{progress !== null ? ` ${progress}%` : ""}
            </span>
            {progress !== null ? (
              <span className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full bg-violet-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </span>
            ) : null}
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                cancelUpload();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  cancelUpload();
                }
              }}
              className="inline-flex cursor-pointer items-center gap-1 text-xs text-zinc-500 hover:text-red-300"
            >
              <X className="h-3 w-3" /> Cancel
            </span>
          </>
        ) : (
          <>
            {dragOver ? (
              <Upload className={cn("text-violet-300", compact ? "h-6 w-6" : "h-9 w-9")} />
            ) : (
              <FileUp className={cn("text-zinc-500", compact ? "h-5 w-5" : "h-8 w-8")} />
            )}
            <span className={cn("font-medium text-zinc-200", compact ? "text-xs" : "text-sm")}>
              {dragOver ? "Chhod do — upload shuru!" : "Drag & drop files here"}
            </span>
            {!compact || !dragOver ? (
              <span className="text-xs text-zinc-500">
                ya click karke choose karein · PDF, images, audio, video, docs, zip · max{" "}
                {maxLabel}
              </span>
            ) : null}
          </>
        )}
      </button>
    </div>
  );
}
