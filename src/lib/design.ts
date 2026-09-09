// =============================================================================
// 🎨 Design Prefs — manual customization layer (theme ke upar override)
// Pure types + merge helper (server + client safe). Persist: PATCH /api/design.
// NULL/undefined = theme defaults (kuch tootega nahi).
// =============================================================================

export interface DesignPrefs {
  /** Card/icon accent hex, e.g. "#8b5cf6". Empty = theme accent. */
  accent?: string;
  /** Card corner radius px (0–24). Undefined = theme radius. */
  radiusPx?: number;
  /** Title font scale (0.9–1.15). Undefined = 1. */
  fontScale?: number;
  /** Icon glyph size px (16–32). Undefined = 20. */
  iconSize?: number;
}

export const DESIGN_LIMITS = {
  radiusPx: { min: 0, max: 24 },
  fontScale: { min: 0.9, max: 1.15 },
  iconSize: { min: 16, max: 32 },
} as const;

export const DEFAULT_ICON_SIZE = 20;

export function clampDesign(prefs: DesignPrefs): DesignPrefs {
  const out: DesignPrefs = {};
  if (prefs.accent && /^#[0-9a-fA-F]{6}$/.test(prefs.accent)) out.accent = prefs.accent;
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
  return out;
}

/** DB row (unknown JSON) → safe prefs | null */
export function parseDesign(value: unknown): DesignPrefs | null {
  if (!value || typeof value !== "object") return null;
  const clamped = clampDesign(value as DesignPrefs);
  return Object.keys(clamped).length > 0 ? clamped : null;
}
