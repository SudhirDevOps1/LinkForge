// =============================================================================
// 📥 Import-merge helpers — pure functions (unit-testable, no DB/Next imports)
// -----------------------------------------------------------------------------
// Default import mode = merge: existing links kabhi delete nahi hote,
// duplicate URLs skip hote hain (re-import idempotent). `?mode=replace`
// par hi purana destructive replace chalta hai.
// =============================================================================

export interface IncomingLink {
  url: string;
  [key: string]: unknown;
}

/** URL normalize: trim + lowercase host + trailing-slash trim (compare ke liye) */
export function normalizeLinkUrl(url: string): string {
  const t = url.trim();
  try {
    const u = new URL(t);
    const path = u.pathname.replace(/\/+$/, "") || "/";
    return `${u.protocol}//${u.host.toLowerCase()}${path}${u.search}${u.hash}`;
  } catch {
    return t.toLowerCase();
  }
}

/**
 * Existing URLs ke against incoming links split karo.
 * Returns { fresh, skipped } — fresh = insert karne layak, order preserved.
 */
export function splitNewLinks<T extends IncomingLink>(
  existingUrls: string[],
  incoming: T[],
): { fresh: T[]; skipped: number } {
  const seen = new Set(existingUrls.map(normalizeLinkUrl));
  const fresh: T[] = [];
  let skipped = 0;
  for (const link of incoming) {
    const key = normalizeLinkUrl(link.url);
    if (seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    fresh.push(link);
  }
  return { fresh, skipped };
}
