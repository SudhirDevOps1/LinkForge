"use client";

// =============================================================================
// 📁 MediaManager — drag-and-drop file library
// Upload → preview (image/audio/video/PDF) → copy URL / create link / delete.
// Files configured storage provider par rehti hain (badge me provider dikhta hai).
// =============================================================================
import {
  Copy,
  ExternalLink,
  FileArchive,
  FileAudio,
  FileText,
  FileVideo,
  Image as ImageIcon,
  Link2,
  Search,
  Trash2,
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
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: nameWithoutExtension(file.fileName) || file.fileName,
          url: file.url.startsWith("http") ? file.url : `${window.location.origin}${file.url}`,
          description: `${CATEGORY_META[fileCategory(file.mimeType)].label} · ${formatBytes(file.sizeBytes)}`,
          type: "file",
          icon: "file",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Link banane me error");
      toast.success("Link ban gaya — Links tab me dikhega");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Media Library</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {files.length} files · {formatBytes(totalBytes)} · stored on{" "}
            <span className="font-semibold text-violet-300">{providerLabel}</span>
          </p>
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
                  <p className="truncate text-sm font-semibold text-white" title={file.fileName}>
                    {file.fileName}
                  </p>
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
