"use client";

// =============================================================================
// 🎨 AppearanceEditor — Comprehensive real-time bio customization studio
// Features:
// - Real Brand Color Presets (Default, Sunset, Ocean, Emerald, Cyberpunk, Amber, etc.)
// - Custom Primary Accent & Background Color Pickers
// - 8 World-Class Google Fonts (Space Grotesk, Inter, Outfit, Jakarta, Syne, Playfair, Mono, Bricolage)
// - Typography Casing & Letter Spacing Controls
// - 5 Card Surface Styles (Glass Frosted, Solid Contrast, Neon Glow, Neumorphic, Minimal)
// - 4 Button Corner Shapes (Sharp, Soft 12px, Curved 18px, Full Pill)
// - 4 Atmosphere Background Effects (Ambient Aura Glow, Mesh Gradient, Dot Matrix, Pure Flat)
// - 4 Interactive Hover Motion Effects (Smooth Lift, Scale Pop, Glow Outline, Flat)
// - 12 Curated Themes & Classic vs Bento Grid Layout Mode
// - Instant live sync with PhonePreview & real persistence via /api/design and /api/profile
// =============================================================================
import {
  Check,
  Eye,
  LayoutGrid,
  List,
  Loader2,
  Maximize2,
  Minimize2,
  MousePointer,
  Palette,
  RotateCcw,
  Sliders,
  Smartphone,
  Sparkles,
  Type,
  Wand2,
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

const COLOR_PRESETS = [
  { label: "Default Violet", primary: "#8b5cf6", background: "#050508" },
  { label: "Sunset Glow", primary: "#fb7185", background: "#0f0f18" },
  { label: "Ocean Breeze", primary: "#38bdf8", background: "#030b1a" },
  { label: "Emerald Neon", primary: "#34d399", background: "#041410" },
  { label: "Cyberpunk Pink", primary: "#f43f5e", background: "#13091e" },
  { label: "Amber Gold", primary: "#f59e0b", background: "#130f08" },
  { label: "Electric Cyan", primary: "#06b6d4", background: "#02151d" },
  { label: "Obsidian Dark", primary: "#e4e4e7", background: "#09090b" },
];

const FONT_OPTIONS = [
  { id: "space-grotesk", name: "Space Grotesk", sample: "Aa Modern Tech", category: "Display" },
  { id: "inter", name: "Inter", sample: "Aa Clean & Crisp", category: "Sans-Serif" },
  { id: "outfit", name: "Outfit", sample: "Aa Trendy Geometric", category: "Geometric" },
  { id: "jakarta", name: "Plus Jakarta", sample: "Aa Premium Product", category: "Product" },
  { id: "syne", name: "Syne", sample: "Aa Bold Creator", category: "Artistic" },
  { id: "playfair", name: "Playfair Display", sample: "Aa Luxury Editorial", category: "Serif" },
  { id: "mono", name: "JetBrains Mono", sample: "Aa Developer Code", category: "Monospace" },
  { id: "bricolage", name: "Bricolage", sample: "Aa Expressive Quirky", category: "Display" },
];

const CARD_STYLES = [
  { id: "glass", label: "Glass Frosted", desc: "Frosted glass with backdrop blur" },
  { id: "solid", label: "Solid Contrast", desc: "Dark high-contrast opaque cards" },
  { id: "neon", label: "Neon Outline", desc: "Vibrant glowing border" },
  { id: "neumorphic", label: "Neumorphic", desc: "Soft organic deep shadows" },
  { id: "minimal", label: "Minimalist", desc: "Transparent borderless flat" },
];

const BUTTON_SHAPES = [
  { id: "sharp", label: "Sharp", radius: "0px", desc: "Boxy brutalist" },
  { id: "soft", label: "Soft", radius: "12px", desc: "Modern rounded" },
  { id: "curved", label: "Curved", radius: "18px", desc: "iOS curved" },
  { id: "pill", label: "Full Pill", radius: "9999px", desc: "Circular pill" },
];

const BACKGROUND_EFFECTS = [
  { id: "glow", label: "Ambient Aura", desc: "Luminous radial glow behind avatar" },
  { id: "mesh", label: "Mesh Gradient", desc: "Vibrant floating ambient gradient blobs" },
  { id: "dots", label: "Cyber Dots", desc: "Subtle cybernetic matrix dot grid" },
  { id: "none", label: "Flat Minimal", desc: "Pure solid background tone" },
];

const HOVER_EFFECTS = [
  { id: "lift", label: "Smooth Lift", desc: "Subtle upward lift on hover" },
  { id: "scale", label: "Scale Pop", desc: "Enlarges card by 2%" },
  { id: "glow", label: "Glow Outline", desc: "Border glow ring highlight" },
  { id: "none", label: "Static", desc: "No hover motion" },
];

export function AppearanceEditor({
  profile: initialProfile,
  links,
}: {
  profile: BioProfileShape;
  links: Link[];
}) {
  // Theme and layout states
  const [theme, setTheme] = useState(initialProfile.theme);
  const [layout, setLayout] = useState(initialProfile.layout);

  // Design customization states
  const initialDesign: DesignPrefs = initialProfile.design ?? {};
  const [accent, setAccent] = useState(initialDesign.accent ?? "");
  const [background, setBackground] = useState(initialDesign.background ?? "");
  const [radiusPx, setRadiusPx] = useState<number | undefined>(initialDesign.radiusPx);
  const [fontScale, setFontScale] = useState(initialDesign.fontScale ?? 1);
  const [iconSize, setIconSize] = useState(initialDesign.iconSize ?? DEFAULT_ICON_SIZE);

  // Advanced typography & effects states
  const [fontFamily, setFontFamily] = useState(initialDesign.fontFamily ?? "space-grotesk");
  const [fontStyle, setFontStyle] = useState(initialDesign.fontStyle ?? "normal");
  const [cardStyle, setCardStyle] = useState(initialDesign.cardStyle ?? "glass");
  const [buttonShape, setButtonShape] = useState(initialDesign.buttonShape ?? "curved");
  const [backgroundEffect, setBackgroundEffect] = useState(initialDesign.backgroundEffect ?? "glow");
  const [hoverEffect, setHoverEffect] = useState(initialDesign.hoverEffect ?? "lift");

  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"editor" | "preview">("editor");

  const themeDirty = theme !== initialProfile.theme || layout !== initialProfile.layout;
  const designDirty =
    accent !== (initialDesign.accent ?? "") ||
    background !== (initialDesign.background ?? "") ||
    radiusPx !== initialDesign.radiusPx ||
    fontScale !== (initialDesign.fontScale ?? 1) ||
    iconSize !== (initialDesign.iconSize ?? DEFAULT_ICON_SIZE) ||
    fontFamily !== (initialDesign.fontFamily ?? "space-grotesk") ||
    fontStyle !== (initialDesign.fontStyle ?? "normal") ||
    cardStyle !== (initialDesign.cardStyle ?? "glass") ||
    buttonShape !== (initialDesign.buttonShape ?? "curved") ||
    backgroundEffect !== (initialDesign.backgroundEffect ?? "glow") ||
    hoverEffect !== (initialDesign.hoverEffect ?? "lift");

  const dirty = themeDirty || designDirty;

  // Live real-time preview shape
  const previewProfile: BioProfileShape = {
    ...initialProfile,
    theme,
    layout,
    design: {
      accent: accent || undefined,
      background: background || undefined,
      radiusPx,
      fontScale,
      iconSize,
      fontFamily,
      fontStyle,
      cardStyle,
      buttonShape,
      backgroundEffect,
      hoverEffect,
    },
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
          toast.error(data.error ?? "Failed to save theme/layout");
          return;
        }
      }

      if (designDirty) {
        const res = await fetch("/api/design", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(accent ? { accent } : {}),
            ...(background ? { background } : {}),
            ...(radiusPx != null ? { radiusPx } : {}),
            fontScale,
            iconSize,
            fontFamily,
            fontStyle,
            cardStyle,
            buttonShape,
            backgroundEffect,
            hoverEffect,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          toast.error(data.error ?? "Failed to save design preferences");
          return;
        }
      }

      toast.success("Appearance & styling saved successfully!");
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  function resetToDefaults() {
    setAccent("");
    setBackground("");
    setRadiusPx(undefined);
    setFontScale(1);
    setIconSize(DEFAULT_ICON_SIZE);
    setFontFamily("space-grotesk");
    setFontStyle("normal");
    setCardStyle("glass");
    setButtonShape("curved");
    setBackgroundEffect("glow");
    setHoverEffect("lift");
    toast.info("Reset to theme defaults");
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
          <span>Style Studio</span>
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
        {/* Left Column: Style Controls */}
        <div className={cn("space-y-7 min-w-0", viewMode === "preview" && "hidden lg:block")}>
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <span>Appearance & Style Studio</span>
                {dirty && (
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                    Unsaved changes
                  </span>
                )}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                Live customize colors, typography, card shapes, and ambient atmosphere
              </p>
            </div>
            <div className="flex items-center gap-2">
              {dirty && (
                <button
                  type="button"
                  onClick={resetToDefaults}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <RotateCcw className="inline h-3.5 w-3.5 mr-1" /> Reset
                </button>
              )}
              <button
                onClick={save}
                disabled={!dirty || saving}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-500 px-5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,.4)] transition-all hover:bg-violet-400 disabled:opacity-40 disabled:pointer-events-none"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save changes
              </button>
            </div>
          </div>

          {/* SECTION 1: Brand Colors & Custom Tones */}
          <section className="rounded-3xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                <Palette className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-sm font-semibold text-white">Brand Color Palette</h2>
                <p className="text-[11px] text-zinc-400">Select preset or customize primary accent & page background</p>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {COLOR_PRESETS.map((p) => {
                const isActive = accent === p.primary && background === p.background;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setAccent(p.primary);
                      setBackground(p.background);
                    }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all hover:border-white/20",
                      isActive
                        ? "border-violet-400/60 bg-white/10 ring-1 ring-violet-400/40"
                        : "border-white/5 bg-black/30 hover:bg-white/[0.04]"
                    )}
                  >
                    <div
                      className="h-6 w-6 rounded-full border border-white/20 shrink-0 shadow-sm"
                      style={{ backgroundColor: p.primary }}
                    />
                    <span className="truncate text-xs font-medium text-zinc-300">{p.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Pickers */}
            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-white/5">
              <label className="block">
                <span className="mb-1 block text-xs text-zinc-400 font-medium">Primary Accent Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accent || "#8b5cf6"}
                    onChange={(e) => setAccent(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-xl border border-white/15 bg-transparent p-1 shadow-inner"
                  />
                  <input
                    type="text"
                    placeholder="#8b5cf6"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs text-zinc-400 font-medium">Custom Page Background</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={background || "#050508"}
                    onChange={(e) => setBackground(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-xl border border-white/15 bg-transparent p-1 shadow-inner"
                  />
                  <input
                    type="text"
                    placeholder="#050508"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </label>
            </div>
          </section>

          {/* SECTION 2: Typography & Font Studio */}
          <section className="rounded-3xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
                <Type className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-sm font-semibold text-white">Typography & Fonts</h2>
                <p className="text-[11px] text-zinc-400">Choose from 8 curated font families and casing styles</p>
              </div>
            </div>

            {/* Font Families Grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FONT_OPTIONS.map((f) => {
                const isActive = fontFamily === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFontFamily(f.id)}
                    className={cn(
                      "rounded-2xl border p-3 text-left transition-all hover:border-white/20",
                      isActive
                        ? "border-sky-400/60 bg-sky-500/10 ring-1 ring-sky-400/40"
                        : "border-white/5 bg-black/30 hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{f.name}</span>
                      {isActive && <Check className="h-3 w-3 text-sky-400" />}
                    </div>
                    <span className="mt-1 block text-[11px] text-zinc-400 opacity-80">{f.sample}</span>
                  </button>
                );
              })}
            </div>

            {/* Font Style Pills (Normal, Uppercase, Wide) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-400 font-medium mr-1">Casing:</span>
                {[
                  { id: "normal", label: "Default" },
                  { id: "uppercase", label: "UPPERCASE" },
                  { id: "wide", label: "Wide Spaced" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFontStyle(s.id)}
                    className={cn(
                      "rounded-xl px-2.5 py-1 text-xs font-medium transition-all",
                      fontStyle === s.id
                        ? "bg-sky-500/20 text-sky-200 border border-sky-500/40"
                        : "border border-white/5 bg-black/20 text-zinc-400 hover:text-white"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Font Scale slider */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 font-medium">
                  Scale: {Math.round(fontScale * 100)}%
                </span>
                <input
                  type="range"
                  min={85}
                  max={125}
                  step={5}
                  value={Math.round(fontScale * 100)}
                  onChange={(e) => setFontScale(Number(e.target.value) / 100)}
                  className="w-24 accent-sky-400"
                />
              </div>
            </div>
          </section>

          {/* SECTION 3: Card Architecture & Button Shapes */}
          <section className="rounded-3xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sliders className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-sm font-semibold text-white">Card & Button Architecture</h2>
                <p className="text-[11px] text-zinc-400">Card surface textures and corner curvature</p>
              </div>
            </div>

            {/* Surface Styles */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {CARD_STYLES.map((c) => {
                const isActive = cardStyle === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCardStyle(c.id)}
                    className={cn(
                      "rounded-2xl border p-2.5 text-left transition-all hover:border-white/20",
                      isActive
                        ? "border-emerald-400/60 bg-emerald-500/10 ring-1 ring-emerald-400/40"
                        : "border-white/5 bg-black/30 hover:bg-white/[0.04]"
                    )}
                  >
                    <p className="text-xs font-semibold text-white truncate">{c.label}</p>
                    <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{c.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Corner Radius Shapes */}
            <div>
              <span className="mb-2 block text-xs text-zinc-400 font-medium">Button & Card Corner Shape</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {BUTTON_SHAPES.map((b) => {
                  const isActive = buttonShape === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setButtonShape(b.id)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border p-2.5 transition-all",
                        isActive
                          ? "border-emerald-400/60 bg-emerald-500/15 text-white ring-1 ring-emerald-400/30"
                          : "border-white/5 bg-black/30 text-zinc-400 hover:text-white"
                      )}
                    >
                      <span className="text-xs font-medium">{b.label}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{b.radius}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SECTION 4: Atmosphere & Background Effects */}
          <section className="rounded-3xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-sm font-semibold text-white">Atmosphere & Visual Effects</h2>
                <p className="text-[11px] text-zinc-400">Background lighting and interactive card hover animation</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Background Effects */}
              <div>
                <span className="mb-2 block text-xs text-zinc-400 font-medium">Background Lighting Effect</span>
                <div className="grid grid-cols-2 gap-2">
                  {BACKGROUND_EFFECTS.map((e) => {
                    const isActive = backgroundEffect === e.id;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setBackgroundEffect(e.id)}
                        className={cn(
                          "rounded-2xl border p-2.5 text-left transition-all",
                          isActive
                            ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-white ring-1 ring-fuchsia-400/30"
                            : "border-white/5 bg-black/30 text-zinc-400 hover:text-white"
                        )}
                      >
                        <p className="text-xs font-medium text-white truncate">{e.label}</p>
                        <p className="text-[10px] text-zinc-500 line-clamp-1">{e.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hover Animation */}
              <div>
                <span className="mb-2 block text-xs text-zinc-400 font-medium">Interactive Hover Motion</span>
                <div className="grid grid-cols-2 gap-2">
                  {HOVER_EFFECTS.map((h) => {
                    const isActive = hoverEffect === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setHoverEffect(h.id)}
                        className={cn(
                          "rounded-2xl border p-2.5 text-left transition-all",
                          isActive
                            ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-white ring-1 ring-fuchsia-400/30"
                            : "border-white/5 bg-black/30 text-zinc-400 hover:text-white"
                        )}
                      >
                        <p className="text-xs font-medium text-white truncate">{h.label}</p>
                        <p className="text-[10px] text-zinc-500 line-clamp-1">{h.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: Page Layout & Curated Themes */}
          <section className="rounded-3xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                <Wand2 className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-sm font-semibold text-white">Layout & 12 Curated Themes</h2>
                <p className="text-[11px] text-zinc-400">Pre-built full-page themes and list vs bento arrangement</p>
              </div>
            </div>

            {/* Layout Toggle */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "list", label: "Classic list", desc: "Simple vertical stack", icon: List },
                { id: "bento", label: "Bento grid", desc: "Pinterest-style spans", icon: LayoutGrid },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setLayout(opt.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all",
                    layout === opt.id
                      ? "border-violet-400/50 bg-violet-500/10 ring-glow"
                      : "border-white/10 bg-black/30 hover:border-white/20",
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

            {/* 12 Themes Grid */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 pt-2">
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
                    <div className="relative h-20 p-2" style={{ background: t.swatch[0] }}>
                      <div className="space-y-1">
                        <div className="h-1.5 w-3/4 rounded-full" style={{ background: t.swatch[1] }} />
                        <div className="h-1.5 w-full rounded-full" style={{ background: t.swatch[1] }} />
                        <div className="h-1.5 w-2/3 rounded-full" style={{ background: t.swatch[2] }} />
                      </div>
                      {active ? (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500">
                          <Check className="h-3 w-3 text-white" />
                        </span>
                      ) : null}
                    </div>
                    <div className="border-t border-white/5 bg-ink-900/80 p-2">
                      <p className="text-xs font-semibold text-white truncate">{t.name}</p>
                      <p className="line-clamp-1 text-[10px] text-zinc-500">{t.description}</p>
                    </div>
                  </button>
                );
              })}
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
