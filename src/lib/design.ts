// =============================================================================
// 🎨 Design Prefs — manual customization layer (theme ke upar override)
// Pure types + merge helper (server + client safe). Persist: PATCH /api/design.
// NULL/undefined = theme defaults (kuch tootega nahi).
// =============================================================================

export interface DesignPrefs {
  /** Card/icon accent hex, e.g. "#8b5cf6". Empty = theme accent. */
  accent?: string;
  /** Custom background color or gradient (hex / linear-gradient / radial-gradient). */
  background?: string;
  /** Card corner radius px (0–28). Undefined = theme radius. */
  radiusPx?: number;
  /** Title font scale (0.85–1.25). Undefined = 1. */
  fontScale?: number;
  /** Icon glyph size px (16–36). Undefined = 20. */
  iconSize?: number;
  /** Custom typography font family (15+ fonts or custom:FontName) */
  fontFamily?: string;
  /** Font casing: "normal" | "uppercase" | "capitalize" | "lowercase" */
  fontStyle?: string;
  /** Font weight: "light" | "normal" | "medium" | "semibold" | "bold" | "black" */
  fontWeight?: string;
  /** Title glow / shadow effect: "none" | "subtle" | "neon" | "outline" */
  textShadow?: string;
  /** Card surface style: "glass" | "solid" | "neon" | "neumorphic" | "minimal" */
  cardStyle?: string;
  /** Button corner shape: "sharp" | "soft" | "curved" | "pill" */
  buttonShape?: string;
  /** Card border width px: 0 | 1 | 2 | 3 */
  borderWidth?: number;
  /** Card backdrop blur: "none" | "low" | "medium" | "high" */
  blurStrength?: string;
  /** Card shadow strength: "none" | "soft" | "floating" | "glow" */
  shadowStrength?: string;
  /** Atmosphere background effect: "glow" | "mesh" | "dots" | "aurora" | "none" */
  backgroundEffect?: string;
  /** Interactive card hover effect: "lift" | "scale" | "glow" | "tilt" | "none" */
  hoverEffect?: string;
  /** Card entrance animation: "none" | "fade" | "slide" | "pop" */
  entranceAnimation?: string;
  /** Featured / attention animation: "none" | "pulse" | "shimmer" */
  attentionEffect?: string;
  /** Avatar shape: "circle" | "squircle" | "rounded" | "hexagon" */
  avatarShape?: string;
  /** Avatar animated gradient aura ring */
  avatarRing?: boolean;

  // ── Advanced Typography ──────────────────────────────────────────────────────
  /** Custom Google Font name to dynamically load (e.g. "Nunito", "Roboto Condensed"). */
  customFontName?: string;
  /** Letter spacing in em units (-0.05 to 0.15). */
  letterSpacing?: number;
  /** Line height ratio (1.2 to 2.1). */
  lineHeight?: number;

  // ── Per-Element Colors ───────────────────────────────────────────────────────
  /** Display name / headline text color hex. Empty = white. */
  nameColor?: string;
  /** Bio / description paragraph text color hex. Empty = theme muted. */
  bioColor?: string;
  /** Link card title text color hex. Empty = white. */
  linkTextColor?: string;
  /** Link card icon glyph color hex. Empty = accent. */
  linkIconColor?: string;
  /** Link card border color hex override. Empty = cardStyle auto. */
  linkBorderColor?: string;
  /** Card surface tint overlay hex (blended over card background). Empty = none. */
  cardTintColor?: string;
  /** Global card border color override hex. Empty = cardStyle default. */
  borderColor?: string;

  // ── Advanced Card Controls ───────────────────────────────────────────────────
  /** Card surface opacity (0.3 to 1.0). Undefined = 1.0. */
  cardOpacity?: number;
  /** Card inner padding preset: "compact" | "default" | "spacious" | "roomy" */
  cardPadding?: string;
  /** Icon container background fill style: "transparent" | "tinted" | "accent" */
  iconBgStyle?: string;

  // ── Advanced Motion Controls ─────────────────────────────────────────────────
  /** Global transition speed preset: "instant" | "fast" | "normal" | "slow" */
  transitionSpeed?: string;
  /** Hover transition duration in ms (0 / 150 / 250 / 400). Undefined = 200. */
  hoverDuration?: number;
  /** Stagger delay between link card entrance cascade in ms (0 / 20 / 50 / 80). */
  staggerDelay?: number;
  /** Hover easing curve: "ease" | "spring" | "linear" | "bounce" */
  hoverEasing?: string;
  /** Enable Intersection Observer scroll-reveal for entrance animations. */
  scrollReveal?: boolean;

  // ── Advanced / Custom Code ───────────────────────────────────────────────────
  /** Raw CSS injected into bio page <style> tag (max 4000 chars, sanitized). */
  customCss?: string;
  /** Extra CSS class names appended to bio page <body> (max 80 chars, sanitized). */
  extraBodyClass?: string;
}

export const DESIGN_LIMITS = {
  radiusPx: { min: 0, max: 28 },
  fontScale: { min: 0.85, max: 1.25 },
  iconSize: { min: 16, max: 36 },
  borderWidth: { min: 0, max: 3 },
  letterSpacing: { min: -0.05, max: 0.15 },
  lineHeight: { min: 1.2, max: 2.1 },
  cardOpacity: { min: 0.3, max: 1.0 },
  hoverDuration: { min: 0, max: 600 },
  staggerDelay: { min: 0, max: 150 },
} as const;

export const DEFAULT_ICON_SIZE = 20;

const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;

function isValidHex(v: unknown): v is string {
  return typeof v === "string" && HEX_RE.test(v);
}

function isValidBackground(v: unknown): v is string {
  if (typeof v !== "string") return false;
  return (
    HEX_RE.test(v) ||
    v.startsWith("linear-gradient") ||
    v.startsWith("radial-gradient")
  );
}

/** Strip dangerous CSS constructs from custom CSS injection. */
export function sanitizeCss(raw: string): string {
  return raw
    .replace(/@import\b[^;]*/gi, "/* @import removed */")
    .replace(/url\s*\(\s*["']?\s*javascript:/gi, "url(invalid:")
    .replace(/expression\s*\(/gi, "expression_removed(")
    .slice(0, 4000);
}

/** Sanitize extra body class names — only alphanumeric, dashes, underscores, spaces. */
export function sanitizeBodyClass(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 80).trim();
}

export function clampDesign(prefs: DesignPrefs): DesignPrefs {
  const out: DesignPrefs = {};
  const str40 = (v: unknown) =>
    typeof v === "string" ? (v as string).slice(0, 40) : undefined;

  // ── Core fields ─────────────────────────────────────────────────────────────
  if (prefs.accent && isValidHex(prefs.accent)) out.accent = prefs.accent;
  if (prefs.background && isValidBackground(prefs.background)) out.background = prefs.background;

  if (typeof prefs.radiusPx === "number") {
    out.radiusPx = Math.min(
      DESIGN_LIMITS.radiusPx.max,
      Math.max(DESIGN_LIMITS.radiusPx.min, Math.round(prefs.radiusPx)),
    );
  }
  if (typeof prefs.fontScale === "number" && Number.isFinite(prefs.fontScale)) {
    out.fontScale = Math.min(
      DESIGN_LIMITS.fontScale.max,
      Math.max(DESIGN_LIMITS.fontScale.min, Math.round(prefs.fontScale * 100) / 100),
    );
  }
  if (typeof prefs.iconSize === "number") {
    out.iconSize = Math.min(
      DESIGN_LIMITS.iconSize.max,
      Math.max(DESIGN_LIMITS.iconSize.min, Math.round(prefs.iconSize)),
    );
  }
  if (typeof prefs.borderWidth === "number") {
    out.borderWidth = Math.min(
      DESIGN_LIMITS.borderWidth.max,
      Math.max(DESIGN_LIMITS.borderWidth.min, Math.round(prefs.borderWidth)),
    );
  }
  if (prefs.fontFamily && typeof prefs.fontFamily === "string") out.fontFamily = prefs.fontFamily.slice(0, 80);
  if (str40(prefs.fontStyle)) out.fontStyle = str40(prefs.fontStyle)!;
  if (str40(prefs.fontWeight)) out.fontWeight = str40(prefs.fontWeight)!;
  if (str40(prefs.textShadow)) out.textShadow = str40(prefs.textShadow)!;
  if (str40(prefs.cardStyle)) out.cardStyle = str40(prefs.cardStyle)!;
  if (str40(prefs.buttonShape)) out.buttonShape = str40(prefs.buttonShape)!;
  if (str40(prefs.blurStrength)) out.blurStrength = str40(prefs.blurStrength)!;
  if (str40(prefs.shadowStrength)) out.shadowStrength = str40(prefs.shadowStrength)!;
  if (str40(prefs.backgroundEffect)) out.backgroundEffect = str40(prefs.backgroundEffect)!;
  if (str40(prefs.hoverEffect)) out.hoverEffect = str40(prefs.hoverEffect)!;
  if (str40(prefs.entranceAnimation)) out.entranceAnimation = str40(prefs.entranceAnimation)!;
  if (str40(prefs.attentionEffect)) out.attentionEffect = str40(prefs.attentionEffect)!;
  if (str40(prefs.avatarShape)) out.avatarShape = str40(prefs.avatarShape)!;
  if (typeof prefs.avatarRing === "boolean") out.avatarRing = prefs.avatarRing;

  // ── Advanced Typography ──────────────────────────────────────────────────────
  if (prefs.customFontName && typeof prefs.customFontName === "string") {
    out.customFontName = prefs.customFontName.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 60);
  }
  if (typeof prefs.letterSpacing === "number" && Number.isFinite(prefs.letterSpacing)) {
    out.letterSpacing = Math.min(
      DESIGN_LIMITS.letterSpacing.max,
      Math.max(DESIGN_LIMITS.letterSpacing.min, Math.round(prefs.letterSpacing * 1000) / 1000),
    );
  }
  if (typeof prefs.lineHeight === "number" && Number.isFinite(prefs.lineHeight)) {
    out.lineHeight = Math.min(
      DESIGN_LIMITS.lineHeight.max,
      Math.max(DESIGN_LIMITS.lineHeight.min, Math.round(prefs.lineHeight * 100) / 100),
    );
  }

  // ── Per-Element Colors ───────────────────────────────────────────────────────
  if (isValidHex(prefs.nameColor)) out.nameColor = prefs.nameColor;
  if (isValidHex(prefs.bioColor)) out.bioColor = prefs.bioColor;
  if (isValidHex(prefs.linkTextColor)) out.linkTextColor = prefs.linkTextColor;
  if (isValidHex(prefs.linkIconColor)) out.linkIconColor = prefs.linkIconColor;
  if (isValidHex(prefs.linkBorderColor)) out.linkBorderColor = prefs.linkBorderColor;
  if (isValidHex(prefs.cardTintColor)) out.cardTintColor = prefs.cardTintColor;
  if (isValidHex(prefs.borderColor)) out.borderColor = prefs.borderColor;

  // ── Advanced Card Controls ───────────────────────────────────────────────────
  if (typeof prefs.cardOpacity === "number" && Number.isFinite(prefs.cardOpacity)) {
    out.cardOpacity = Math.min(
      DESIGN_LIMITS.cardOpacity.max,
      Math.max(DESIGN_LIMITS.cardOpacity.min, Math.round(prefs.cardOpacity * 100) / 100),
    );
  }
  if (str40(prefs.cardPadding)) out.cardPadding = str40(prefs.cardPadding)!;
  if (str40(prefs.iconBgStyle)) out.iconBgStyle = str40(prefs.iconBgStyle)!;

  // ── Advanced Motion Controls ─────────────────────────────────────────────────
  if (str40(prefs.transitionSpeed)) out.transitionSpeed = str40(prefs.transitionSpeed)!;
  if (typeof prefs.hoverDuration === "number" && Number.isFinite(prefs.hoverDuration)) {
    out.hoverDuration = Math.min(
      DESIGN_LIMITS.hoverDuration.max,
      Math.max(DESIGN_LIMITS.hoverDuration.min, Math.round(prefs.hoverDuration)),
    );
  }
  if (typeof prefs.staggerDelay === "number" && Number.isFinite(prefs.staggerDelay)) {
    out.staggerDelay = Math.min(
      DESIGN_LIMITS.staggerDelay.max,
      Math.max(DESIGN_LIMITS.staggerDelay.min, Math.round(prefs.staggerDelay)),
    );
  }
  if (str40(prefs.hoverEasing)) out.hoverEasing = str40(prefs.hoverEasing)!;
  if (typeof prefs.scrollReveal === "boolean") out.scrollReveal = prefs.scrollReveal;

  // ── Advanced Code ────────────────────────────────────────────────────────────
  if (prefs.customCss && typeof prefs.customCss === "string") {
    out.customCss = sanitizeCss(prefs.customCss);
  }
  if (prefs.extraBodyClass && typeof prefs.extraBodyClass === "string") {
    out.extraBodyClass = sanitizeBodyClass(prefs.extraBodyClass);
  }

  return out;
}

/** DB row (unknown JSON) → safe prefs | null */
export function parseDesign(value: unknown): DesignPrefs | null {
  if (!value || typeof value !== "object") return null;
  const clamped = clampDesign(value as DesignPrefs);
  return Object.keys(clamped).length > 0 ? clamped : null;
}

