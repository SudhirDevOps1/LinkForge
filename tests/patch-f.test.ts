// =============================================================================
// 🩹 NEXT-PATCH Phase F tests — design clamp, CSV safety, github drafts
// Run: npx vitest run tests/patch-f.test.ts
// =============================================================================
import { describe, expect, it } from "vitest";
import { buildCsv, csvCell } from "@/lib/csv";
import { clampDesign, parseDesign } from "@/lib/design";
import { repoToLinkDraft } from "@/lib/github";
import { BRAND_IDS } from "@/components/icons";

describe("F1 design clamp", () => {
  it("accepts valid prefs", () => {
    expect(clampDesign({ accent: "#8b5cf6", radiusPx: 12, fontScale: 1.05, iconSize: 24 })).toEqual({
      accent: "#8b5cf6",
      radiusPx: 12,
      fontScale: 1.05,
      iconSize: 24,
    });
  });
  it("rejects bad accent, clamps ranges", () => {
    expect(clampDesign({ accent: "red", radiusPx: 99, fontScale: 5, iconSize: 4 })).toEqual({
      radiusPx: 28,
      fontScale: 1.25,
      iconSize: 16,
    });
  });
  it("parseDesign: null/empty → null", () => {
    expect(parseDesign(null)).toBeNull();
    expect(parseDesign({})).toBeNull();
    expect(parseDesign({ accent: "#ffffff" })).toEqual({ accent: "#ffffff" });
  });
});

describe("F2 CSV formula-injection guard", () => {
  it("prefixes = + - @ cells (leading ' forces text-mode)", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("+cmd")).toBe("'+cmd");
    expect(csvCell("-2-3")).toBe("'-2-3");
    expect(csvCell("@evil")).toBe("'@evil");
    // structural chars ke saath bhi prefix pehle, phir quoting
    expect(csvCell("=1,1")).toBe("\"'=1,1\"");
  });
  it("normal cells untouched, quotes escaped", () => {
    expect(csvCell("hello")).toBe("hello");
    expect(csvCell("a,b")).toBe("\"a,b\"");
    expect(csvCell('say "hi"')).toBe("\"say \"\"hi\"\"\"");
    expect(csvCell("O'Brien")).toBe("O'Brien");
  });
  it("buildCsv joins header + rows", () => {
    expect(buildCsv(["a", "b"], [["x", "=1"]])).toBe("a,b\nx,'=1");
  });
});

describe("F3 github repo drafts + brand coverage", () => {
  it("repoToLinkDraft maps fields", () => {
    const d = repoToLinkDraft(
      { name: "LinkForge", description: "Bio builder", language: "TypeScript", stars: 5, htmlUrl: "https://github.com/x/LinkForge", updatedAt: "2026-01-01" },
      2,
    );
    expect(d).toMatchObject({ title: "LinkForge", url: "https://github.com/x/LinkForge", icon: "github", type: "github", position: 2 });
    expect(d.description).toContain("TypeScript");
  });
  it("29 real brands incl. github", () => {
    expect(BRAND_IDS.length).toBeGreaterThanOrEqual(29);
    expect(BRAND_IDS).toContain("github");
  });
});
