// =============================================================================
// 📊 CSV — formula-injection-safe builder (analytics export)
// OWASP: cells starting with = + - @ (or tab/CR) can execute in Excel/Sheets.
// Mitigation: prefix with single-quote + standard RFC-4180 quoting.
// Pure functions (unit-testable).
// =============================================================================

const FORMULA_PREFIX = ["=", "+", "-", "@", "\t", "\r"];

/** Single cell → safe CSV (formula prefix + quote escaping) */
export function csvCell(value: string | number | null | undefined): string {
  let s = String(value ?? "");
  // Formula cells: leading ' forces text-mode in Excel/Sheets, then quote normally
  if (s.length > 0 && FORMULA_PREFIX.includes(s[0] as string)) {
    s = `'${s}`;
  }
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Rows → CSV text (header + lines, \n separated) */
export function buildCsv(header: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const esc = (cells: Array<string | number | null | undefined>) => cells.map(csvCell).join(",");
  return [header.join(","), ...rows.map(esc)].join("\n");
}
