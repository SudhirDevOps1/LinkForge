"use client";

// =============================================================================
// 🎨 AppearanceEditor — World-class Figma-grade Bio Customization Studio
// Features:
// - 🌟 12 Ready-Made 1-Click Designer Presets (Cyberpunk, Velvet, Bento, Tokyo, etc.)
// - 🔤 15+ World-Class Google Fonts (Space Grotesk, Inter, Outfit, Syne, Poppins, Sora, etc.)
// - ✍️ Advanced Typography (Font Weight, Text Casing, Letter Spacing, Title Glow/Shadow, Scale)
// - 🎨 8 Color Presets + Custom Primary Accent & Canvas Background Pickers
// - 🌌 5 Background Atmosphere Effects (Ambient Aura, Cosmic Mesh, Cyber Dots, Northern Aurora, Flat)
// - 🃏 5 Card Surfaces (Glass, Solid, Neon, Neumorphic, Minimal)
// - 🔘 4 Corner Shapes (Sharp, Soft, Curved, Pill) + Custom Border Width, Blur & Shadow
// - ✨ Figma Micro-Interactions (Entrance Animations, Attention Shimmer, Card Hover, Avatar Shapes & Rings)
// - 🎭 12 Curated Themes + Classic List vs Bento Grid Toggle
// - 📱 Instant Real-Time Preview Sync with PhonePreview & Neon Postgres Persistence
// =============================================================================
import {
  Check,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  Palette,
  RotateCcw,
  Sliders,
  Smartphone,
  Sparkles,
  Type,
  Wand2,
  Zap,
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

// ---- 1-Click Designer Presets -----------------------------------------------
interface DesignerPreset {
  id: string;
  name: string;
  tagline: string;
  accent: string;
  background: string;
  fontFamily: string;
  fontStyle: string;
  fontWeight: string;
  textShadow: string;
  cardStyle: string;
  buttonShape: string;
  borderWidth: number;
  blurStrength: string;
  shadowStrength: string;
  backgroundEffect: string;
  hoverEffect: string;
  entranceAnimation: string;
  attentionEffect: string;
  avatarShape: string;
  avatarRing: boolean;
  theme: string;
}

const DESIGNER_PRESETS: DesignerPreset[] = [
  {
    id: "cyberpunk",
    name: "Cyberpunk 2077",
    tagline: "High-contrast neon pink & void matrix",
    accent: "#f43f5e",
    background: "#0a0414",
    fontFamily: "syne",
    fontStyle: "uppercase",
    fontWeight: "bold",
    textShadow: "neon",
    cardStyle: "neon",
    buttonShape: "sharp",
    borderWidth: 1,
    blurStrength: "none",
    shadowStrength: "glow",
    backgroundEffect: "dots",
    hoverEffect: "glow",
    entranceAnimation: "pop",
    attentionEffect: "pulse",
    avatarShape: "hexagon",
    avatarRing: true,
    theme: "cyberpunk",
  },
  {
    id: "tokyo-midnight",
    name: "Tokyo Midnight",
    tagline: "Electric cyan & northern aurora abyss",
    accent: "#06b6d4",
    background: "#020d18",
    fontFamily: "jetbrains",
    fontStyle: "normal",
    fontWeight: "medium",
    textShadow: "none",
    cardStyle: "glass",
    buttonShape: "curved",
    borderWidth: 1,
    blurStrength: "medium",
    shadowStrength: "floating",
    backgroundEffect: "aurora",
    hoverEffect: "scale",
    entranceAnimation: "slide",
    attentionEffect: "shimmer",
    avatarShape: "circle",
    avatarRing: true,
    theme: "midnight",
  },
  {
    id: "velvet-luxury",
    name: "Velvet Luxury",
    tagline: "Champagne amber & editorial serif",
    accent: "#f59e0b",
    background: "#0c0a06",
    fontFamily: "playfair",
    fontStyle: "capitalize",
    fontWeight: "semibold",
    textShadow: "subtle",
    cardStyle: "solid",
    buttonShape: "soft",
    borderWidth: 1,
    blurStrength: "none",
    shadowStrength: "floating",
    backgroundEffect: "glow",
    hoverEffect: "lift",
    entranceAnimation: "fade",
    attentionEffect: "none",
    avatarShape: "rounded",
    avatarRing: false,
    theme: "amber",
  },
  {
    id: "bento-monochrome",
    name: "Bento Minimal",
    tagline: "Pure monochrome slate & subtle wireframe",
    accent: "#e4e4e7",
    background: "#09090b",
    fontFamily: "inter",
    fontStyle: "normal",
    fontWeight: "medium",
    textShadow: "none",
    cardStyle: "minimal",
    buttonShape: "curved",
    borderWidth: 1,
    blurStrength: "none",
    shadowStrength: "none",
    backgroundEffect: "none",
    hoverEffect: "lift",
    entranceAnimation: "slide",
    attentionEffect: "none",
    avatarShape: "squircle",
    avatarRing: false,
    theme: "zinc",
  },
  {
    id: "sunset-mirage",
    name: "Sunset Mirage",
    tagline: "Warm coral glow & smooth curves",
    accent: "#f97316",
    background: "#140914",
    fontFamily: "outfit",
    fontStyle: "normal",
    fontWeight: "bold",
    textShadow: "subtle",
    cardStyle: "glass",
    buttonShape: "pill",
    borderWidth: 1,
    blurStrength: "medium",
    shadowStrength: "soft",
    backgroundEffect: "mesh",
    hoverEffect: "scale",
    entranceAnimation: "slide",
    attentionEffect: "shimmer",
    avatarShape: "circle",
    avatarRing: true,
    theme: "sunset",
  },
  {
    id: "emerald-forest",
    name: "Emerald Forest",
    tagline: "Luminous jade & deep pine glass",
    accent: "#10b981",
    background: "#02140d",
    fontFamily: "jakarta",
    fontStyle: "normal",
    fontWeight: "semibold",
    textShadow: "none",
    cardStyle: "glass",
    buttonShape: "soft",
    borderWidth: 1,
    blurStrength: "medium",
    shadowStrength: "soft",
    backgroundEffect: "mesh",
    hoverEffect: "lift",
    entranceAnimation: "fade",
    attentionEffect: "none",
    avatarShape: "squircle",
    avatarRing: true,
    theme: "emerald",
  },
  {
    id: "electric-lavender",
    name: "Electric Lavender",
    tagline: "Neon violet & tactile neumorphism",
    accent: "#8b5cf6",
    background: "#06020e",
    fontFamily: "space-grotesk",
    fontStyle: "normal",
    fontWeight: "bold",
    textShadow: "neon",
    cardStyle: "neumorphic",
    buttonShape: "pill",
    borderWidth: 1,
    blurStrength: "none",
    shadowStrength: "glow",
    backgroundEffect: "aurora",
    hoverEffect: "glow",
    entranceAnimation: "pop",
    attentionEffect: "pulse",
    avatarShape: "circle",
    avatarRing: true,
    theme: "violet",
  },
  {
    id: "acid-brutalism",
    name: "Acid Brutalism",
    tagline: "High-impact lime & bold brutalist grids",
    accent: "#84cc16",
    background: "#080808",
    fontFamily: "bricolage",
    fontStyle: "uppercase",
    fontWeight: "bold",
    textShadow: "outline",
    cardStyle: "solid",
    buttonShape: "sharp",
    borderWidth: 2,
    blurStrength: "none",
    shadowStrength: "floating",
    backgroundEffect: "dots",
    hoverEffect: "tilt",
    entranceAnimation: "pop",
    attentionEffect: "pulse",
    avatarShape: "hexagon",
    avatarRing: false,
    theme: "dark",
  },
  {
    id: "nordic-frost",
    name: "Nordic Frost",
    tagline: "Ice blue & crisp modern typography",
    accent: "#38bdf8",
    background: "#05101a",
    fontFamily: "sora",
    fontStyle: "normal",
    fontWeight: "medium",
    textShadow: "none",
    cardStyle: "glass",
    buttonShape: "curved",
    borderWidth: 1,
    blurStrength: "high",
    shadowStrength: "soft",
    backgroundEffect: "mesh",
    hoverEffect: "scale",
    entranceAnimation: "slide",
    attentionEffect: "none",
    avatarShape: "squircle",
    avatarRing: true,
    theme: "ocean",
  },
  {
    id: "warm-espresso",
    name: "Warm Espresso",
    tagline: "Rich bronze & warm vintage serif",
    accent: "#d97706",
    background: "#120e0b",
    fontFamily: "fraunces",
    fontStyle: "normal",
    fontWeight: "semibold",
    textShadow: "subtle",
    cardStyle: "solid",
    buttonShape: "soft",
    borderWidth: 1,
    blurStrength: "none",
    shadowStrength: "soft",
    backgroundEffect: "glow",
    hoverEffect: "lift",
    entranceAnimation: "fade",
    attentionEffect: "none",
    avatarShape: "rounded",
    avatarRing: false,
    theme: "amber",
  },
  {
    id: "cotton-candy",
    name: "Pastel Dream",
    tagline: "Soft rose & friendly rounded geometry",
    accent: "#f472b6",
    background: "#12081c",
    fontFamily: "poppins",
    fontStyle: "normal",
    fontWeight: "semibold",
    textShadow: "none",
    cardStyle: "glass",
    buttonShape: "pill",
    borderWidth: 1,
    blurStrength: "medium",
    shadowStrength: "soft",
    backgroundEffect: "glow",
    hoverEffect: "scale",
    entranceAnimation: "pop",
    attentionEffect: "shimmer",
    avatarShape: "circle",
    avatarRing: true,
    theme: "rose",
  },
  {
    id: "cinematic-noir",
    name: "Cinematic Noir",
    tagline: "Silver titanium & classical typography",
    accent: "#e2e8f0",
    background: "#000000",
    fontFamily: "cinzel",
    fontStyle: "uppercase",
    fontWeight: "bold",
    textShadow: "subtle",
    cardStyle: "minimal",
    buttonShape: "sharp",
    borderWidth: 1,
    blurStrength: "none",
    shadowStrength: "none",
    backgroundEffect: "none",
    hoverEffect: "lift",
    entranceAnimation: "fade",
    attentionEffect: "none",
    avatarShape: "hexagon",
    avatarRing: false,
    theme: "dark",
  },
];

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
  { id: "jakarta", name: "Plus Jakarta", sample: "Aa Modern Product", category: "Product" },
  { id: "syne", name: "Syne", sample: "Aa Bold Creator", category: "Artistic" },
  { id: "playfair", name: "Playfair Display", sample: "Aa Luxury Editorial", category: "Serif" },
  { id: "jetbrains", name: "JetBrains Mono", sample: "Aa Developer Code", category: "Monospace" },
  { id: "bricolage", name: "Bricolage", sample: "Aa Expressive Brutalist", category: "Display" },
  { id: "poppins", name: "Poppins", sample: "Aa Friendly Geometric", category: "Rounded" },
  { id: "sora", name: "Sora", sample: "Aa Futuristic Neo", category: "Modern" },
  { id: "cinzel", name: "Cinzel", sample: "Aa Classical Cinema", category: "Serif" },
  { id: "caveat", name: "Caveat", sample: "Aa Hand-crafted Script", category: "Handwriting" },
  { id: "fraunces", name: "Fraunces", sample: "Aa Warm Vintage", category: "Retro Serif" },
  { id: "urbanist", name: "Urbanist", sample: "Aa Clean Neo-Grotesque", category: "Sans-Serif" },
  { id: "montserrat", name: "Montserrat", sample: "Aa Bold Punchy Headline", category: "Display" },
];

const CARD_STYLES = [
  { id: "glass", label: "Glass Frosted", desc: "Frosted glass with backdrop blur" },
  { id: "solid", label: "Solid Contrast", desc: "Dark high-contrast opaque cards" },
  { id: "neon", label: "Neon Glow", desc: "Vibrant glowing border & aura" },
  { id: "neumorphic", label: "Neumorphic", desc: "Soft organic deep tactile shadows" },
  { id: "minimal", label: "Minimalist", desc: "Transparent borderless clean flat" },
];

const BUTTON_SHAPES = [
  { id: "sharp", label: "Sharp", radius: "0px", desc: "Boxy brutalist 0px" },
  { id: "soft", label: "Soft", radius: "12px", desc: "Modern rounded 12px" },
  { id: "curved", label: "Curved", radius: "18px", desc: "iOS curved 18px" },
  { id: "pill", label: "Full Pill", radius: "9999px", desc: "Circular pill 9999px" },
];

const BACKGROUND_EFFECTS = [
  { id: "glow", label: "Ambient Aura", desc: "Luminous radial glow behind avatar" },
  { id: "mesh", label: "Mesh Gradient", desc: "Floating atmospheric gradient blobs" },
  { id: "dots", label: "Cyber Dots", desc: "Subtle cybernetic matrix dot grid" },
  { id: "aurora", label: "Northern Aurora", desc: "Multi-color cosmic ethereal lights" },
  { id: "none", label: "Flat Minimal", desc: "Pure solid background tone" },
];

const HOVER_EFFECTS = [
  { id: "lift", label: "Smooth Lift", desc: "Subtle upward lift on hover" },
  { id: "scale", label: "Scale Pop", desc: "Enlarges card by 2.5%" },
  { id: "glow", label: "Glow Outline", desc: "Border glow ring highlight" },
  { id: "tilt", label: "Playful Tilt", desc: "Subtle dynamic card tilt" },
  { id: "none", label: "Static", desc: "No hover motion" },
];

type StudioTab = "presets" | "themes" | "typography" | "colors" | "cards" | "motion";

export function AppearanceEditor({
  profile: initialProfile,
  links,
}: {
  profile: BioProfileShape;
  links: Link[];
}) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<StudioTab>("presets");

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

  // Typography states
  const [fontFamily, setFontFamily] = useState(initialDesign.fontFamily ?? "space-grotesk");
  const [fontStyle, setFontStyle] = useState(initialDesign.fontStyle ?? "normal");
  const [fontWeight, setFontWeight] = useState(initialDesign.fontWeight ?? "bold");
  const [textShadow, setTextShadow] = useState(initialDesign.textShadow ?? "none");

  // Card architecture states
  const [cardStyle, setCardStyle] = useState(initialDesign.cardStyle ?? "glass");
  const [buttonShape, setButtonShape] = useState(initialDesign.buttonShape ?? "curved");
  const [borderWidth, setBorderWidth] = useState(initialDesign.borderWidth ?? 1);
  const [blurStrength, setBlurStrength] = useState(initialDesign.blurStrength ?? "medium");
  const [shadowStrength, setShadowStrength] = useState(initialDesign.shadowStrength ?? "soft");

  // Visual effects & animations
  const [backgroundEffect, setBackgroundEffect] = useState(initialDesign.backgroundEffect ?? "glow");
  const [hoverEffect, setHoverEffect] = useState(initialDesign.hoverEffect ?? "lift");
  const [entranceAnimation, setEntranceAnimation] = useState(initialDesign.entranceAnimation ?? "fade");
  const [attentionEffect, setAttentionEffect] = useState(initialDesign.attentionEffect ?? "none");

  // Avatar framing
  const [avatarShape, setAvatarShape] = useState(initialDesign.avatarShape ?? "circle");
  const [avatarRing, setAvatarRing] = useState(initialDesign.avatarRing ?? false);

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
    fontWeight !== (initialDesign.fontWeight ?? "bold") ||
    textShadow !== (initialDesign.textShadow ?? "none") ||
    cardStyle !== (initialDesign.cardStyle ?? "glass") ||
    buttonShape !== (initialDesign.buttonShape ?? "curved") ||
    borderWidth !== (initialDesign.borderWidth ?? 1) ||
    blurStrength !== (initialDesign.blurStrength ?? "medium") ||
    shadowStrength !== (initialDesign.shadowStrength ?? "soft") ||
    backgroundEffect !== (initialDesign.backgroundEffect ?? "glow") ||
    hoverEffect !== (initialDesign.hoverEffect ?? "lift") ||
    entranceAnimation !== (initialDesign.entranceAnimation ?? "fade") ||
    attentionEffect !== (initialDesign.attentionEffect ?? "none") ||
    avatarShape !== (initialDesign.avatarShape ?? "circle") ||
    avatarRing !== (initialDesign.avatarRing ?? false);

  const dirty = themeDirty || designDirty;

  // Real-time live preview shape
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
      fontWeight,
      textShadow,
      cardStyle,
      buttonShape,
      borderWidth,
      blurStrength,
      shadowStrength,
      backgroundEffect,
      hoverEffect,
      entranceAnimation,
      attentionEffect,
      avatarShape,
      avatarRing,
    },
  };

  function applyPreset(p: DesignerPreset) {
    setTheme(p.theme);
    setAccent(p.accent);
    setBackground(p.background);
    setFontFamily(p.fontFamily);
    setFontStyle(p.fontStyle);
    setFontWeight(p.fontWeight);
    setTextShadow(p.textShadow);
    setCardStyle(p.cardStyle);
    setButtonShape(p.buttonShape);
    setBorderWidth(p.borderWidth);
    setBlurStrength(p.blurStrength);
    setShadowStrength(p.shadowStrength);
    setBackgroundEffect(p.backgroundEffect);
    setHoverEffect(p.hoverEffect);
    setEntranceAnimation(p.entranceAnimation);
    setAttentionEffect(p.attentionEffect);
    setAvatarShape(p.avatarShape);
    setAvatarRing(p.avatarRing);
    toast.success(`Applied "${p.name}" preset! Look at the preview.`);
  }

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
            accent: accent || undefined,
            background: background || undefined,
            radiusPx,
            fontScale,
            iconSize,
            fontFamily,
            fontStyle,
            fontWeight,
            textShadow,
            cardStyle,
            buttonShape,
            borderWidth,
            blurStrength,
            shadowStrength,
            backgroundEffect,
            hoverEffect,
            entranceAnimation,
            attentionEffect,
            avatarShape,
            avatarRing,
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
    setFontWeight("bold");
    setTextShadow("none");
    setCardStyle("glass");
    setButtonShape("curved");
    setBorderWidth(1);
    setBlurStrength("medium");
    setShadowStrength("soft");
    setBackgroundEffect("glow");
    setHoverEffect("lift");
    setEntranceAnimation("fade");
    setAttentionEffect("none");
    setAvatarShape("circle");
    setAvatarRing(false);
    toast.info("Reset to default styling.");
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Save Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            Appearance & Brand Studio
            {dirty && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Unsaved changes
              </span>
            )}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Figma-grade styling studio: 1-click presets, 15+ Google fonts, atmosphere effects, and real-time live preview.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Mobile view toggle (only on screens < xl) */}
          <div className="xl:hidden flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("editor")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                viewMode === "editor" ? "bg-violet-600 text-white shadow-sm" : "text-zinc-400 hover:text-white",
              )}
            >
              <Sliders className="w-3.5 h-3.5" />
              Editor
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                viewMode === "preview" ? "bg-violet-600 text-white shadow-sm" : "text-zinc-400 hover:text-white",
              )}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Live Preview
            </button>
          </div>

          <button
            type="button"
            onClick={resetToDefaults}
            className="px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 border border-white/10 hover:border-white/20 rounded-xl transition-all flex items-center gap-1.5"
            title="Reset styling overrides"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className={cn(
              "flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl transition-all shadow-md",
              dirty
                ? "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/25 ring-1 ring-violet-400"
                : "bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5",
            )}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Editor controls on Left, Live Phone on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Studio Tabs & Panels */}
        <div className={cn("space-y-6 xl:col-span-7", viewMode === "preview" ? "hidden xl:block" : "block")}>
          {/* Segmented Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md">
            {[
              { id: "presets" as const, label: "1-Click Presets", icon: Wand2 },
              { id: "typography" as const, label: "Typography & Fonts", icon: Type },
              { id: "colors" as const, label: "Colors & Atmosphere", icon: Palette },
              { id: "cards" as const, label: "Cards & Surfaces", icon: Layers },
              { id: "motion" as const, label: "Figma Motion & Avatars", icon: Zap },
              { id: "themes" as const, label: "Themes & Bento", icon: LayoutGrid },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all",
                    isActive
                      ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: 1-Click Designer Presets */}
          {activeTab === "presets" && (
            <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/40 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-violet-400" />
                  Curated Designer Presets
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  1-click aesthetic templates inspired by Bento.me, Figma, and modern creator brands. Applies typography, colors, animations, and card styles instantly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {DESIGNER_PRESETS.map((p) => {
                  const isCurrent =
                    accent.toLowerCase() === p.accent.toLowerCase() &&
                    fontFamily === p.fontFamily &&
                    cardStyle === p.cardStyle;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className={cn(
                        "group relative text-left p-4 rounded-xl border transition-all hover:-translate-y-0.5 flex flex-col justify-between",
                        isCurrent
                          ? "border-violet-400/80 bg-violet-500/10 ring-1 ring-violet-400/40"
                          : "border-white/10 hover:border-white/20 bg-zinc-900/60 hover:bg-zinc-800/40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm shrink-0"
                              style={{ backgroundColor: p.accent }}
                            />
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-white">
                              {p.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{p.tagline}</p>
                        </div>
                        {isCurrent && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                        <span className="font-mono uppercase">{p.fontFamily}</span>
                        <span className="capitalize">{p.cardStyle} · {p.buttonShape}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Typography Studio (15+ Google Fonts) */}
          {activeTab === "typography" && (
            <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/40 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <Type className="w-4 h-4 text-violet-400" />
                  Typography & Font Family Studio
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  15+ real Google Fonts loaded live. Customize title weight, casing, letter spacing, and glow effects.
                </p>
              </div>

              {/* Font Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {FONT_OPTIONS.map((f) => {
                  const isSelected = fontFamily === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFontFamily(f.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all relative overflow-hidden group",
                        isSelected
                          ? "border-violet-400 bg-violet-500/15 ring-1 ring-violet-400/50"
                          : "border-white/10 hover:border-white/20 bg-zinc-900/50 hover:bg-zinc-800/50",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">{f.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">{f.category}</span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-300 font-medium truncate">{f.sample}</p>
                    </button>
                  );
                })}
              </div>

              {/* Font Controls: Weight, Casing, Letter Spacing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                {/* Font Weight */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Font Weight</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "normal", label: "Normal 400" },
                      { id: "medium", label: "Medium 500" },
                      { id: "semibold", label: "Semi 600" },
                      { id: "bold", label: "Bold 700" },
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setFontWeight(w.id)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg border text-[11px] font-medium text-center transition-all",
                          fontWeight === w.id
                            ? "border-violet-400 bg-violet-500/20 text-white"
                            : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                        )}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Casing */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Text Casing</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "normal", label: "Standard" },
                      { id: "uppercase", label: "UPPERCASE" },
                      { id: "capitalize", label: "Capitalize" },
                      { id: "lowercase", label: "lowercase" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setFontStyle(s.id)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg border text-[11px] font-medium text-center transition-all",
                          fontStyle === s.id
                            ? "border-violet-400 bg-violet-500/20 text-white"
                            : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title Glow / Shadow */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Title Glow / Shadow</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "none", label: "None" },
                      { id: "subtle", label: "Subtle Soft" },
                      { id: "neon", label: "Neon Glow" },
                      { id: "outline", label: "Outlined" },
                    ].map((sh) => (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => setTextShadow(sh.id)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg border text-[11px] font-medium text-center transition-all",
                          textShadow === sh.id
                            ? "border-violet-400 bg-violet-500/20 text-white"
                            : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                        )}
                      >
                        {sh.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Title Font Scale Slider */}
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-zinc-300">Title Scale Factor</span>
                  <span className="font-mono text-violet-400">{Math.round(fontScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={DESIGN_LIMITS.fontScale.min}
                  max={DESIGN_LIMITS.fontScale.max}
                  step={0.05}
                  value={fontScale}
                  onChange={(e) => setFontScale(Number.parseFloat(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </div>
            </div>
          )}

          {/* TAB 3: Colors & Atmosphere */}
          {activeTab === "colors" && (
            <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/40 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-violet-400" />
                  Colors & Atmosphere Effects
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Brand color presets, custom accent pickers, and dynamic atmospheric canvas backdrops.
                </p>
              </div>

              {/* Color Presets */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-zinc-300">Curated Color Presets</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {COLOR_PRESETS.map((p) => {
                    const isSelected =
                      accent.toLowerCase() === p.primary.toLowerCase() &&
                      background.toLowerCase() === p.background.toLowerCase();
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setAccent(p.primary);
                          setBackground(p.background);
                        }}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all hover:-translate-y-0.5",
                          isSelected
                            ? "border-violet-400 bg-violet-500/15 ring-1 ring-violet-400"
                            : "border-white/10 hover:border-white/20 bg-zinc-900/60",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full border border-white/20 shadow-sm shrink-0"
                            style={{ backgroundColor: p.primary }}
                          />
                          <span className="text-[11px] font-semibold text-zinc-300 truncate">{p.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Primary Accent Color</label>
                  <div className="flex items-center gap-2.5 p-2 rounded-xl border border-white/10 bg-zinc-900/60">
                    <input
                      type="color"
                      value={accent || "#8b5cf6"}
                      onChange={(e) => setAccent(e.target.value)}
                      className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={accent}
                      placeholder="#8b5cf6"
                      onChange={(e) => setAccent(e.target.value)}
                      className="flex-1 bg-transparent text-xs font-mono text-zinc-200 outline-none uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Background Canvas Color</label>
                  <div className="flex items-center gap-2.5 p-2 rounded-xl border border-white/10 bg-zinc-900/60">
                    <input
                      type="color"
                      value={background || "#050508"}
                      onChange={(e) => setBackground(e.target.value)}
                      className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={background}
                      placeholder="#050508"
                      onChange={(e) => setBackground(e.target.value)}
                      className="flex-1 bg-transparent text-xs font-mono text-zinc-200 outline-none uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Atmosphere Background Effects */}
              <div className="pt-4 border-t border-white/5 space-y-2.5">
                <label className="text-xs font-semibold text-zinc-300 block">Canvas Atmosphere Effect</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {BACKGROUND_EFFECTS.map((eff) => (
                    <button
                      key={eff.id}
                      type="button"
                      onClick={() => setBackgroundEffect(eff.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        backgroundEffect === eff.id
                          ? "border-violet-400 bg-violet-500/15 ring-1 ring-violet-400"
                          : "border-white/10 hover:border-white/20 bg-zinc-900/60",
                      )}
                    >
                      <p className="text-xs font-semibold text-zinc-200">{eff.label}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{eff.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Cards & Surfaces */}
          {activeTab === "cards" && (
            <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/40 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-400" />
                  Card Architecture & Surfaces
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Card materials, corner geometry, border thickness, backdrop blur, and depth elevation.
                </p>
              </div>

              {/* Card Surface Styles */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-zinc-300">Surface Material</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {CARD_STYLES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCardStyle(c.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        cardStyle === c.id
                          ? "border-violet-400 bg-violet-500/15 ring-1 ring-violet-400"
                          : "border-white/10 hover:border-white/20 bg-zinc-900/60",
                      )}
                    >
                      <p className="text-xs font-semibold text-zinc-200">{c.label}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Button Corner Shapes */}
              <div className="pt-4 border-t border-white/5 space-y-2.5">
                <label className="text-xs font-semibold text-zinc-300">Corner Radius Shape</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {BUTTON_SHAPES.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setButtonShape(b.id);
                        setRadiusPx(undefined);
                      }}
                      className={cn(
                        "p-3 rounded-xl border text-center transition-all",
                        buttonShape === b.id
                          ? "border-violet-400 bg-violet-500/15 ring-1 ring-violet-400"
                          : "border-white/10 hover:border-white/20 bg-zinc-900/60",
                      )}
                    >
                      <div
                        className="w-full h-7 border border-violet-400/40 bg-violet-500/10 mb-2 flex items-center justify-center text-[10px] font-mono text-violet-300"
                        style={{ borderRadius: b.radius }}
                      >
                        {b.radius}
                      </div>
                      <p className="text-xs font-semibold text-zinc-200">{b.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Width, Backdrop Blur, Shadow Depth */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                {/* Border Width */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Border Width</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { val: 0, label: "0px" },
                      { val: 1, label: "1px" },
                      { val: 2, label: "2px" },
                      { val: 3, label: "3px" },
                    ].map((bw) => (
                      <button
                        key={bw.val}
                        type="button"
                        onClick={() => setBorderWidth(bw.val)}
                        className={cn(
                          "py-1.5 rounded-lg border text-[11px] font-semibold text-center transition-all",
                          borderWidth === bw.val
                            ? "border-violet-400 bg-violet-500/20 text-white"
                            : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                        )}
                      >
                        {bw.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Backdrop Blur */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Backdrop Blur</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: "none", label: "None" },
                      { id: "low", label: "8px" },
                      { id: "medium", label: "16px" },
                      { id: "high", label: "24px" },
                    ].map((bl) => (
                      <button
                        key={bl.id}
                        type="button"
                        onClick={() => setBlurStrength(bl.id)}
                        className={cn(
                          "py-1.5 rounded-lg border text-[11px] font-semibold text-center transition-all",
                          blurStrength === bl.id
                            ? "border-violet-400 bg-violet-500/20 text-white"
                            : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                        )}
                      >
                        {bl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shadow Strength */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Shadow Depth</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "none", label: "Flat" },
                      { id: "soft", label: "Soft" },
                      { id: "floating", label: "Floating 3D" },
                      { id: "glow", label: "Neon Glow" },
                    ].map((sh) => (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => setShadowStrength(sh.id)}
                        className={cn(
                          "py-1.5 rounded-lg border text-[11px] font-semibold text-center transition-all",
                          shadowStrength === sh.id
                            ? "border-violet-400 bg-violet-500/20 text-white"
                            : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                        )}
                      >
                        {sh.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Figma Motion & Avatars */}
          {activeTab === "motion" && (
            <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/40 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-violet-400" />
                  Figma Motion, Micro-Interactions & Avatars
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Card hover effects, entrance animations, attention grabbers, and avatar framing.
                </p>
              </div>

              {/* Hover Effects */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-zinc-300">Card Hover Interaction</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {HOVER_EFFECTS.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setHoverEffect(h.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        hoverEffect === h.id
                          ? "border-violet-400 bg-violet-500/15 ring-1 ring-violet-400"
                          : "border-white/10 hover:border-white/20 bg-zinc-900/60",
                      )}
                    >
                      <p className="text-xs font-semibold text-zinc-200">{h.label}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{h.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Entrance & Attention Animations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Card Entrance Cascade</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "fade", label: "Smooth Fade" },
                      { id: "slide", label: "Slide Up Stagger" },
                      { id: "pop", label: "Bouncy Pop-in" },
                      { id: "none", label: "Instant Flat" },
                    ].map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setEntranceAnimation(e.id)}
                        className={cn(
                          "px-3 py-2 rounded-xl border text-xs font-semibold text-center transition-all",
                          entranceAnimation === e.id
                            ? "border-violet-400 bg-violet-500/20 text-white"
                            : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                        )}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Attention / Featured Shimmer</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "none", label: "None" },
                      { id: "pulse", label: "Pulse" },
                      { id: "shimmer", label: "Shimmer" },
                    ].map((att) => (
                      <button
                        key={att.id}
                        type="button"
                        onClick={() => setAttentionEffect(att.id)}
                        className={cn(
                          "px-3 py-2 rounded-xl border text-xs font-semibold text-center transition-all",
                          attentionEffect === att.id
                            ? "border-violet-400 bg-violet-500/20 text-white"
                            : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                        )}
                      >
                        {att.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Avatar Framing & Animated Aura Ring */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <label className="text-xs font-semibold text-zinc-300 block">Avatar Framing & Halo Ring</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "circle", label: "Circle" },
                    { id: "squircle", label: "Squircle" },
                    { id: "rounded", label: "Rounded 2xl" },
                    { id: "hexagon", label: "Hexagon" },
                  ].map((sh) => (
                    <button
                      key={sh.id}
                      type="button"
                      onClick={() => setAvatarShape(sh.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-center text-xs font-semibold transition-all",
                        avatarShape === sh.id
                          ? "border-violet-400 bg-violet-500/20 text-white"
                          : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                      )}
                    >
                      {sh.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-zinc-900/60">
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">Animated Gradient Aura Ring</p>
                    <p className="text-[11px] text-zinc-400">Adds an active spinning multi-color gradient halo behind avatar</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAvatarRing(!avatarRing)}
                    className={cn(
                      "w-11 h-6 rounded-full transition-colors relative",
                      avatarRing ? "bg-violet-600" : "bg-zinc-800",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                        avatarRing ? "left-6" : "left-1",
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Curated Themes & Bento Layout */}
          {activeTab === "themes" && (
            <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/40 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-violet-400" />
                  Curated Themes & Grid Layout
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  12 master curated themes and layout architecture (Classic vertical list vs Modern Bento Grid).
                </p>
              </div>

              {/* Layout Switcher */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLayout("list")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-xs transition-all",
                    layout === "list"
                      ? "border-violet-400 bg-violet-500/20 text-white ring-1 ring-violet-400"
                      : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                  )}
                >
                  <List className="w-4 h-4" />
                  Classic List Layout
                </button>
                <button
                  type="button"
                  onClick={() => setLayout("bento")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-xs transition-all",
                    layout === "bento"
                      ? "border-violet-400 bg-violet-500/20 text-white ring-1 ring-violet-400"
                      : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Modern Bento Grid
                </button>
              </div>

              {/* Curated Themes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/5">
                {THEMES.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        "group p-3 rounded-xl border text-left transition-all hover:-translate-y-0.5",
                        isSelected
                          ? "border-violet-400 bg-violet-500/20 ring-1 ring-violet-400"
                          : "border-white/10 hover:border-white/20 bg-zinc-900/60",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                          style={{ backgroundColor: t.vars.accent }}
                        />
                        <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">{t.name}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{t.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Phone Preview Frame (Sticky on Desktop) */}
        <div
          className={cn(
            "xl:col-span-5 xl:sticky xl:top-6 flex flex-col items-center",
            viewMode === "editor" ? "hidden xl:flex" : "flex",
          )}
        >
          <div className="w-full flex items-center justify-between px-2 mb-3">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-violet-400" />
              Live Phone Preview
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">Real-time sync</span>
          </div>

          <div className="w-full flex justify-center">
            <PhonePreview profile={previewProfile} links={links} />
          </div>
        </div>
      </div>
    </div>
  );
}
