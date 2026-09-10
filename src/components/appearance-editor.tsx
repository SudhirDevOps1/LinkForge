"use client";

// =============================================================================
// 🎨 AppearanceEditor — Responsive theme picker + layout toggle + live preview
// Supports dual-mode mobile preview, fluid non-overflow grid, and design sliders
// =============================================================================
import {
  Check,
  Eye,
  LayoutGrid,
  List,
  Loader2,
  Palette,
  RotateCcw,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Link } from "@/db/schema";
import type { BioProfileShape } from "@/components/bio-renderer";
import { PhonePreview } from "@/components/phone-preview";
import { cn } from "@/components/ui";
import type { DesignPrefs } from "@/lib/design";
import { DESIGN_LIMITS, DEFAULT_ICON_SIZE } from "@/lib/design";
import { THEMES } from "@/lib/themes";

export function AppearanceEditor({
  profile: initialProfile,
  links,
}: {
  profile: BioProfileShape;
  links: Link[];
}) {
  const [theme, setTheme] = useState(initialProfile.theme);
  const [layout, setLayout] = useState(initialProfile.layout);
  const initialDesign: DesignPrefs = initialProfile.design ?? {};
  const [accent, setAccent] = useState(initialDesign.accent ?? "");
  const [radiusPx, setRadiusPx] = useState<number | undefined>(initialDesign.radiusPx);
  const [fontScale, setFontScale] = useState(initialDesign.fontScale ?? 1);
  const [iconSize, setIconSize] = useState(initialDesign.iconSize ?? DEFAULT_ICON_SIZE);
  const [saving, setSaving] = useState(false);

  // Responsive View Mode for Mobile / Tablet
  const [viewMode, setViewMode] = useState<"editor" | "preview">("editor");

  const themeDirty = theme !== initialProfile.theme || layout !== initialProfile.layout;
  const designDirty =
    accent !== (initialDesign.accent ?? "") ||
    radiusPx !== initialDesign.radiusPx ||
    fontScale !== (initialDesign.fontScale ?? 1) ||
    iconSize !== (initialDesign.iconSize ?? DEFAULT_ICON_SIZE);
  const dirty = themeDirty || designDirty;

  const previewProfile = {
    ...initialProfile,
    theme,
    layout,
    design: { accent: accent || undefined, radiusPx, fontScale, iconSize },
  };

  async function save() {
    setSaving(true);
    try {
      if (themeDirty) {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme, layout }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          toast.error(data.error ?? "Save failed");
          return;
        }
      }
      if (designDirty) {
        const res = await fetch("/api/design", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(accent ? { accent } : {}),
            ...(radiusPx != null ? { radiusPx } : {}),
            fontScale,
            iconSize,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          toast.error(data.error ?? "Design save failed");
          return;
        }
      }
      toast.success("Appearance saved successfully");
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  function resetDesign() {
    setAccent("");
    setRadiusPx(undefined);
    setFontScale(1);
    setIconSize(DEFAULT_ICON_SIZE);
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
          <Palette className="h-4 w-4" />
          <span>Style Editor</span>
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

      {/* Responsive Grid Layout with minmax(0, 1fr) to prevent overflow */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_370px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Left Column: Style Controls */}
        <div className={cn("space-y-8 min-w-0", viewMode === "preview" && "hidden lg:block")}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">Appearance</h1>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                Choose from 12 curated themes, card layouts, and custom design accents
              </p>
            </div>
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-500 px-5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,.4)] transition-all hover:bg-violet-400 disabled:opacity-40 disabled:pointer-events-none"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </button>
          </div>

          {/* Layout Toggle */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Page Layout Mode
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "list", label: "Classic list", desc: "Simple vertical stack", icon: List },
                { id: "bento", label: "Bento grid", desc: "Pinterest-style spans", icon: LayoutGrid },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setLayout(opt.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all",
                    layout === opt.id
                      ? "border-violet-400/50 bg-violet-500/10 ring-glow"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20",
                  )}
                >
                  <opt.icon className={cn("h-5 w-5", layout === opt.id ? "text-violet-300" : "text-zinc-500")} />
                  <span>
                    <span className="block text-sm font-semibold">{opt.label}</span>
                    <span className="block text-xs text-zinc-500">{opt.desc}</span>
                  </span>
                  {layout === opt.id ? <Check className="ml-auto h-4 w-4 text-violet-300" /> : null}
                </button>
              ))}
            </div>
          </section>

          {/* Theme Grid */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Theme Palette · {THEMES.length} available
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {THEMES.map((t) => {
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "group overflow-hidden rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5",
                      active
                        ? "border-violet-400/60 ring-glow"
                        : "border-white/10 hover:border-white/25",
                    )}
                  >
                    <div className="relative h-24 p-2.5" style={{ background: t.swatch[0] }}>
                      <div className="space-y-1.5">
                        <div className="h-2 w-3/4 rounded-full" style={{ background: t.swatch[1] }} />
                        <div className="h-2 w-full rounded-full" style={{ background: t.swatch[1] }} />
                        <div className="h-2 w-2/3 rounded-full" style={{ background: t.swatch[2] }} />
                      </div>
                      {active ? (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500">
                          <Check className="h-3 w-3 text-white" />
                        </span>
                      ) : null}
                    </div>
                    <div className="border-t border-white/5 bg-ink-900/60 p-2.5">
                      <p className="text-xs font-semibold text-white">{t.name}</p>
                      <p className="line-clamp-1 text-[10px] text-zinc-500">{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Design Controls */}
          <section className="space-y-4 rounded-3xl border border-white/8 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-white">Fine-Tuning</h2>
                <p className="text-xs text-zinc-400">Accent color, card border radius, and font scaling</p>
              </div>
              {accent || radiusPx != null || fontScale !== 1 || iconSize !== DEFAULT_ICON_SIZE ? (
                <button
                  type="button"
                  onClick={resetDesign}
                  className="flex items-center gap-1 text-xs text-violet-300 hover:underline"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-zinc-400">Custom accent color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accent || "#8b5cf6"}
                    onChange={(e) => setAccent(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-white/15 bg-transparent p-1"
                  />
                  <input
                    type="text"
                    placeholder="#8b5cf6 (hex)"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 flex justify-between text-xs text-zinc-400">
                  <span>Border radius</span>
                  <span>{radiusPx ?? "theme"}px</span>
                </span>
                <input
                  type="range"
                  min={DESIGN_LIMITS.radiusPx.min}
                  max={DESIGN_LIMITS.radiusPx.max}
                  value={radiusPx ?? 16}
                  onChange={(e) => setRadiusPx(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </label>

              <label className="block">
                <span className="mb-1 flex justify-between text-xs text-zinc-400">
                  <span>Font scale</span>
                  <span>{Math.round(fontScale * 100)}%</span>
                </span>
                <input
                  type="range"
                  min={DESIGN_LIMITS.fontScale.min * 100}
                  max={DESIGN_LIMITS.fontScale.max * 100}
                  step={5}
                  value={Math.round(fontScale * 100)}
                  onChange={(e) => setFontScale(Number(e.target.value) / 100)}
                  className="w-full accent-violet-500"
                />
              </label>

              <label className="block">
                <span className="mb-1 flex justify-between text-xs text-zinc-400">
                  <span>Icon size</span>
                  <span>{iconSize}px</span>
                </span>
                <input
                  type="range"
                  min={DESIGN_LIMITS.iconSize.min}
                  max={DESIGN_LIMITS.iconSize.max}
                  value={iconSize}
                  onChange={(e) => setIconSize(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </label>
            </div>
          </section>
        </div>

        {/* Right Column: Live Phone Preview */}
        <div className={cn("w-full min-w-0", viewMode === "editor" && "hidden lg:block")}>
          <PhonePreview profile={previewProfile} links={links} />
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
    </div>
  );
}
