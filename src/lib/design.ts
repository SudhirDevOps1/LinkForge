// =============================================================================
// 🎨 Design Prefs — manual customization layer (theme ke upar override)
// Pure types + merge helper (server + client safe). Persist: PATCH /api/design.
// NULL/undefined = theme defaults (kuch tootega nahi).
// =============================================================================

export interface DesignPrefs {
  /** Card/icon accent hex, e.g. "#8b5cf6". Empty = theme accent. */
  accent?: string;
  /** Custom background color or gradient hex. */
  background?: string;
  /** Card corner radius px (0–28). Undefined = theme radius. */
  radiusPx?: number;
  /** Title font scale (0.85–1.25). Undefined = 1. */
  fontScale?: number;
  /** Icon glyph size px (16–36). Undefined = 20. */
  iconSize?: number;
  /** Custom typography font family */
  fontFamily?: string;
  /** Font casing & letter spacing: "normal" | "uppercase" | "wide" */
  fontStyle?: string;
  /** Card surface style: "glass" | "solid" | "neon" | "neumorphic" | "minimal" */
  cardStyle?: string;
  /** Button corner shape: "sharp" | "soft" | "curved" | "pill" */
  buttonShape?: string;
  /** Atmosphere background effect: "glow" | "mesh" | "noise" | "dots" | "none" */
  backgroundEffect?: string;
  /** Interactive card hover effect: "lift" | "scale" | "glow" | "none" */
  hoverEffect?: string;
}

export const DESIGN_LIMITS = {
  radiusPx: { min: 0, max: 28 },
  fontScale: { min: 0.85, max: 1.25 },
  iconSize: { min: 16, max: 36 },
} as const;

export const DEFAULT_ICON_SIZE = 20;

export function clampDesign(prefs: DesignPrefs): DesignPrefs {
  const out: DesignPrefs = {};
  if (prefs.accent && /^#[0-9a-fA-F]{3,8}$/.test(prefs.accent)) out.accent = prefs.accent;
  if (prefs.background && (prefs.background.startsWith("#") || prefs.background.startsWith("linear") || prefs.background.startsWith("radial"))) {
    out.background = prefs.background;
  }
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
  if (prefs.fontFamily && typeof prefs.fontFamily === "string") {
    out.fontFamily = prefs.fontFamily.slice(0, 40);
  }
  if (prefs.fontStyle && typeof prefs.fontStyle === "string") {
    out.fontStyle = prefs.fontStyle.slice(0, 40);
  }
  if (prefs.cardStyle && typeof prefs.cardStyle === "string") {
    out.cardStyle = prefs.cardStyle.slice(0, 40);
  }
  if (prefs.buttonShape && typeof prefs.buttonShape === "string") {
    out.buttonShape = prefs.buttonShape.slice(0, 40);
  }
  if (prefs.backgroundEffect && typeof prefs.backgroundEffect === "string") {
    out.backgroundEffect = prefs.backgroundEffect.slice(0, 40);
  }
  if (prefs.hoverEffect && typeof prefs.hoverEffect === "string") {
    out.hoverEffect = prefs.hoverEffect.slice(0, 40);
  }
  return out;
}

/** DB row (unknown JSON) → safe prefs | null */
export function parseDesign(value: unknown): DesignPrefs | null {
  if (!value || typeof value !== "object") return null;
  const clamped = clampDesign(value as DesignPrefs);
  return Object.keys(clamped).length > 0 ? clamped : null;
}
