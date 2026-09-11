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
  Columns,
  Globe,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  Maximize2,
  Palette,
  PanelRight,
  RotateCcw,
  Search,
  Share2,
  Sliders,
  Smartphone,
  Sparkles,
  Square,
  Type,
  UserPlus,
  Volume2,
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
  { id: "glow", label: "Ambient Aura", category: "classic", desc: "Luminous radial glow behind avatar" },
  { id: "mesh", label: "Cosmic Mesh", category: "modern", desc: "Floating atmospheric gradient blobs" },
  { id: "dots", label: "Cyber Dots", category: "tech", desc: "Subtle cybernetic matrix dot grid" },
  { id: "aurora", label: "Northern Aurora", category: "cosmic", desc: "Multi-color cosmic ethereal lights" },
  { id: "matrix", label: "Digital Rain", category: "tech", desc: "Cyber terminal neon code matrix" },
  { id: "synthwave", label: "80s Synthwave", category: "retro", desc: "Retro neon horizon perspective grid" },
  { id: "constellation", label: "Constellations", category: "cosmic", desc: "Deep space glowing star clusters" },
  { id: "bokeh", label: "Bio Bokeh", category: "cosmic", desc: "Floating soft luminous orbs" },
  { id: "waves", label: "Oceanic Waves", category: "modern", desc: "Minimalist undulating contour curves" },
  { id: "circuit", label: "Cyber Circuit", category: "tech", desc: "High-tech PCB traces & board lines" },
  { id: "carbon", label: "Carbon Fiber", category: "texture", desc: "Textured 3D diagonal woven weave" },
  { id: "isometric", label: "Isometric Cube", category: "tech", desc: "3D architectural isometric grid" },
  { id: "particles", label: "Cosmic Stardust", category: "cosmic", desc: "Drifting stellar particles & dust" },
  { id: "honeycomb", label: "Hex Honeycomb", category: "tech", desc: "Futuristic geometric hex matrix" },
  { id: "stripes", label: "Velocity Warp", category: "modern", desc: "Dynamic angled speed stripes" },
  { id: "topography", label: "Topographic Map", category: "texture", desc: "Luxury elevation contour curves" },
  { id: "scanlines", label: "CRT Scanlines", category: "retro", desc: "Vintage cathode-ray monitor glow" },
  { id: "sunset", label: "Cyber Sunset", category: "retro", desc: "Warm dusk horizon with neon glow" },
  { id: "spotlight", label: "Studio Spotlight", category: "modern", desc: "Cinematic angled stage spotlights" },
  { id: "nebula", label: "Deep Nebula", category: "cosmic", desc: "Interstellar violet & cyan gas cloud" },
  { id: "noise", label: "Analog Film Grain", category: "texture", desc: "Frosted luxury velvet texture" },
  { id: "none", label: "Flat Minimal", category: "classic", desc: "Pure solid background tone" },
];

const HOVER_EFFECTS = [
  { id: "lift", label: "Smooth Lift", desc: "Subtle upward lift on hover" },
  { id: "scale", label: "Scale Pop", desc: "Enlarges card by 2.5%" },
  { id: "glow", label: "Glow Outline", desc: "Border glow ring highlight" },
  { id: "tilt", label: "Playful Tilt", desc: "Subtle dynamic card tilt" },
  { id: "none", label: "Static", desc: "No hover motion" },
];

type StudioTab = "presets" | "themes" | "typography" | "colors" | "cards" | "motion" | "advanced";

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
  const [effectCategory, setEffectCategory] = useState<string>("all");
  const [hoverEffect, setHoverEffect] = useState(initialDesign.hoverEffect ?? "lift");
  const [entranceAnimation, setEntranceAnimation] = useState(initialDesign.entranceAnimation ?? "fade");
  const [attentionEffect, setAttentionEffect] = useState(initialDesign.attentionEffect ?? "none");

  // Avatar framing
  const [avatarShape, setAvatarShape] = useState(initialDesign.avatarShape ?? "circle");
  const [avatarRing, setAvatarRing] = useState(initialDesign.avatarRing ?? false);

  // Advanced typography
  const [customFontName, setCustomFontName] = useState(initialDesign.customFontName ?? "");
  const [letterSpacing, setLetterSpacing] = useState(initialDesign.letterSpacing ?? 0);
  const [lineHeight, setLineHeight] = useState(initialDesign.lineHeight ?? 1.5);

  // Per-element colors
  const [nameColor, setNameColor] = useState(initialDesign.nameColor ?? "");
  const [bioColor, setBioColor] = useState(initialDesign.bioColor ?? "");
  const [linkTextColor, setLinkTextColor] = useState(initialDesign.linkTextColor ?? "");
  const [linkIconColor, setLinkIconColor] = useState(initialDesign.linkIconColor ?? "");
  const [linkBorderColor, setLinkBorderColor] = useState(initialDesign.linkBorderColor ?? "");
  const [cardTintColor, setCardTintColor] = useState(initialDesign.cardTintColor ?? "");
  const [borderColor, setBorderColor] = useState(initialDesign.borderColor ?? "");

  // Advanced card
  const [cardOpacity, setCardOpacity] = useState(initialDesign.cardOpacity ?? 1.0);
  const [cardPadding, setCardPadding] = useState(initialDesign.cardPadding ?? "default");
  const [iconBgStyle, setIconBgStyle] = useState(initialDesign.iconBgStyle ?? "transparent");

  // Advanced motion
  const [transitionSpeed, setTransitionSpeed] = useState(initialDesign.transitionSpeed ?? "normal");
  const [hoverDuration, setHoverDuration] = useState(initialDesign.hoverDuration ?? 200);
  const [staggerDelay, setStaggerDelay] = useState(initialDesign.staggerDelay ?? 45);
  const [hoverEasing, setHoverEasing] = useState(initialDesign.hoverEasing ?? "ease");
  const [scrollReveal, setScrollReveal] = useState(initialDesign.scrollReveal ?? false);
  const [cursorEffect, setCursorEffect] = useState(initialDesign.cursorEffect ?? "none");
  const [cardHover3D, setCardHover3D] = useState(initialDesign.cardHover3D ?? false);

  // Avatar Aura & Halo
  const [avatarAuraStyle, setAvatarAuraStyle] = useState(
    initialDesign.avatarAuraStyle ?? (initialDesign.avatarRing ? "spin" : "none")
  );
  const [avatarAuraColor, setAvatarAuraColor] = useState(initialDesign.avatarAuraColor ?? "");
  const [avatarAuraSpeed, setAvatarAuraSpeed] = useState(initialDesign.avatarAuraSpeed ?? "normal");
  const [avatarAuraBlur, setAvatarAuraBlur] = useState(initialDesign.avatarAuraBlur ?? "subtle");

  // Display Name Animation & Gradients
  const [nameAnimation, setNameAnimation] = useState(initialDesign.nameAnimation ?? "none");
  const [nameGradient, setNameGradient] = useState(initialDesign.nameGradient ?? "");

  // Advanced code
  const [customCss, setCustomCss] = useState(initialDesign.customCss ?? "");
  const [extraBodyClass, setExtraBodyClass] = useState(initialDesign.extraBodyClass ?? "");
  const [cssExportCopied, setCssExportCopied] = useState(false);
  const [showAdvancedColors, setShowAdvancedColors] = useState(false);
  const [gradientMode, setGradientMode] = useState<"solid" | "linear" | "radial">("solid");
  const [gradientAngle, setGradientAngle] = useState(135);
  const [gradientStop1, setGradientStop1] = useState("#8b5cf6");
  const [gradientStop2, setGradientStop2] = useState("#06b6d4");

  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"editor" | "preview">("editor");

  // 📱 Live Preview Docking & Alignment Mode
  const [dockMode, setDockMode] = useState<"right" | "center" | "pip">("right");

  // 🌐 Elite Public Bio Website Features
  const [statusBadge, setStatusBadge] = useState(initialDesign.statusBadge ?? "");
  const [showSearch, setShowSearch] = useState(initialDesign.showSearch ?? true);
  const [showCategories, setShowCategories] = useState(initialDesign.showCategories ?? true);
  const [showFloatingBar, setShowFloatingBar] = useState(initialDesign.showFloatingBar ?? true);
  const [showSaveContact, setShowSaveContact] = useState(initialDesign.showSaveContact ?? true);
  const [audioFeedback, setAudioFeedback] = useState(initialDesign.audioFeedback ?? false);

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
    avatarRing !== (initialDesign.avatarRing ?? false) ||
    customFontName !== (initialDesign.customFontName ?? "") ||
    letterSpacing !== (initialDesign.letterSpacing ?? 0) ||
    lineHeight !== (initialDesign.lineHeight ?? 1.5) ||
    nameColor !== (initialDesign.nameColor ?? "") ||
    bioColor !== (initialDesign.bioColor ?? "") ||
    linkTextColor !== (initialDesign.linkTextColor ?? "") ||
    linkIconColor !== (initialDesign.linkIconColor ?? "") ||
    linkBorderColor !== (initialDesign.linkBorderColor ?? "") ||
    cardTintColor !== (initialDesign.cardTintColor ?? "") ||
    borderColor !== (initialDesign.borderColor ?? "") ||
    cardOpacity !== (initialDesign.cardOpacity ?? 1.0) ||
    cardPadding !== (initialDesign.cardPadding ?? "default") ||
    iconBgStyle !== (initialDesign.iconBgStyle ?? "transparent") ||
    transitionSpeed !== (initialDesign.transitionSpeed ?? "normal") ||
    hoverDuration !== (initialDesign.hoverDuration ?? 200) ||
    staggerDelay !== (initialDesign.staggerDelay ?? 45) ||
    hoverEasing !== (initialDesign.hoverEasing ?? "ease") ||
    scrollReveal !== (initialDesign.scrollReveal ?? false) ||
    cursorEffect !== (initialDesign.cursorEffect ?? "none") ||
    cardHover3D !== (initialDesign.cardHover3D ?? false) ||
    avatarAuraStyle !== (initialDesign.avatarAuraStyle ?? (initialDesign.avatarRing ? "spin" : "none")) ||
    avatarAuraColor !== (initialDesign.avatarAuraColor ?? "") ||
    avatarAuraSpeed !== (initialDesign.avatarAuraSpeed ?? "normal") ||
    avatarAuraBlur !== (initialDesign.avatarAuraBlur ?? "subtle") ||
    nameAnimation !== (initialDesign.nameAnimation ?? "none") ||
    nameGradient !== (initialDesign.nameGradient ?? "") ||
    statusBadge !== (initialDesign.statusBadge ?? "") ||
    showSearch !== (initialDesign.showSearch ?? true) ||
    showCategories !== (initialDesign.showCategories ?? true) ||
    showFloatingBar !== (initialDesign.showFloatingBar ?? true) ||
    showSaveContact !== (initialDesign.showSaveContact ?? true) ||
    audioFeedback !== (initialDesign.audioFeedback ?? false) ||
    customCss !== (initialDesign.customCss ?? "") ||
    extraBodyClass !== (initialDesign.extraBodyClass ?? "");

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
      avatarRing: avatarAuraStyle !== "none",
      avatarAuraStyle: avatarAuraStyle !== "none" ? avatarAuraStyle : undefined,
      avatarAuraColor: avatarAuraColor || undefined,
      avatarAuraSpeed: avatarAuraSpeed !== "normal" ? avatarAuraSpeed : undefined,
      avatarAuraBlur: avatarAuraBlur !== "subtle" ? avatarAuraBlur : undefined,
      nameAnimation: nameAnimation !== "none" ? nameAnimation : undefined,
      nameGradient: nameGradient || undefined,
      statusBadge: statusBadge || undefined,
      showSearch,
      showCategories,
      showFloatingBar,
      showSaveContact,
      audioFeedback,
      customFontName: customFontName || undefined,
      letterSpacing: letterSpacing !== 0 ? letterSpacing : undefined,
      lineHeight: lineHeight !== 1.5 ? lineHeight : undefined,
      nameColor: nameColor || undefined,
      bioColor: bioColor || undefined,
      linkTextColor: linkTextColor || undefined,
      linkIconColor: linkIconColor || undefined,
      linkBorderColor: linkBorderColor || undefined,
      cardTintColor: cardTintColor || undefined,
      borderColor: borderColor || undefined,
      cardOpacity: cardOpacity !== 1.0 ? cardOpacity : undefined,
      cardPadding: cardPadding !== "default" ? cardPadding : undefined,
      iconBgStyle: iconBgStyle !== "transparent" ? iconBgStyle : undefined,
      transitionSpeed: transitionSpeed !== "normal" ? transitionSpeed : undefined,
      hoverDuration,
      staggerDelay,
      hoverEasing: hoverEasing !== "ease" ? hoverEasing : undefined,
      scrollReveal: scrollReveal || undefined,
      cursorEffect: cursorEffect !== "none" ? cursorEffect : undefined,
      cardHover3D: cardHover3D || undefined,
      customCss: customCss || undefined,
      extraBodyClass: extraBodyClass || undefined,
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
    setCustomFontName("");
    setLetterSpacing(0);
    setLineHeight(1.5);
    setTransitionSpeed("normal");
    setHoverEasing("ease");
    setNameColor("");
    setBioColor("");
    setLinkTextColor("");
    setLinkIconColor("");
    setLinkBorderColor("");
    setCardTintColor("");
    setBorderColor("");
    setCardOpacity(1.0);
    setCardPadding("default");
    setIconBgStyle("transparent");
    setCursorEffect("none");
    setCardHover3D(false);
    setAvatarAuraStyle(p.avatarRing ? "spin" : "none");
    setAvatarAuraColor("");
    setAvatarAuraSpeed("normal");
    setAvatarAuraBlur("subtle");
    setNameAnimation("none");
    setNameGradient("");
    setStatusBadge("");
    setShowSearch(true);
    setShowCategories(true);
    setShowFloatingBar(true);
    setShowSaveContact(true);
    setAudioFeedback(false);
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
            avatarRing: avatarAuraStyle !== "none",
            avatarAuraStyle: avatarAuraStyle !== "none" ? avatarAuraStyle : undefined,
            avatarAuraColor: avatarAuraColor || undefined,
            avatarAuraSpeed: avatarAuraSpeed !== "normal" ? avatarAuraSpeed : undefined,
            avatarAuraBlur: avatarAuraBlur !== "subtle" ? avatarAuraBlur : undefined,
            nameAnimation: nameAnimation !== "none" ? nameAnimation : undefined,
            nameGradient: nameGradient || undefined,
            statusBadge: statusBadge || undefined,
            showSearch,
            showCategories,
            showFloatingBar,
            showSaveContact,
            audioFeedback,
            customFontName: customFontName || undefined,
            letterSpacing: letterSpacing !== 0 ? letterSpacing : undefined,
            lineHeight: lineHeight !== 1.5 ? lineHeight : undefined,
            nameColor: nameColor || undefined,
            bioColor: bioColor || undefined,
            linkTextColor: linkTextColor || undefined,
            linkIconColor: linkIconColor || undefined,
            linkBorderColor: linkBorderColor || undefined,
            cardTintColor: cardTintColor || undefined,
            borderColor: borderColor || undefined,
            cardOpacity: cardOpacity !== 1.0 ? cardOpacity : undefined,
            cardPadding: cardPadding !== "default" ? cardPadding : undefined,
            iconBgStyle: iconBgStyle !== "transparent" ? iconBgStyle : undefined,
            transitionSpeed: transitionSpeed !== "normal" ? transitionSpeed : undefined,
            hoverDuration,
            staggerDelay,
            hoverEasing: hoverEasing !== "ease" ? hoverEasing : undefined,
            scrollReveal: scrollReveal || undefined,
            cursorEffect: cursorEffect !== "none" ? cursorEffect : undefined,
            cardHover3D: cardHover3D || undefined,
            customCss: customCss || undefined,
            extraBodyClass: extraBodyClass || undefined,
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
    setAvatarAuraStyle("none");
    setAvatarAuraColor("");
    setAvatarAuraSpeed("normal");
    setAvatarAuraBlur("subtle");
    setNameAnimation("none");
    setNameGradient("");
    setStatusBadge("");
    setShowSearch(true);
    setShowCategories(true);
    setShowFloatingBar(true);
    setShowSaveContact(true);
    setAudioFeedback(false);
    setCustomFontName("");
    setLetterSpacing(0);
    setLineHeight(1.5);
    setNameColor("");
    setBioColor("");
    setLinkTextColor("");
    setLinkIconColor("");
    setLinkBorderColor("");
    setCardTintColor("");
    setBorderColor("");
    setCardOpacity(1.0);
    setCardPadding("default");
    setIconBgStyle("transparent");
    setTransitionSpeed("normal");
    setHoverDuration(200);
    setStaggerDelay(45);
    setHoverEasing("ease");
    setScrollReveal(false);
    setCursorEffect("none");
    setCardHover3D(false);
    setCustomCss("");
    setExtraBodyClass("");
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
          {/* Desktop Preview Placement / Docking Mode Switcher */}
          <div className="hidden xl:flex items-center p-1 rounded-xl bg-white/5 border border-white/10 gap-0.5">
            <button
              type="button"
              onClick={() => setDockMode("right")}
              title="Docked Right (Split Screen)"
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all",
                dockMode === "right" ? "bg-violet-600 text-white shadow-sm" : "text-zinc-400 hover:text-white",
              )}
            >
              <PanelRight className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => setDockMode("center")}
              title="Center Focus View"
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all",
                dockMode === "center" ? "bg-violet-600 text-white shadow-sm" : "text-zinc-400 hover:text-white",
              )}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Center</span>
            </button>
            <button
              type="button"
              onClick={() => setDockMode("pip")}
              title="Floating Picture-in-Picture Preview"
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all",
                dockMode === "pip" ? "bg-violet-600 text-white shadow-sm" : "text-zinc-400 hover:text-white",
              )}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Floating</span>
            </button>
          </div>

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
      <div
        className={cn(
          "gap-8 items-start",
          dockMode === "center"
            ? "flex flex-col xl:flex-row xl:justify-center items-center gap-10"
            : dockMode === "pip"
              ? "grid grid-cols-1 max-w-4xl mx-auto"
              : "grid grid-cols-1 xl:grid-cols-12",
        )}
      >
        {/* Left Column: Studio Tabs & Panels */}
        <div
          className={cn(
            "space-y-6",
            dockMode === "right" ? "xl:col-span-7" : "w-full max-w-3xl",
            viewMode === "preview" ? "hidden xl:block" : "block",
          )}
        >
          {/* Segmented Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md">
            {[
              { id: "presets" as const, label: "1-Click Presets", icon: Wand2 },
              { id: "typography" as const, label: "Typography & Fonts", icon: Type },
              { id: "colors" as const, label: "Colors & Atmosphere", icon: Palette },
              { id: "cards" as const, label: "Cards & Surfaces", icon: Layers },
              { id: "motion" as const, label: "Figma Motion & Avatars", icon: Zap },
              { id: "themes" as const, label: "Themes & Bento", icon: LayoutGrid },
              { id: "advanced" as const, label: "⚡ Advanced", icon: Sliders },
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

              {/* ✨ Display Name Animation & Dynamic Gradient Effects */}
              <div className="pt-4 border-t border-white/5 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      Display Name Animation
                    </label>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Live effect</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Choose real-time motion and lighting for your name heading.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2.5">
                    {[
                      { id: "none", label: "Static", desc: "Clean" },
                      { id: "gradient-flow", label: "Gradient Flow", desc: "Flowing colors" },
                      { id: "neon-pulse", label: "Neon Pulse", desc: "Luminous glow" },
                      { id: "shimmer", label: "Light Shimmer", desc: "Light sweep" },
                      { id: "float", label: "Subtle Float", desc: "Levitation" },
                    ].map((anim) => (
                      <button
                        key={anim.id}
                        type="button"
                        onClick={() => setNameAnimation(anim.id)}
                        className={cn(
                          "p-2 rounded-xl border text-center transition-all",
                          nameAnimation === anim.id
                            ? "border-violet-400 bg-violet-500/20 text-white ring-1 ring-violet-400"
                            : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                        )}
                      >
                        <p className="text-xs font-semibold">{anim.label}</p>
                        <p className="text-[10px] text-zinc-500">{anim.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Name Gradient Preset */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Display Name Gradient Palette</label>
                  <p className="text-[11px] text-zinc-500 mb-2.5">Color palette applied when using Gradient Flow or stylized gradient text.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: "", label: "Default Accent", gradient: "from-zinc-400 to-white" },
                      { id: "violet-cyan", label: "Aurora Violet", gradient: "from-purple-500 via-cyan-400 to-pink-500" },
                      { id: "sunset", label: "Sunset Blaze", gradient: "from-orange-500 via-rose-500 to-yellow-400" },
                      { id: "neon-matrix", label: "Neon Matrix", gradient: "from-emerald-400 via-cyan-400 to-blue-500" },
                      { id: "golden-fire", label: "Golden Fire", gradient: "from-amber-400 via-red-500 to-yellow-300" },
                      { id: "cyberpunk", label: "Cyberpunk", gradient: "from-pink-500 via-purple-500 to-cyan-400" },
                    ].map((pal) => (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() => setNameGradient(pal.id)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-xl border text-left transition-all",
                          nameGradient === pal.id
                            ? "border-violet-400 bg-violet-500/20 text-white ring-1 ring-violet-400"
                            : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                        )}
                      >
                        <span className={cn("w-4 h-4 rounded-full bg-gradient-to-tr shrink-0", pal.gradient)} />
                        <span className="text-xs font-medium truncate">{pal.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Google Font Loader */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block">Custom Google Font</label>
                <p className="text-[11px] text-zinc-500">Type any Google Font name to load it dynamically (overrides Font Family above).</p>
                <div className="flex items-center gap-2 p-2 rounded-xl border border-white/10 bg-zinc-900/60">
                  <input
                    type="text"
                    value={customFontName}
                    placeholder="e.g. Nunito, Roboto Condensed, DM Sans..."
                    onChange={(e) => setCustomFontName(e.target.value.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 60))}
                    className="flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
                  />
                  {customFontName && (
                    <button type="button" onClick={() => setCustomFontName("")} className="text-zinc-500 hover:text-zinc-200 text-xs px-1.5">✕</button>
                  )}
                </div>
              </div>

              {/* Extended Font Weight — Light + Black */}
              <div className="pt-4 border-t border-white/5">
                <label className="text-xs font-semibold text-zinc-300 block mb-2">Extended Font Weight</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "light", label: "Light 300" },
                    { id: "normal", label: "Normal 400" },
                    { id: "medium", label: "Medium 500" },
                    { id: "semibold", label: "Semi 600" },
                    { id: "bold", label: "Bold 700" },
                    { id: "black", label: "Black 900" },
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

              {/* Letter Spacing Slider */}
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-zinc-300">Letter Spacing</span>
                  <span className="font-mono text-violet-400">{letterSpacing > 0 ? `+${letterSpacing.toFixed(3)}` : letterSpacing.toFixed(3)}em</span>
                </div>
                <input
                  type="range"
                  min={-0.05}
                  max={0.15}
                  step={0.005}
                  value={letterSpacing}
                  onChange={(e) => setLetterSpacing(Number.parseFloat(e.target.value))}
                  className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                  <span>Tight</span><span>Normal</span><span>Wide</span><span>Widest</span>
                </div>
              </div>

              {/* Line Height Slider */}
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-zinc-300">Line Height</span>
                  <span className="font-mono text-violet-400">{lineHeight.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={1.2}
                  max={2.1}
                  step={0.05}
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number.parseFloat(e.target.value))}
                  className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                  <span>Tight 1.2</span><span>Normal 1.5</span><span>Loose 1.8</span><span>2.1</span>
                </div>
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

              {/* Atmosphere Background Effects (22 Rich Styles) */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    Canvas Atmosphere Effect
                    <span className="px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-mono text-[10px]">
                      {BACKGROUND_EFFECTS.length} styles
                    </span>
                  </label>
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                    {[
                      { id: "all", label: "All (22)" },
                      { id: "tech", label: "⚡ Tech" },
                      { id: "cosmic", label: "🌌 Cosmic" },
                      { id: "retro", label: "🕹️ Retro" },
                      { id: "modern", label: "🎨 Modern" },
                      { id: "texture", label: "📐 Texture" },
                      { id: "classic", label: "✨ Classic" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setEffectCategory(cat.id)}
                        className={cn(
                          "px-2 py-0.5 rounded-full border transition-all shrink-0 text-[10px]",
                          effectCategory === cat.id
                            ? "border-violet-400 bg-violet-500/25 text-white font-medium"
                            : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {BACKGROUND_EFFECTS.filter(
                    (eff) => effectCategory === "all" || eff.category === effectCategory,
                  ).map((eff) => (
                    <button
                      key={eff.id}
                      type="button"
                      onClick={() => setBackgroundEffect(eff.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all relative overflow-hidden group",
                        backgroundEffect === eff.id
                          ? "border-violet-400 bg-violet-500/15 ring-1 ring-violet-400"
                          : "border-white/10 hover:border-white/20 bg-zinc-900/60",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-zinc-200">{eff.label}</p>
                        {backgroundEffect === eff.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{eff.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Per-Element Color Overrides */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowAdvancedColors(!showAdvancedColors)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                >
                  <span>Element Color Overrides</span>
                  <span className="text-zinc-500 text-[10px]">{showAdvancedColors ? "▲ Collapse" : "▼ Expand"}</span>
                </button>
                {showAdvancedColors && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Display Name Color", value: nameColor, set: setNameColor, placeholder: "#ffffff" },
                      { label: "Bio Text Color", value: bioColor, set: setBioColor, placeholder: "#a1a1aa" },
                      { label: "Link Card Text", value: linkTextColor, set: setLinkTextColor, placeholder: "#ffffff" },
                      { label: "Link Card Icon", value: linkIconColor, set: setLinkIconColor, placeholder: "accent" },
                      { label: "Card Border Color", value: linkBorderColor, set: setLinkBorderColor, placeholder: "auto" },
                      { label: "Card Tint Overlay", value: cardTintColor, set: setCardTintColor, placeholder: "none" },
                      { label: "Global Border Override", value: borderColor, set: setBorderColor, placeholder: "auto" },
                    ].map((item) => (
                      <div key={item.label}>
                        <label className="text-[11px] font-semibold text-zinc-400 block mb-1">{item.label}</label>
                        <div className="flex items-center gap-2 p-2 rounded-xl border border-white/10 bg-zinc-900/60">
                          <input
                            type="color"
                            value={item.value || "#8b5cf6"}
                            onChange={(e) => item.set(e.target.value)}
                            className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent shrink-0"
                          />
                          <input
                            type="text"
                            value={item.value}
                            placeholder={item.placeholder}
                            onChange={(e) => item.set(e.target.value)}
                            className="flex-1 bg-transparent text-xs font-mono text-zinc-200 outline-none uppercase"
                          />
                          {item.value && (
                            <button type="button" onClick={() => item.set("")} className="text-zinc-500 hover:text-zinc-200 text-xs px-1">✕</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Gradient Background Builder */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <label className="text-xs font-semibold text-zinc-300 block">Gradient Background Builder</label>
                <div className="flex gap-2">
                  {(["solid", "linear", "radial"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setGradientMode(mode)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg border text-[11px] font-semibold transition-all capitalize",
                        gradientMode === mode
                          ? "border-violet-400 bg-violet-500/20 text-white"
                          : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                {gradientMode !== "solid" && (
                  <div className="space-y-3 p-3 rounded-xl bg-zinc-900/60 border border-white/10">
                    <div
                      className="h-10 rounded-lg border border-white/10"
                      style={{
                        background: gradientMode === "linear"
                          ? `linear-gradient(${gradientAngle}deg, ${gradientStop1}, ${gradientStop2})`
                          : `radial-gradient(circle, ${gradientStop1}, ${gradientStop2})`,
                      }}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { label: "Stop 1", value: gradientStop1, set: setGradientStop1, other: gradientStop2 },
                        { label: "Stop 2", value: gradientStop2, set: setGradientStop2, other: gradientStop1 },
                      ] as const).map((stop, stopIdx) => (
                        <div key={stop.label}>
                          <label className="text-[10px] text-zinc-500 block mb-1">{stop.label}</label>
                          <div className="flex items-center gap-2 p-2 rounded-lg border border-white/10 bg-zinc-900/60">
                            <input
                              type="color"
                              value={stop.value}
                              onChange={(e) => {
                                stop.set(e.target.value);
                                const s1 = stopIdx === 0 ? e.target.value : gradientStop1;
                                const s2 = stopIdx === 1 ? e.target.value : gradientStop2;
                                setBackground(gradientMode === "linear"
                                  ? `linear-gradient(${gradientAngle}deg, ${s1}, ${s2})`
                                  : `radial-gradient(circle, ${s1}, ${s2})`
                                );
                              }}
                              className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                            />
                            <span className="text-xs font-mono text-zinc-300">{stop.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {gradientMode === "linear" && (
                      <div>
                        <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                          <span>Angle</span>
                          <span className="font-mono text-violet-400">{gradientAngle}°</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={360}
                          step={15}
                          value={gradientAngle}
                          onChange={(e) => {
                            const angle = Number(e.target.value);
                            setGradientAngle(angle);
                            setBackground(`linear-gradient(${angle}deg, ${gradientStop1}, ${gradientStop2})`);
                          }}
                          className="w-full accent-violet-500"
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setBackground(gradientMode === "linear"
                        ? `linear-gradient(${gradientAngle}deg, ${gradientStop1}, ${gradientStop2})`
                        : `radial-gradient(circle, ${gradientStop1}, ${gradientStop2})`
                      )}
                      className="w-full py-1.5 text-xs font-semibold rounded-lg border border-violet-400/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-all"
                    >
                      Apply Gradient as Background
                    </button>
                  </div>
                )}
              </div>

              {/* Card Opacity Slider */}
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-zinc-300">Card Opacity / Transparency</span>
                  <span className="font-mono text-violet-400">{Math.round(cardOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={1.0}
                  step={0.05}
                  value={cardOpacity}
                  onChange={(e) => setCardOpacity(Number.parseFloat(e.target.value))}
                  className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                  <span>30% Transparent</span><span>100% Opaque</span>
                </div>
              </div>

              {/* 🎨 Tonal Color Weights & Harmonies */}
              <div className="pt-4 border-t border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300">Tonal Accent Harmony Scale</label>
                  <span className="text-[10px] font-mono text-violet-400">50 → 950 Tones</span>
                </div>
                <p className="text-[11px] text-zinc-500">1-click harmonize your accent with matching tints and shades.</p>
                <div className="grid grid-cols-6 gap-1.5 p-2 rounded-xl bg-zinc-900/60 border border-white/10">
                  {[
                    { label: "50", opacity: "25", desc: "Sheer Tint" },
                    { label: "200", opacity: "55", desc: "Soft Light" },
                    { label: "400", opacity: "85", desc: "Vibrant" },
                    { label: "600", opacity: "b5", desc: "Deep" },
                    { label: "800", opacity: "e0", desc: "Rich" },
                    { label: "950", opacity: "ff", desc: "Solid" },
                  ].map((t) => {
                    const baseColor = accent || "#8b5cf6";
                    const toneColor = `${baseColor.slice(0, 7)}${t.opacity}`;
                    return (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => {
                          setAccent(baseColor);
                          toast.success(`Harmonized with ${t.label} ${t.desc}`);
                        }}
                        className="flex flex-col items-center gap-1 p-1.5 rounded-lg border border-white/5 hover:border-white/20 transition-all group"
                      >
                        <span
                          className="w-full h-7 rounded-md border border-white/10 shadow-sm"
                          style={{ backgroundColor: toneColor }}
                        />
                        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white">{t.label}</span>
                      </button>
                    );
                  })}
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

              {/* Card Padding Preset */}
              <div className="pt-4 border-t border-white/5 space-y-2.5">
                <label className="text-xs font-semibold text-zinc-300">Card Inner Padding</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "compact", label: "Compact", desc: "8px" },
                    { id: "default", label: "Default", desc: "14px" },
                    { id: "spacious", label: "Spacious", desc: "20px" },
                    { id: "roomy", label: "Roomy", desc: "28px" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCardPadding(p.id)}
                      className={cn(
                        "p-2 rounded-xl border text-center transition-all",
                        cardPadding === p.id
                          ? "border-violet-400 bg-violet-500/15 ring-1 ring-violet-400"
                          : "border-white/10 hover:border-white/20 bg-zinc-900/60",
                      )}
                    >
                      <p className="text-xs font-semibold text-zinc-200">{p.label}</p>
                      <p className="text-[10px] text-zinc-500">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Color Override */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block">Border Color Override</label>
                <div className="flex items-center gap-2.5 p-2 rounded-xl border border-white/10 bg-zinc-900/60">
                  <input
                    type="color"
                    value={borderColor || accent || "#8b5cf6"}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={borderColor}
                    placeholder="Auto (from card style)"
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="flex-1 bg-transparent text-xs font-mono text-zinc-200 outline-none uppercase"
                  />
                  {borderColor && (
                    <button type="button" onClick={() => setBorderColor("")} className="text-zinc-500 hover:text-zinc-200 text-xs px-1">✕ Reset</button>
                  )}
                </div>
              </div>

              {/* Icon Background Style */}
              <div className="pt-4 border-t border-white/5 space-y-2.5">
                <label className="text-xs font-semibold text-zinc-300">Icon Background Fill</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "transparent", label: "Transparent", desc: "No fill" },
                    { id: "tinted", label: "Tinted", desc: "Accent 10%" },
                    { id: "accent", label: "Accent Fill", desc: "Solid accent" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setIconBgStyle(s.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-center transition-all",
                        iconBgStyle === s.id
                          ? "border-violet-400 bg-violet-500/15 ring-1 ring-violet-400"
                          : "border-white/10 hover:border-white/20 bg-zinc-900/60",
                      )}
                    >
                      <p className="text-xs font-semibold text-zinc-200">{s.label}</p>
                      <p className="text-[10px] text-zinc-500">{s.desc}</p>
                    </button>
                  ))}
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
                    <p className="text-[11px] text-zinc-400">Adds an active glowing or animated halo ring around avatar</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !avatarRing && avatarAuraStyle === "none";
                      if (next) {
                        setAvatarRing(true);
                        setAvatarAuraStyle("spin");
                      } else {
                        setAvatarRing(false);
                        setAvatarAuraStyle("none");
                      }
                    }}
                    className={cn(
                      "w-11 h-6 rounded-full transition-colors relative",
                      avatarRing || avatarAuraStyle !== "none" ? "bg-violet-600" : "bg-zinc-800",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                        avatarRing || avatarAuraStyle !== "none" ? "left-6" : "left-1",
                      )}
                    />
                  </button>
                </div>

                {/* Extended Avatar Aura Customizer */}
                {(avatarRing || avatarAuraStyle !== "none") && (
                  <div className="p-3.5 rounded-xl border border-violet-500/20 bg-violet-950/10 space-y-3.5">
                    {/* Aura Animation Style */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-zinc-300">Aura Halo Style</label>
                        <span className="text-[10px] text-violet-400 font-mono uppercase">{avatarAuraStyle}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { id: "spin", label: "Conic Spin", desc: "Multi-color rotate" },
                          { id: "pulse", label: "Pulsing Glow", desc: "Breathing aura" },
                          { id: "ripple", label: "Radar Ripple", desc: "Expanding wave" },
                          { id: "neon", label: "Neon Breathe", desc: "Luminous neon" },
                          { id: "fire", label: "Solar Flare", desc: "Blazing ember" },
                          { id: "cyber", label: "Cyber Vortex", desc: "Cyan & purple" },
                          { id: "static", label: "Steady Glow", desc: "Soft back-glow" },
                        ].map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              setAvatarAuraStyle(st.id);
                              setAvatarRing(true);
                            }}
                            className={cn(
                              "p-2 rounded-lg border text-left transition-all",
                              avatarAuraStyle === st.id
                                ? "border-violet-400 bg-violet-500/20 text-white ring-1 ring-violet-400"
                                : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                            )}
                          >
                            <p className="text-xs font-semibold">{st.label}</p>
                            <p className="text-[10px] text-zinc-500">{st.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Aura Speed & Blur Radius */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                      <div>
                        <label className="text-[11px] font-semibold text-zinc-400 block mb-1.5">Animation Speed</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: "slow", label: "Slow", desc: "8s" },
                            { id: "normal", label: "Normal", desc: "3.6s" },
                            { id: "fast", label: "Fast", desc: "1.8s" },
                          ].map((sp) => (
                            <button
                              key={sp.id}
                              type="button"
                              onClick={() => setAvatarAuraSpeed(sp.id)}
                              className={cn(
                                "py-1.5 px-2 rounded-lg border text-center transition-all",
                                avatarAuraSpeed === sp.id
                                  ? "border-violet-400 bg-violet-500/20 text-white"
                                  : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                              )}
                            >
                              <p className="text-xs font-medium">{sp.label}</p>
                              <p className="text-[10px] text-zinc-500">{sp.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-zinc-400 block mb-1.5">Glow Blur Radius</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: "subtle", label: "Subtle", desc: "2px" },
                            { id: "medium", label: "Medium", desc: "8px" },
                            { id: "intense", label: "Intense", desc: "16px" },
                          ].map((bl) => (
                            <button
                              key={bl.id}
                              type="button"
                              onClick={() => setAvatarAuraBlur(bl.id)}
                              className={cn(
                                "py-1.5 px-2 rounded-lg border text-center transition-all",
                                avatarAuraBlur === bl.id
                                  ? "border-violet-400 bg-violet-500/20 text-white"
                                  : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                              )}
                            >
                              <p className="text-xs font-medium">{bl.label}</p>
                              <p className="text-[10px] text-zinc-500">{bl.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Custom Aura Color */}
                    <div className="pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-semibold text-zinc-400">Aura Glow Color</label>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {avatarAuraColor || "Default (Accent)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl border border-white/10 bg-zinc-900/60">
                        <input
                          type="color"
                          value={avatarAuraColor || accent || "#8b5cf6"}
                          onChange={(e) => setAvatarAuraColor(e.target.value)}
                          className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent shrink-0"
                        />
                        <input
                          type="text"
                          value={avatarAuraColor}
                          placeholder="Accent (Auto)"
                          onChange={(e) => setAvatarAuraColor(e.target.value)}
                          className="flex-1 bg-transparent text-xs font-mono text-zinc-200 outline-none uppercase"
                        />
                        {avatarAuraColor && (
                          <button
                            type="button"
                            onClick={() => setAvatarAuraColor("")}
                            className="text-zinc-500 hover:text-zinc-200 text-xs px-2 py-1 rounded bg-white/5"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      {/* Quick Palette Pills */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {[
                          { label: "Pink", color: "#ec4899" },
                          { label: "Cyan", color: "#06b6d4" },
                          { label: "Violet", color: "#8b5cf6" },
                          { label: "Emerald", color: "#10b981" },
                          { label: "Gold", color: "#f59e0b" },
                          { label: "Fire", color: "#ff4500" },
                        ].map((c) => (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => setAvatarAuraColor(c.color)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-white/10 bg-zinc-900 text-[11px] text-zinc-300 hover:border-white/25"
                          >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                            <span>{c.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Transition Speed */}
              <div className="pt-4 border-t border-white/5 space-y-2.5">
                <label className="text-xs font-semibold text-zinc-300">Global Transition Speed</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "instant", label: "Instant", desc: "0ms" },
                    { id: "fast", label: "Fast", desc: "150ms" },
                    { id: "normal", label: "Normal", desc: "250ms" },
                    { id: "slow", label: "Slow", desc: "400ms" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setTransitionSpeed(s.id)}
                      className={cn(
                        "p-2 rounded-xl border text-center transition-all",
                        transitionSpeed === s.id
                          ? "border-violet-400 bg-violet-500/15 ring-1 ring-violet-400"
                          : "border-white/10 hover:border-white/20 bg-zinc-900/60",
                      )}
                    >
                      <p className="text-xs font-semibold text-zinc-200">{s.label}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hover Easing Curve */}
              <div className="pt-4 border-t border-white/5 space-y-2.5">
                <label className="text-xs font-semibold text-zinc-300">Hover Easing Curve</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "ease", label: "Ease", desc: "Natural smooth" },
                    { id: "spring", label: "Spring", desc: "Elastic bounce" },
                    { id: "linear", label: "Linear", desc: "Constant speed" },
                    { id: "bounce", label: "Bounce", desc: "Playful rebound" },
                  ].map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setHoverEasing(e.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all",
                        hoverEasing === e.id
                          ? "border-violet-400 bg-violet-500/15 ring-1 ring-violet-400"
                          : "border-white/10 hover:border-white/20 bg-zinc-900/60",
                      )}
                    >
                      <p className="text-xs font-semibold text-zinc-200">{e.label}</p>
                      <p className="text-[10px] text-zinc-500">{e.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stagger Delay */}
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-zinc-300">Card Entrance Stagger Delay</span>
                  <span className="font-mono text-violet-400">{staggerDelay}ms per card</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 20, 45, 80].map((ms) => (
                    <button
                      key={ms}
                      type="button"
                      onClick={() => setStaggerDelay(ms)}
                      className={cn(
                        "py-1.5 rounded-lg border text-[11px] font-semibold text-center transition-all",
                        staggerDelay === ms
                          ? "border-violet-400 bg-violet-500/20 text-white"
                          : "border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                      )}
                    >
                      {ms}ms
                    </button>
                  ))}
                </div>
              </div>

              {/* Scroll Reveal Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-zinc-900/60">
                <div>
                  <p className="text-xs font-semibold text-zinc-200">Scroll Reveal Animation</p>
                  <p className="text-[11px] text-zinc-400">Trigger entrance animations when cards scroll into view</p>
                </div>
                <button
                  type="button"
                  onClick={() => setScrollReveal(!scrollReveal)}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative",
                    scrollReveal ? "bg-violet-600" : "bg-zinc-800",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                      scrollReveal ? "left-6" : "left-1",
                    )}
                  />
                </button>
              </div>

              {/* 🖱️ Custom Cursor Tracking */}
              <div className="pt-4 border-t border-white/5 space-y-2.5">
                <label className="text-xs font-semibold text-zinc-300">Custom Cursor Tracking Effect</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "none", label: "Default", desc: "Native cursor" },
                    { id: "glow", label: "Accent Glow", desc: "Ambient luminous follower" },
                    { id: "dot", label: "Target Dot", desc: "Crisp accent ring" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCursorEffect(c.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all",
                        cursorEffect === c.id
                          ? "border-violet-400 bg-violet-500/15 ring-1 ring-violet-400"
                          : "border-white/10 hover:border-white/20 bg-zinc-900/60",
                      )}
                    >
                      <p className="text-xs font-semibold text-zinc-200">{c.label}</p>
                      <p className="text-[10px] text-zinc-500">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 🧊 Interactive 3D Perspective Card Tilt */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-zinc-900/60">
                <div>
                  <p className="text-xs font-semibold text-zinc-200">Interactive 3D Card Tilt</p>
                  <p className="text-[11px] text-zinc-400">Dynamic mouse-following perspective tilt on link cards</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCardHover3D(!cardHover3D)}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative",
                    cardHover3D ? "bg-violet-600" : "bg-zinc-800",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                      cardHover3D ? "left-6" : "left-1",
                    )}
                  />
                </button>
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

          {/* TAB 7: Advanced — Custom CSS, CSS Variables Export, Body Classes */}
          {activeTab === "advanced" && (
            <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/40 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-violet-400" />
                  Advanced Customization
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Custom CSS injection, CSS variable export, and extra body class names for power users.
                </p>
              </div>

              {/* 🌐 Public Web Experience & Portfolio Features */}
              <div className="p-5 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-violet-400" />
                    <h3 className="text-xs font-semibold text-zinc-200">Public Web Experience & Portfolio Tools</h3>
                  </div>
                  <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                    Agency Grade
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Transform your bio link into an interactive web app with quick link search, category tabs, vCard contact download, and real-time status.
                </p>

                {/* Status Badge */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="text-xs font-semibold text-zinc-300 block">Live Status / Availability Badge</label>
                  <p className="text-[11px] text-zinc-500">Shows a pulsating status indicator in your floating action bar.</p>
                  <input
                    type="text"
                    value={statusBadge}
                    placeholder="e.g. 🚀 Shipping LinkForge v2, ⚡ Open for Work"
                    onChange={(e) => setStatusBadge(e.target.value.slice(0, 60))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-400/50"
                  />
                  {/* Preset quick pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      "🚀 Shipping LinkForge v2",
                      "⚡ Open for Work",
                      "🔥 Building in Public",
                      "🎙️ Streaming Today",
                      "💼 Open for Freelance",
                    ].map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => setStatusBadge(pill)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-[10px] border transition-all",
                          statusBadge === pill
                            ? "border-violet-400 bg-violet-500/20 text-white"
                            : "border-white/5 bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10",
                        )}
                      >
                        {pill}
                      </button>
                    ))}
                    {statusBadge && (
                      <button
                        type="button"
                        onClick={() => setStatusBadge("")}
                        className="px-2 py-1 rounded-lg text-[10px] border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Toggles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/5">
                  {/* Floating Action Bar */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-zinc-900/60">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-violet-400" />
                        Floating Action Bar
                      </p>
                      <p className="text-[10px] text-zinc-500">Top glass bar with 1-click share & contact</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFloatingBar(!showFloatingBar)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors relative shrink-0",
                        showFloatingBar ? "bg-violet-600" : "bg-zinc-800",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                          showFloatingBar ? "left-5" : "left-0.5",
                        )}
                      />
                    </button>
                  </div>

                  {/* Save Contact vCard */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-zinc-900/60">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-violet-400" />
                        vCard Save Contact
                      </p>
                      <p className="text-[10px] text-zinc-500">1-click .vcf address book download</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSaveContact(!showSaveContact)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors relative shrink-0",
                        showSaveContact ? "bg-violet-600" : "bg-zinc-800",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                          showSaveContact ? "left-5" : "left-0.5",
                        )}
                      />
                    </button>
                  </div>

                  {/* Live Link Search */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-zinc-900/60">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-violet-400" />
                        Live Link Search Bar
                      </p>
                      <p className="text-[10px] text-zinc-500">Fast filter input for links & products</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSearch(!showSearch)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors relative shrink-0",
                        showSearch ? "bg-violet-600" : "bg-zinc-800",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                          showSearch ? "left-5" : "left-0.5",
                        )}
                      />
                    </button>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-zinc-900/60">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-violet-400" />
                        Category Filter Tabs
                      </p>
                      <p className="text-[10px] text-zinc-500">Auto-pills: All, Featured, Socials, Store</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCategories(!showCategories)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors relative shrink-0",
                        showCategories ? "bg-violet-600" : "bg-zinc-800",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                          showCategories ? "left-5" : "left-0.5",
                        )}
                      />
                    </button>
                  </div>

                  {/* Tactile Audio Feedback */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-zinc-900/60 sm:col-span-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                        Tactile Web Audio Click Chime
                      </p>
                      <p className="text-[10px] text-zinc-500">Synthesized micro-click feedback on tap (0KB audio files, Web Audio API)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAudioFeedback(!audioFeedback)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors relative shrink-0",
                        audioFeedback ? "bg-violet-600" : "bg-zinc-800",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                          audioFeedback ? "left-5" : "left-0.5",
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom CSS Injection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300">Custom CSS Injection</label>
                  <span className="text-[10px] font-mono text-zinc-500">{customCss.length}/4000 chars</span>
                </div>
                <p className="text-[11px] text-amber-400/80 bg-amber-500/[0.08] border border-amber-500/20 rounded-lg px-3 py-2">
                  ⚠️ CSS is injected directly into your live public bio page. @import and javascript: are automatically stripped.
                </p>
                <textarea
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value.slice(0, 4000))}
                  placeholder={"/* Example: */\n.lf-card { box-shadow: 0 0 30px #8b5cf666; }\nh1 { letter-spacing: 0.1em; }"}
                  rows={8}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-zinc-200 outline-none resize-y placeholder:text-zinc-600 focus:border-violet-400/50 transition-colors"
                />
              </div>

              {/* CSS Variables Export */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block">Export CSS Variables Snapshot</label>
                <p className="text-[11px] text-zinc-500">Copy your current design settings as CSS custom properties.</p>
                <button
                  type="button"
                  onClick={() => {
                    const vars = [
                      `--lf-accent: ${accent || "#8b5cf6"};`,
                      `--lf-background: ${background || "#050508"};`,
                      `--lf-radius: ${buttonShape === "sharp" ? "0px" : buttonShape === "soft" ? "12px" : buttonShape === "pill" ? "9999px" : "18px"};`,
                      `--lf-font-family: ${fontFamily};`,
                      `--lf-font-weight: ${fontWeight};`,
                      `--lf-card-style: ${cardStyle};`,
                      `--lf-border-width: ${borderWidth}px;`,
                      `--lf-card-opacity: ${cardOpacity};`,
                      `--lf-letter-spacing: ${letterSpacing}em;`,
                      `--lf-line-height: ${lineHeight};`,
                      nameColor ? `--lf-name-color: ${nameColor};` : null,
                      bioColor ? `--lf-bio-color: ${bioColor};` : null,
                      linkTextColor ? `--lf-link-text: ${linkTextColor};` : null,
                      linkIconColor ? `--lf-link-icon: ${linkIconColor};` : null,
                    ].filter(Boolean).join("\n");
                    navigator.clipboard.writeText(`:root {\n${vars}\n}`);
                    setCssExportCopied(true);
                    setTimeout(() => setCssExportCopied(false), 2000);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all",
                    cssExportCopied
                      ? "border-emerald-400 bg-emerald-500/15 text-emerald-300"
                      : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-white",
                  )}
                >
                  {cssExportCopied ? <Check className="w-3.5 h-3.5" /> : <Palette className="w-3.5 h-3.5" />}
                  {cssExportCopied ? "Copied to clipboard!" : "Copy CSS Variables"}
                </button>
              </div>

              {/* Extra Body Classes */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block">Extra Body CSS Classes</label>
                <p className="text-[11px] text-zinc-500">Space-separated class names appended to your bio page body. Letters, numbers, dashes, underscores only.</p>
                <div className="flex items-center gap-2 p-2 rounded-xl border border-white/10 bg-zinc-900/60">
                  <input
                    type="text"
                    value={extraBodyClass}
                    placeholder="e.g. dark-mode custom-theme premium-user"
                    onChange={(e) => setExtraBodyClass(e.target.value.replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 80))}
                    className="flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600 font-mono"
                  />
                  <span className="text-[10px] text-zinc-600 font-mono shrink-0">{extraBodyClass.length}/80</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Phone Preview Frame (Sticky on Desktop, Adapts to Docking Mode) */}
        <div
          className={cn(
            viewMode === "editor" ? "hidden xl:flex" : "flex",
            dockMode === "right" && "xl:col-span-5 xl:sticky xl:top-6 self-start flex-col items-center z-20",
            dockMode === "center" && "w-full max-w-sm xl:sticky xl:top-6 self-start flex-col items-center z-20 mx-auto",
            dockMode === "pip" && "fixed bottom-6 right-6 z-50 p-3 rounded-3xl bg-zinc-950/95 border border-white/20 shadow-2xl shadow-black/80 backdrop-blur-xl max-h-[85vh] overflow-y-auto hidden xl:flex flex-col items-center scale-90 origin-bottom-right transition-all",
          )}
        >
          <div className="w-full flex items-center justify-between px-2 mb-3">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-violet-400" />
              Live Phone Preview
              {dockMode === "pip" && (
                <span className="text-[10px] text-violet-400 bg-violet-500/15 px-1.5 py-0.2 rounded font-mono">PiP</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 font-mono">Real-time sync</span>
              {dockMode === "pip" && (
                <button
                  type="button"
                  onClick={() => setDockMode("right")}
                  className="text-zinc-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-white/5"
                  title="Dock to side"
                >
                  Dock
                </button>
              )}
            </div>
          </div>

          <div className="w-full flex justify-center">
            <PhonePreview profile={previewProfile} links={links} />
          </div>
        </div>
      </div>
    </div>
  );
}
