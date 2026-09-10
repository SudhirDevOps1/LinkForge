"use client";

// =============================================================================
// 📁 MediaManager — drag-and-drop file library
// Upload → preview (image/audio/video/PDF) → copy URL / create link / delete.
// Files configured storage provider par rehti hain (badge me provider dikhta hai).
// =============================================================================
import {
  Check,
  Copy,
  Edit2,
  ExternalLink,
  FileArchive,
  FileAudio,
  FileText,
  FileVideo,
  Image as ImageIcon,
  Link2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui";
import {
  fileCategory,
  formatBytes,
  nameWithoutExtension,
  type FileCategory,
} from "@/lib/media";

export interface MediaFileUI {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: string;
  storageKey: string;
  url: string;
  createdAt: string;
}

const CATEGORY_META: Record<FileCategory, { label: string; className: string }> = {
  image: { label: "Image", className: "bg-violet-500/15 text-violet-300" },
  pdf: { label: "PDF", className: "bg-red-500/15 text-red-300" },
  audio: { label: "Audio", className: "bg-emerald-500/15 text-emerald-300" },
  video: { label: "Video", className: "bg-sky-500/15 text-sky-300" },
  doc: { label: "Doc", className: "bg-amber-500/15 text-amber-300" },
  archive: { label: "ZIP", className: "bg-orange-500/15 text-orange-300" },
  other: { label: "File", className: "bg-white/10 text-zinc-300" },
};

function CategoryIcon({ category, className }: { category: FileCategory; className?: string }) {
  const cls = className ?? "h-8 w-8";
  switch (category) {
    case "image":
      return <ImageIcon className={cls} />;
    case "pdf":
      return <FileText className={cls} />;
    case "audio":
      return <FileAudio className={cls} />;
    case "video":
      return <FileVideo className={cls} />;
    case "archive":
      return <FileArchive className={cls} />;
    default:
      return <FileText className={cls} />;
  }
}

function Preview({ file }: { file: MediaFileUI }) {
  const category = fileCategory(file.mimeType);
  if (category === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={file.url} alt={file.fileName} loading="lazy" className="h-full w-full object-cover" />
    );
  }
  if (category === "video") {
    return <video src={file.url} preload="none" controls className="h-full w-full bg-black object-contain" />;
  }
  if (category === "audio") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4">
        <FileAudio className="h-8 w-8 text-emerald-300" />
        <audio src={file.url} preload="none" controls className="w-full" />
      </div>
    );
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-zinc-500">
      <CategoryIcon category={category} />
      <span className="text-[11px] font-semibold uppercase tracking-wider">
        {CATEGORY_META[category].label}
      </span>
    </div>
  );
}

export function MediaManager({
  initialFiles,
  providerLabel,
}: {
  initialFiles: MediaFileUI[];
  providerLabel: string;
}) {
  const [files, setFiles] = useState<MediaFileUI[]>(initialFiles);
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [creatingLink, setCreatingLink] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [renaming, setRenaming] = useState(false);

  function startRename(file: MediaFileUI) {
    setEditingFile(file.id);
    setEditName(file.fileName);
  }

  async function saveRename(file: MediaFileUI) {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === file.fileName) {
      setEditingFile(null);
      return;
    }
    setRenaming(true);
    try {
      const res = await fetch(`/api/media/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; file?: MediaFileUI };
      if (!res.ok) throw new Error(data.error ?? "Rename failed");
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, fileName: trimmed } : f)),
      );
      toast.success("File rename ho gayi");
      setEditingFile(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRenaming(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.fileName.toLowerCase().includes(q));
  }, [files, query]);

  const totalBytes = useMemo(
    () => files.reduce((s, f) => s + (f.sizeBytes ?? 0), 0),
    [files],
  );

  async function copyUrl(file: MediaFileUI) {
    const absolute = file.url.startsWith("http")
      ? file.url
      : `${window.location.origin}${file.url}`;
    try {
      await navigator.clipboard.writeText(absolute);
      toast.success("File URL copy ho gaya");
    } catch {
      toast.error("Copy failed — URL manually select karein");
    }
  }

  async function createLink(file: MediaFileUI) {
    setCreatingLink(file.id);
    try {
      const ext = file.fileName.split(".").pop()?.toLowerCase() || "";
      let detectedType = "file";
      let detectedIcon = "file";
      let thumbnailUrl: string | undefined = undefined;

      if (file.mimeType.startsWith("video/") || ["mp4", "webm", "mov", "mkv"].includes(ext)) {
        detectedType = "video";
        detectedIcon = "video";
      } else if (
        file.mimeType.startsWith("audio/") ||
        ["mp3", "m4a", "wav", "ogg", "aac", "flac"].includes(ext)
      ) {
        detectedType = "audio";
        detectedIcon = "music";
      } else if (
        file.mimeType.startsWith("image/") ||
        ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext)
      ) {
        detectedType = "image";
        detectedIcon = "camera";
        thumbnailUrl = file.url.startsWith("http") ? file.url : `${window.location.origin}${file.url}`;
      } else if (ext === "pdf" || file.mimeType === "application/pdf") {
        detectedType = "pdf";
        detectedIcon = "file";
      } else if (["md", "markdown", "txt"].includes(ext)) {
        detectedType = "markdown";
        detectedIcon = "file";
      }

      const cleanTitle =
        nameWithoutExtension(file.fileName).replace(/[_-]+/g, " ").trim() ||
        file.fileName;

      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          url: file.url.startsWith("http") ? file.url : `${window.location.origin}${file.url}`,
          description: `${CATEGORY_META[fileCategory(file.mimeType)].label} · ${formatBytes(file.sizeBytes)}`,
          type: detectedType,
          icon: detectedIcon,
          thumbnailUrl,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Link banane me error");
      toast.success(`"${cleanTitle}" ka ${detectedType.toUpperCase()} link ban gaya`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCreatingLink(null);
    }
  }

  async function deleteFile(file: MediaFileUI) {
    if (confirmDelete !== file.id) {
      setConfirmDelete(file.id);
      setTimeout(() => setConfirmDelete((cur) => (cur === file.id ? null : cur)), 4000);
      return;
    }
    setConfirmDelete(null);
    const prev = files;
    setFiles((p) => p.filter((f) => f.id !== file.id));
    try {
      const res = await fetch(`/api/media/${file.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Delete failed");
      }
      toast.success("File delete ho gayi");
    } catch (err) {
      setFiles(prev);
      toast.error((err as Error).message);
    }
  }

  const [syncingCors, setSyncingCors] = useState(false);

  async function syncB2Cors() {
    setSyncingCors(true);
    try {
      const res = await fetch("/api/storage/cors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origins: ["*", window.location.origin] }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };
      if (data.success) {
        toast.success("B2 CORS auto-applied! Ab direct uploads chalenge.");
      } else {
        toast.error(data.message ?? "B2 CORS update failed — Backblaze Console me Option 4 select karein");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSyncingCors(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Media Library</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {files.length} files · {formatBytes(totalBytes)} · stored on{" "}
            <span className="font-semibold text-violet-300">{providerLabel}</span>
          </p>
          {providerLabel.toLowerCase().includes("b2") && (
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                loading={syncingCors}
                onClick={syncB2Cors}
                className="border-violet-500/30 text-xs text-violet-300 hover:bg-violet-500/10"
              >
                ⚡ Auto-Fix B2 CORS (1-Click)
              </Button>
            </div>
          )}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files…"
            className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus-ring focus:border-violet-400/50"
          />
        </div>
      </div>

      <FileDropzone
        multiple
        onUploaded={(f) =>
          setFiles((prev) => [
            { ...f, createdAt: new Date().toISOString() },
            ...prev,
          ])
        }
        onError={(msg) => toast.error(msg)}
      />

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-zinc-600" />
          <p className="mt-4 text-sm font-medium text-zinc-300">
            {files.length === 0 ? "Abhi koi file nahi" : "Koi file match nahi hui"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Upar dropzone me PDF, images, audio ya koi bhi supported file daalein
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((file) => {
            const category = fileCategory(file.mimeType);
            const meta = CATEGORY_META[category];
            return (
              <div
                key={file.id}
                className="glass group overflow-hidden rounded-2xl transition-colors hover:border-violet-400/25"
              >
                <div className="relative h-40 overflow-hidden bg-black/30">
                  <Preview file={file} />
                  <span
                    className={`absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                </div>
                <div className="p-4">
                  {editingFile === file.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveRename(file);
                          if (e.key === "Escape") setEditingFile(null);
                        }}
                        autoFocus
                        disabled={renaming}
                        className="h-8 flex-1 rounded-lg border border-violet-400/50 bg-white/10 px-2 text-sm text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void saveRename(file)}
                        disabled={renaming}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                        title="Save name"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingFile(null)}
                        disabled={renaming}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-white" title={file.fileName}>
                        {file.fileName}
                      </p>
                      <button
                        type="button"
                        onClick={() => startRename(file)}
                        className="rounded p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-violet-300"
                        title="Rename file"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatBytes(file.sizeBytes)} ·{" "}
                    {new Date(file.createdAt).toLocaleDateString("en", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <a href={file.url} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3.5 w-3.5" /> Open
                      </Button>
                    </a>
                    <Button variant="ghost" size="sm" onClick={() => copyUrl(file)}>
                      <Copy className="h-3.5 w-3.5" /> URL
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={creatingLink === file.id}
                      onClick={() => createLink(file)}
                    >
                      <Link2 className="h-3.5 w-3.5" /> Link
                    </Button>
                    <Button
                      variant={confirmDelete === file.id ? "danger" : "ghost"}
                      size="sm"
                      onClick={() => deleteFile(file)}
                      className="ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {confirmDelete === file.id ? "Sure?" : ""}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
