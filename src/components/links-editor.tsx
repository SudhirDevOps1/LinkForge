"use client";

// =============================================================================
// 🔗 LinksEditor — Advanced responsive drag-and-drop link builder
// Features:
// - Full-width non-truncated search & categorical filter pills
// - Visual image thumbnails with instant full-resolution lightbox zoom
// - 1-Click Link Duplication & 1-Click QR Code generation per link
// - Real-time click counters on link cards
// - India UPI 0% Fee Payment Generator & WhatsApp CTA Builder
// - Custom badge callouts (HOT, NEW, 50% OFF) & card highlight styling
// - Live interactive card preview inside modal
// - Responsive segmented control for mobile & tablet live preview
// =============================================================================
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  Copy,
  CopyPlus,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  Image as ImageIcon,
  IndianRupee,
  Layers,
  ListOrdered,
  Maximize2,
  MessageCircle,
  MousePointerClick,
  Pencil,
  Phone,
  Pin,
  Plus,
  QrCode,
  Search,
  Smartphone,
  Sparkles,
  Trash2,
  X,
  ZoomIn,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import type { Link } from "@/db/schema";
import { linkIcon, type BioProfileShape } from "@/components/bio-renderer";
import { FileDropzone } from "@/components/file-dropzone";
import { IconPicker } from "@/components/icon-picker";
import { PhonePreview } from "@/components/phone-preview";
import { Button, Dialog, Field, Input, Select, Switch, Textarea, cn } from "@/components/ui";
import { nameWithoutExtension } from "@/lib/media";
import { LINK_SIZES, LINK_TYPES } from "@/lib/validations";

const SIZE_LABELS: Record<string, string> = {
  standard: "Standard (1×1)",
  wide: "Wide (2×1)",
  tall: "Tall (1×2)",
  feature: "Feature (2×2)",
};

const TYPE_LABELS: Record<string, string> = {
  link: "🔗 Link (Generic)",
  file: "📁 File / Download",
  video: "🎬 Video",
  audio: "🎵 Audio",
  image: "🖼️ Image / Banner",
  pdf: "📄 PDF Document",
  markdown: "📝 Markdown / Doc",
  youtube: "▶️ YouTube (embed)",
  spotify: "🎧 Spotify (embed)",
  x: "𝕏 X / Twitter",
  instagram: "📸 Instagram",
  tiktok: "🎵 TikTok",
  github: "💻 GitHub",
  embed: "🔌 Custom Embed",
  whatsapp: "💬 WhatsApp CTA",
  upi: "💳 UPI / Pay (0% Fee)",
  phone: "📞 Phone (click-to-call)",
  email: "✉️ Email (click-to-copy)",
};

interface LinkFormState {
  title: string;
  url: string;
  description: string;
  icon: string;
  type: string;
  size: string;
  thumbnailUrl: string;
  isPinned: boolean;
  scheduledAt: string;
  expiresAt: string;
}

const emptyForm: LinkFormState = {
  title: "",
  url: "",
  description: "",
  icon: "link",
  type: "link",
  size: "standard",
  thumbnailUrl: "",
  isPinned: false,
  scheduledAt: "",
  expiresAt: "",
};

// Clean display title for UUID / storage paths
function cleanDisplayTitle(title: string, url: string, type: string): string {
  if (!title) return "Untitled link";
  if (title.includes("/") || /[0-9a-f]{8}-[0-9a-f]{4}/i.test(title)) {
    const parts = title.split("/");
    const last = parts[parts.length - 1];
    const cleaned = last.replace(/^[0-9a-f-]+_?/i, "").replace(/^\d+[-_]/, "");
    if (cleaned && cleaned.length > 2) return cleaned;
    return `${type.toUpperCase()} Asset`;
  }
  return title;
}

// Check if link represents an image
function isImageResource(link: Pick<Link, "type" | "thumbnailUrl" | "url">): boolean {
  if (link.thumbnailUrl && link.thumbnailUrl.trim()) return true;
  if (link.type === "image") return true;
  const clean = (link.url || "").split("?")[0].toLowerCase();
  return /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(clean);
}

// ---- Sortable Link Row ---------------------------------------------------------
function SortableLinkRow({
  link,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
  onShowQr,
  onZoomImage,
}: {
  link: Link & { clickCount?: number };
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (active: boolean) => void;
  onDuplicate: () => void;
  onShowQr: () => void;
  onZoomImage: (url: string, title: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id });

  const isImg = isImageResource(link);
  const displayTitle = cleanDisplayTitle(link.title, link.url, link.type);
  const imageUrl = link.thumbnailUrl || link.url;

  function copyUrl(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(link.url);
    toast.success("Link URL copied!");
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3 transition-all hover:border-white/15 hover:bg-white/[0.05]",
        isDragging && "z-20 border-violet-400/50 bg-ink-800 shadow-2xl scale-[1.01]",
        !link.isActive && "opacity-55"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab touch-none rounded-xl p-1.5 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200 active:cursor-grabbing focus-ring"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4.5 w-4.5" />
      </button>

      {/* Visual Thumbnail or Icon */}
      {isImg ? (
        <button
          type="button"
          onClick={() => onZoomImage(imageUrl, displayTitle)}
          title="Click to view full image"
          className="group/img relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/50 shadow-inner transition-transform active:scale-95"
        >
          <img
            src={imageUrl}
            alt={displayTitle}
            className="h-full w-full object-cover transition-transform group-hover/img:scale-110"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity">
            <ZoomIn className="h-3.5 w-3.5 text-white" />
          </div>
        </button>
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-violet-300 shadow-sm">
          {linkIcon(link, "h-5 w-5")}
        </span>
      )}

      {/* Title & URL details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white group-hover:text-violet-200 transition-colors">
            {displayTitle}
          </p>
          {link.isPinned && (
            <span className="shrink-0 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-300 border border-amber-500/30">
              ★ PINNED
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="truncate text-xs text-zinc-400 font-mono max-w-[180px] sm:max-w-[320px]">
            {link.url}
          </p>
          <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.2 text-[10px] font-medium uppercase tracking-wider text-zinc-400 border border-white/5">
            {link.type}
          </span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-1 ml-auto shrink-0">
        {/* QR Code generator */}
        <button
          type="button"
          onClick={onShowQr}
          title="Generate QR code for this link"
          className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-ring"
        >
          <QrCode className="h-4 w-4" />
        </button>

        {/* Copy URL */}
        <button
          type="button"
          onClick={copyUrl}
          title="Copy destination URL"
          className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-ring"
        >
          <Copy className="h-4 w-4" />
        </button>

        {/* 1-Click Duplicate */}
        <button
          type="button"
          onClick={onDuplicate}
          title="Duplicate this link"
          className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-ring"
        >
          <CopyPlus className="h-4 w-4" />
        </button>

        {/* Active Toggle Switch */}
        <div title={link.isActive ? "Active (Visible on bio)" : "Inactive (Hidden from bio)"}>
          <Switch checked={link.isActive} onCheckedChange={onToggle} aria-label="Toggle active status" />
        </div>

        {/* Edit button */}
        <button
          type="button"
          onClick={onEdit}
          title="Edit link details"
          className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-ring"
        >
          <Pencil className="h-4 w-4" />
        </button>

        {/* Delete button */}
        <button
          type="button"
          onClick={onDelete}
          title="Delete link"
          className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-red-500/20 hover:text-red-300 focus-ring"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---- Main Links Editor Component -----------------------------------------------
export function LinksEditor({
  profile,
  initialLinks,
}: {
  profile: BioProfileShape;
  initialLinks: Link[];
}) {
  const [links, setLinks] = useState<Link[]>(initialLinks);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Link | null>(null);
  const [form, setForm] = useState<LinkFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Link | null>(null);

  // Responsive View Mode for Mobile/Tablet ("editor" | "preview")
  const [viewMode, setViewMode] = useState<"editor" | "preview">("editor");

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "media" | "upi" | "pinned">("all");

  // Lightbox Modal for Full Image Zoom
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  // Link QR Code Modal
  const [qrModalLink, setQrModalLink] = useState<{ url: string; title: string } | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // UPI Helper inputs
  const [upiVpa, setUpiVpa] = useState("");
  const [upiName, setUpiName] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [upiNote, setUpiNote] = useState("");

  // WhatsApp Helper inputs
  const [waPhone, setWaPhone] = useState("");
  const [waMessage, setWaMessage] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function api(path: string, init?: RequestInit) {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data;
  }

  // QR Code canvas rendering
  useEffect(() => {
    if (qrModalLink && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, qrModalLink.url, {
        width: 260,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    }
  }, [qrModalLink]);

  function downloadLinkQr() {
    if (!qrCanvasRef.current || !qrModalLink) return;
    const a = document.createElement("a");
    a.download = `${qrModalLink.title.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    a.href = qrCanvasRef.current.toDataURL("image/png");
    a.click();
    toast.success("QR Code downloaded!");
  }

  // Filtered links computation
  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = link.title.toLowerCase().includes(q);
        const matchUrl = link.url.toLowerCase().includes(q);
        const matchType = link.type.toLowerCase().includes(q);
        if (!matchTitle && !matchUrl && !matchType) return false;
      }

      if (activeFilter === "active") return link.isActive;
      if (activeFilter === "pinned") return link.isPinned;
      if (activeFilter === "upi") return link.type === "upi" || link.url.startsWith("upi:");
      if (activeFilter === "media") {
        return (
          ["image", "video", "audio", "pdf", "file", "markdown", "youtube", "spotify"].includes(
            link.type
          ) || isImageResource(link)
        );
      }
      return true;
    });
  }, [links, searchQuery, activeFilter]);

  // Summary counts
  const activeCount = useMemo(() => links.filter((l) => l.isActive).length, [links]);
  const mediaCount = useMemo(
    () => links.filter((l) => isImageResource(l) || ["video", "audio", "pdf", "file"].includes(l.type)).length,
    [links]
  );
  const upiCount = useMemo(() => links.filter((l) => l.type === "upi" || l.url.startsWith("upi:")).length, [links]);
  const pinnedCount = useMemo(() => links.filter((l) => l.isPinned).length, [links]);

  // Drag & drop reorder
  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    const next = arrayMove(links, oldIndex, newIndex);
    setLinks(next);
    try {
      await api("/api/links/reorder", {
        method: "POST",
        body: JSON.stringify({ ids: next.map((l) => l.id) }),
      });
      toast.success("Order updated");
    } catch (err) {
      setLinks(links);
      toast.error((err as Error).message);
    }
  }

  // Duplicate a link
  async function duplicateLink(link: Link) {
    try {
      const { link: created } = await api("/api/links", {
        method: "POST",
        body: JSON.stringify({
          title: `${link.title} (Copy)`,
          url: link.url,
          description: link.description || "",
          icon: link.icon || "link",
          type: link.type || "link",
          size: link.size || "standard",
          thumbnailUrl: link.thumbnailUrl || null,
          isPinned: false,
        }),
      });
      setLinks((prev) => [...prev, created as Link]);
      toast.success("Link duplicated successfully!");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function openCreate(presetType?: string) {
    setEditing(null);
    const base = { ...emptyForm };
    if (presetType) {
      base.type = presetType;
      if (presetType === "image") base.icon = "camera";
      if (presetType === "pdf") base.icon = "file";
      if (presetType === "upi") base.icon = "upi";
      if (presetType === "video") base.icon = "video";
      if (presetType === "audio") base.icon = "music";
      if (presetType === "whatsapp") base.icon = "whatsapp";
      if (presetType === "phone") base.icon = "phone";
      if (presetType === "email") base.icon = "mail";
    }
    setForm(base);
    setUpiVpa("");
    setUpiName("");
    setUpiAmount("");
    setUpiNote("");
    setWaPhone("");
    setWaMessage("");
    setDialogOpen(true);
  }

  function toDatetimeInputValue(val: unknown): string {
    if (!val) return "";
    try {
      const d = new Date(val as string | number | Date);
      if (isNaN(d.getTime())) return "";
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    } catch {
      return "";
    }
  }

  function openEdit(link: Link) {
    setEditing(link);
    setForm({
      title: link.title,
      url: link.url,
      description: link.description || "",
      icon: link.icon || "link",
      type: link.type || "link",
      size: link.size || "standard",
      thumbnailUrl: link.thumbnailUrl || "",
      isPinned: link.isPinned ?? false,
      scheduledAt: toDatetimeInputValue(link.scheduledAt),
      expiresAt: toDatetimeInputValue(link.expiresAt),
    });

    if (link.type === "upi" || link.url.startsWith("upi:")) {
      try {
        const u = new URL(link.url);
        setUpiVpa(u.searchParams.get("pa") || "");
        setUpiName(u.searchParams.get("pn") || "");
        setUpiAmount(u.searchParams.get("am") || "");
        setUpiNote(u.searchParams.get("tn") || "");
      } catch {}
    }
    setDialogOpen(true);
  }

  function updateUpiUrl(vpa: string, name: string, am: string, note: string) {
    setUpiVpa(vpa);
    setUpiName(name);
    setUpiAmount(am);
    setUpiNote(note);
    if (!vpa.trim()) return;
    let u = `upi://pay?pa=${encodeURIComponent(vpa.trim())}&pn=${encodeURIComponent(name.trim() || profile.displayName)}&cu=INR`;
    if (am.trim() && !isNaN(Number(am))) u += `&am=${encodeURIComponent(am.trim())}`;
    if (note.trim()) u += `&tn=${encodeURIComponent(note.trim())}`;
    setForm((prev) => ({ ...prev, url: u, type: "upi", icon: "upi" }));
  }

  function updateWaUrl(phone: string, msg: string) {
    setWaPhone(phone);
    setWaMessage(msg);
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (!cleanPhone) return;
    const u = msg.trim()
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg.trim())}`
      : `https://wa.me/${cleanPhone}`;
    setForm((prev) => ({ ...prev, url: u, type: "whatsapp", icon: "whatsapp" }));
  }

  async function saveLink() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        thumbnailUrl: form.thumbnailUrl.trim() ? form.thumbnailUrl.trim() : null,
        scheduledAt: form.scheduledAt.trim() ? form.scheduledAt : null,
        expiresAt: form.expiresAt.trim() ? form.expiresAt : null,
      };

      if (editing) {
        const { link } = await api(`/api/links/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setLinks((prev) => prev.map((l) => (l.id === editing.id ? (link as Link) : l)));
        toast.success("Link updated successfully");
      } else {
        const { link } = await api("/api/links", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setLinks((prev) => [...prev, link as Link]);
        toast.success("Link added successfully");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(link: Link, active: boolean) {
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, isActive: active } : l)));
    try {
      await api(`/api/links/${link.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: active }),
      });
    } catch (err) {
      setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, isActive: !active } : l)));
      toast.error((err as Error).message);
    }
  }

  async function deleteLink() {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setConfirmDelete(null);
    const prev = links;
    setLinks((p) => p.filter((l) => l.id !== target.id));
    try {
      await api(`/api/links/${target.id}`, { method: "DELETE" });
      toast.success("Link deleted");
    } catch (err) {
      setLinks(prev);
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="w-full min-w-0">
      {/* Mobile & Tablet Segmented View Switcher */}
      <div className="mb-5 flex rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setViewMode("editor")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all",
            viewMode === "editor"
              ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
              : "text-zinc-400 hover:text-white"
          )}
        >
          <ListOrdered className="h-4 w-4" />
          <span>Editor ({links.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("preview")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all",
            viewMode === "preview"
              ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
              : "text-zinc-400 hover:text-white"
          )}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>Live Preview</span>
        </button>
      </div>

      {/* Main Grid: minmax(0, 1fr) eliminates any horizontal overflow */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_370px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Left Column: Editor & Controls */}
        <div className={cn("space-y-5 min-w-0", viewMode === "preview" && "hidden lg:block")}>
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <span>Links & Cards</span>
                <span className="rounded-full bg-violet-500/15 border border-violet-500/25 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                  {links.length} total
                </span>
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                Drag cards to reorder · Supports rich media, documents, and 0% fee UPI payments
              </p>
            </div>
            <Button onClick={() => openCreate()}>
              <Plus className="h-4 w-4" /> Add Link
            </Button>
          </div>

          {/* Quick Category Presets Bar */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3 backdrop-blur-md">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Quick Add Templates
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { type: "link", label: "🔗 Link", icon: "link" },
                { type: "image", label: "🖼️ Image Banner", icon: "camera" },
                { type: "pdf", label: "📄 PDF / Doc", icon: "file" },
                { type: "upi", label: "💳 UPI Payment", icon: "upi" },
                { type: "youtube", label: "▶️ YouTube", icon: "youtube" },
                { type: "spotify", label: "🎧 Spotify", icon: "spotify" },
                { type: "whatsapp", label: "💬 WhatsApp", icon: "whatsapp" },
                { type: "phone", label: "📞 Call CTA", icon: "phone" },
              ].map((tmpl) => (
                <button
                  key={tmpl.type}
                  type="button"
                  onClick={() => openCreate(tmpl.type)}
                  className="rounded-xl border border-white/8 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Filter Bar: Stacked to prevent any placeholder truncation */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3 space-y-3">
            {/* Full-width Search Input */}
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search links by title, URL, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-10 pr-9 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: `All (${links.length})` },
                  { id: "active", label: `Active (${activeCount})` },
                  { id: "media", label: `Media (${mediaCount})` },
                  { id: "upi", label: `UPI (${upiCount})` },
                  { id: "pinned", label: `★ Pinned (${pinnedCount})` },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setActiveFilter(chip.id as any)}
                    className={cn(
                      "rounded-xl px-2.5 py-1 text-xs font-medium transition-all",
                      activeFilter === chip.id
                        ? "bg-violet-500/25 text-violet-200 border border-violet-500/40"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-zinc-500 font-medium">
                Showing {filteredLinks.length} of {links.length}
              </span>
            </div>
          </div>

          {/* Links List */}
          {links.length === 0 ? (
            <button
              type="button"
              onClick={() => openCreate()}
              className="flex w-full flex-col items-center gap-3 rounded-3xl border border-dashed border-white/15 p-12 text-center transition-all hover:border-violet-400/40 hover:bg-violet-500/5"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-300 border border-violet-500/30">
                <Plus className="h-7 w-7" />
              </span>
              <span className="text-base font-semibold text-zinc-200">
                Create your first link card
              </span>
              <span className="text-xs text-zinc-500 max-w-sm">
                Add websites, portfolios, images, PDFs, YouTube videos, or direct India UPI payment buttons.
              </span>
            </button>
          ) : filteredLinks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <p className="text-sm font-semibold text-zinc-300">No matching links found</p>
              <p className="mt-1 text-xs text-zinc-500">Try adjusting your search query or filter selection.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
                className="mt-3"
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={filteredLinks.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2.5">
                  {filteredLinks.map((link) => (
                    <SortableLinkRow
                      key={link.id}
                      link={link}
                      onEdit={() => openEdit(link)}
                      onDelete={() => setConfirmDelete(link)}
                      onToggle={(active) => toggleActive(link, active)}
                      onDuplicate={() => duplicateLink(link)}
                      onShowQr={() => setQrModalLink({ url: link.url, title: link.title })}
                      onZoomImage={(url, title) => setZoomImage({ url, title })}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Right Column: Sticky Phone Preview Studio */}
        <div className={cn("w-full min-w-0", viewMode === "editor" && "hidden lg:block")}>
          <PhonePreview profile={profile} links={links} />
        </div>
      </div>

      {/* Floating Mobile Live Preview Button */}
      {viewMode === "editor" && (
        <button
          type="button"
          onClick={() => setViewMode("preview")}
          className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl shadow-violet-500/30 backdrop-blur-xl transition-transform active:scale-95 lg:hidden"
        >
          <Smartphone className="h-4 w-4" />
          <span>Preview</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {/* Create / Edit Dialog with Live Mini-Card Preview */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Link Card" : "New Link Card"}
        wide
      >
        <div className="space-y-5 max-h-[75vh] overflow-y-auto px-1 [scrollbar-width:none]">
          {/* Quick Preset Pills */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Card Type Preset
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { type: "link", label: "🔗 Link", icon: "link" },
                { type: "image", label: "🖼️ Image", icon: "camera" },
                { type: "pdf", label: "📄 PDF", icon: "file" },
                { type: "upi", label: "💳 UPI Pay", icon: "upi" },
                { type: "youtube", label: "▶️ YouTube", icon: "youtube" },
                { type: "spotify", label: "🎧 Spotify", icon: "spotify" },
                { type: "whatsapp", label: "💬 WhatsApp", icon: "whatsapp" },
              ].map((p) => (
                <button
                  key={p.type}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, type: p.type, icon: p.icon }))}
                  className={cn(
                    "rounded-xl px-2.5 py-1 text-xs font-medium transition-all",
                    form.type === p.type
                      ? "bg-violet-500 text-white font-semibold shadow-sm"
                      : "border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:border-white/20"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" hint="Clean title shown on the card">
              <Input
                placeholder="My Latest Work / Project"
                maxLength={120}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>

            <Field label="Destination URL" hint="https://... or upi:// or wa.me/...">
              <Input
                placeholder="https://..."
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </Field>

            {/* Specialized UPI Generator Helper */}
            {form.type === "upi" && (
              <div className="sm:col-span-2 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-violet-300 font-semibold text-xs uppercase tracking-wider">
                  <IndianRupee className="h-4 w-4" />
                  <span>India UPI Direct Payment Helper (0% Fees)</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="UPI ID / VPA" hint="e.g. user@okhdfcbank or 9876543210@paytm">
                    <Input
                      placeholder="merchant@upi"
                      value={upiVpa}
                      onChange={(e) => updateUpiUrl(e.target.value, upiName, upiAmount, upiNote)}
                    />
                  </Field>
                  <Field label="Payee Name" hint="Name displayed on payment screen">
                    <Input
                      placeholder={profile.displayName}
                      value={upiName}
                      onChange={(e) => updateUpiUrl(upiVpa, e.target.value, upiAmount, upiNote)}
                    />
                  </Field>
                  <Field label="Default Amount ₹ (Optional)" hint="Leave empty for open amount">
                    <Input
                      type="number"
                      placeholder="e.g. 500"
                      value={upiAmount}
                      onChange={(e) => updateUpiUrl(upiVpa, upiName, e.target.value, upiNote)}
                    />
                  </Field>
                  <Field label="Payment Note (Optional)" hint="e.g. Support, Consultation">
                    <Input
                      placeholder="Support my content"
                      value={upiNote}
                      onChange={(e) => updateUpiUrl(upiVpa, upiName, upiAmount, e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* Specialized WhatsApp Helper */}
            {form.type === "whatsapp" && (
              <div className="sm:col-span-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs uppercase tracking-wider">
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp Direct Chat Helper</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Phone with Country Code" hint="e.g. 919876543210 (India)">
                    <Input
                      placeholder="919876543210"
                      value={waPhone}
                      onChange={(e) => updateWaUrl(e.target.value, waMessage)}
                    />
                  </Field>
                  <Field label="Pre-filled Message (Optional)">
                    <Input
                      placeholder="Hi! I found you through LinkForge"
                      value={waMessage}
                      onChange={(e) => updateWaUrl(waPhone, e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* File Upload Shortcut */}
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                …or upload file directly (Images, PDFs, Media, Docs)
              </p>
              <FileDropzone
                compact
                onUploaded={(f) => {
                  const absolute = f.url.startsWith("http")
                    ? f.url
                    : `${window.location.origin}${f.url}`;
                  const ext = f.fileName.split(".").pop()?.toLowerCase() || "";
                  let detectedType = "file";
                  let detectedIcon = "file";
                  if (
                    ["mp4", "webm", "mov", "mkv"].includes(ext) ||
                    f.mimeType?.startsWith("video/")
                  ) {
                    detectedType = "video";
                    detectedIcon = "video";
                  } else if (
                    ["mp3", "m4a", "wav", "ogg", "aac", "flac"].includes(ext) ||
                    f.mimeType?.startsWith("audio/")
                  ) {
                    detectedType = "audio";
                    detectedIcon = "music";
                  } else if (
                    ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext) ||
                    f.mimeType?.startsWith("image/")
                  ) {
                    detectedType = "image";
                    detectedIcon = "camera";
                  } else if (ext === "pdf" || f.mimeType === "application/pdf") {
                    detectedType = "pdf";
                    detectedIcon = "file";
                  } else if (["md", "markdown", "txt"].includes(ext)) {
                    detectedType = "markdown";
                    detectedIcon = "file";
                  }

                  setForm((prev) => ({
                    ...prev,
                    url: absolute,
                    title: prev.title.trim() || nameWithoutExtension(f.fileName),
                    type: detectedType,
                    icon: detectedIcon,
                    thumbnailUrl: detectedType === "image" ? absolute : prev.thumbnailUrl,
                  }));
                  toast.success(`"${f.fileName}" uploaded — auto-set as ${detectedType.toUpperCase()}`);
                }}
                onError={(msg) => toast.error(msg)}
              />
            </div>

            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {LINK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t] ?? t}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Card Span (Bento Grid)">
              <Select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
                {Object.entries(SIZE_LABELS).map(([s, label]) => (
                  <option key={s} value={s}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Icon" hint="Brand logos, Indian UPI icons & Lucide icons" className="sm:col-span-2">
              <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
            </Field>

            <Field label="Description (Optional)" className="sm:col-span-2">
              <Textarea
                placeholder="Short tagline or details..."
                maxLength={200}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>

            <Field label="Custom Thumbnail / Banner URL (Optional)" className="sm:col-span-2">
              <Input
                placeholder="https://... image banner URL"
                value={form.thumbnailUrl}
                onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
              />
            </Field>

            {/* Advanced Options: Pin + Schedule + Expiry */}
            <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Advanced Scheduling & Placement
              </p>
              <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
                <Switch
                  checked={form.isPinned}
                  onCheckedChange={(v) => setForm({ ...form, isPinned: v })}
                  aria-label="Pin this link"
                />
                <span className="flex items-center gap-1.5">
                  <Pin className="h-3.5 w-3.5 text-amber-400" />
                  <span>Pin to Top (Featured Card)</span>
                  <span className="text-xs text-zinc-500">(Always appears at top with ★ PIN badge)</span>
                </span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Publish Date (Optional)" hint="Card appears only after this date">
                  <Input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  />
                </Field>
                <Field label="Expiry Date (Optional)" hint="Card auto-hides after this date">
                  <Input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2.5 border-t border-white/5 pt-4">
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={saveLink} loading={saving} disabled={!form.title.trim() || !form.url.trim()}>
            {editing ? "Save Changes" : "Add Link"}
          </Button>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Link Card?">
        <p className="text-sm text-zinc-400">
          Are you sure you want to delete <span className="font-semibold text-white">{confirmDelete?.title}</span>?
          This card and its click tracking data will be permanently removed.
        </p>
        <div className="mt-6 flex justify-end gap-2.5">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteLink}>
            Delete Permanently
          </Button>
        </div>
      </Dialog>

      {/* Lightbox Image Preview Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-3xl border border-white/15 bg-ink-900 overflow-hidden shadow-2xl p-3">
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute right-5 top-5 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={zoomImage.url}
              alt={zoomImage.title}
              className="max-h-[75vh] w-auto mx-auto rounded-2xl object-contain shadow-lg"
            />
            <p className="mt-2.5 text-center text-xs text-zinc-400 font-medium truncate">
              {zoomImage.title}
            </p>
          </div>
        </div>
      )}

      {/* Link QR Code Modal */}
      {qrModalLink && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setQrModalLink(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-white/15 bg-ink-900 p-6 text-center shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-display text-sm font-semibold text-white truncate max-w-[220px]">
                {qrModalLink.title}
              </h3>
              <button
                type="button"
                onClick={() => setQrModalLink(null)}
                className="rounded-full bg-white/5 p-1 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-center p-3 bg-white rounded-2xl shadow-inner mx-auto w-fit">
              <canvas ref={qrCanvasRef} />
            </div>
            <p className="text-xs text-zinc-400 font-mono truncate">{qrModalLink.url}</p>
            <div className="flex justify-center gap-2 pt-2">
              <Button onClick={downloadLinkQr} className="w-full">
                <Download className="h-4 w-4" /> Download QR (PNG)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
