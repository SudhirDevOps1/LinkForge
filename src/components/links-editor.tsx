"use client";

// =============================================================================
// 🔗 LinksEditor — drag-and-drop link manager with live phone preview
// Link dialog me file upload bhi built-in hai — PDF/doc/media drop karo,
// URL auto-fill + type=file set ho jata hai.
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
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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

interface LinkFormState {
  title: string;
  url: string;
  description: string;
  icon: string;
  type: string;
  size: string;
}

const emptyForm: LinkFormState = {
  title: "",
  url: "",
  description: "",
  icon: "link",
  type: "link",
  size: "standard",
};

// ---- Sortable row --------------------------------------------------------------
function SortableLinkRow({
  link,
  onEdit,
  onDelete,
  onToggle,
}: {
  link: Link;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (active: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3 transition-colors hover:border-white/15",
        isDragging && "z-20 border-violet-400/40 bg-ink-800 shadow-2xl",
        !link.isActive && "opacity-50",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-white/5 hover:text-zinc-300 active:cursor-grabbing focus-ring"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4.5 w-4.5" />
      </button>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-violet-300">
        {linkIcon(link, "h-4.5 w-4.5")}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{link.title}</p>
        <p className="truncate text-xs text-zinc-500">{link.url}</p>
      </div>
      <span className="hidden rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:block">
        {link.type}
      </span>
      <Switch checked={link.isActive} onCheckedChange={onToggle} aria-label="toggle active" />
      <button
        onClick={onEdit}
        className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white focus-ring"
        aria-label="Edit link"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={onDelete}
        className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-300 focus-ring"
        aria-label="Delete link"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ---- Main editor ------------------------------------------------------------------
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

  // ---- Drag & drop ----------------------------------------------------------------
  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    const next = arrayMove(links, oldIndex, newIndex);
    setLinks(next); // optimistic
    try {
      await api("/api/links/reorder", {
        method: "POST",
        body: JSON.stringify({ ids: next.map((l) => l.id) }),
      });
    } catch (err) {
      setLinks(links); // rollback
      toast.error((err as Error).message);
    }
  }

  // ---- CRUD ------------------------------------------------------------------------
  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(link: Link) {
    setEditing(link);
    setForm({
      title: link.title,
      url: link.url,
      description: link.description,
      icon: link.icon,
      type: link.type,
      size: link.size,
    });
    setDialogOpen(true);
  }

  async function saveLink() {
    setSaving(true);
    try {
      if (editing) {
        const { link } = await api(`/api/links/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        setLinks((prev) => prev.map((l) => (l.id === editing.id ? (link as Link) : l)));
        toast.success("Link update ho gaya");
      } else {
        const { link } = await api("/api/links", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setLinks((prev) => [...prev, link as Link]);
        toast.success("Link add ho gaya");
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
      toast.success("Link delete ho gaya");
    } catch (err) {
      setLinks(prev);
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Links</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Drag karke reorder karein · {links.length} links
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add link
          </Button>
        </div>

        {links.length === 0 ? (
          <button
            onClick={openCreate}
            className="flex w-full flex-col items-center gap-3 rounded-3xl border border-dashed border-white/15 p-12 text-center transition-colors hover:border-violet-400/40 hover:bg-violet-500/5"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
              <Plus className="h-6 w-6" />
            </span>
            <span className="text-sm font-medium text-zinc-300">Apna pehla link jodein</span>
            <span className="text-xs text-zinc-500">YouTube, Spotify, shop, blog — kuch bhi</span>
          </button>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2.5">
                {links.map((link) => (
                  <SortableLinkRow
                    key={link.id}
                    link={link}
                    onEdit={() => openEdit(link)}
                    onDelete={() => setConfirmDelete(link)}
                    onToggle={(active) => toggleActive(link, active)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="hidden lg:block">
        <PhonePreview profile={profile} links={links} />
      </div>

      {/* Create / Edit dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit link" : "New link"}
        wide
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <Input
              placeholder="My latest video"
              maxLength={120}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="URL">
            <Input
              placeholder="https://..."
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </Field>
          {/* File upload shortcut — URL + type auto-fill */}
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              …ya file upload karein (PDF / doc / media)
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
                }));
                toast.success(`"${f.fileName}" upload ho gayi — ${detectedType.toUpperCase()} auto-set ho gaya`);
              }}
              onError={(msg) => toast.error(msg)}
            />
          </div>
          <Field label="Type" hint="YouTube/Spotify links embed ho jate hain">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {LINK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Icon" hint="150+ brands, Indian platforms (UPI, Paytm, PhonePe) & generic icons with custom colors" className="sm:col-span-2">
            <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
          </Field>
          <Field label="Card size" hint="Bento layout me spans control karta hai" className="sm:col-span-2">
            <Select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
              {Object.entries(SIZE_LABELS).map(([s, label]) => (
                <option key={s} value={s}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description (optional)" className="sm:col-span-2">
            <Textarea
              placeholder="Short description..."
              maxLength={200}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={saveLink} loading={saving} disabled={!form.title.trim() || !form.url.trim()}>
            {editing ? "Save changes" : "Add link"}
          </Button>
        </div>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete link?">
        <p className="text-sm text-zinc-400">
          <span className="font-semibold text-white">{confirmDelete?.title}</span> permanently
          delete ho jayega. Iska click-analytics bhi chala jayega.
        </p>
        <div className="mt-6 flex justify-end gap-2.5">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteLink}>
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
