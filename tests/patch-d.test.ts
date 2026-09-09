// =============================================================================
// 🩹 NEXT-PATCH Phase D tests — import merge (pure unit, no DB)
// Run: npx vitest run tests/patch-d.test.ts
// =============================================================================
import { describe, expect, it } from "vitest";
import { normalizeLinkUrl, splitNewLinks } from "@/lib/import-merge";
import { importSchema } from "@/lib/validations";

describe("D1 URL normalize", () => {
  it("trailing slash + case insensitive", () => {
    expect(normalizeLinkUrl("https://Example.com/x/")).toBe(normalizeLinkUrl("https://example.com/x"));
  });
  it("different paths differ", () => {
    expect(normalizeLinkUrl("https://example.com/a")).not.toBe(normalizeLinkUrl("https://example.com/b"));
  });
});

describe("D1 splitNewLinks (merge, idempotent)", () => {
  const existing = ["https://example.com/a", "https://example.com/b"];
  it("skips duplicates, keeps order", () => {
    const incoming = [
      { url: "https://example.com/b" },
      { url: "https://example.com/c" },
      { url: "https://example.com/c/" }, // trailing-slash variant = same
      { url: "HTTPS://EXAMPLE.COM/C" }, // NOTE: path case-sensitive → alag page, fresh
    ];
    const { fresh, skipped } = splitNewLinks(existing, incoming);
    expect(fresh.map((l) => l.url)).toEqual(["https://example.com/c", "HTTPS://EXAMPLE.COM/C"]);
    expect(skipped).toBe(2);
  });
  it("re-import fully idempotent (second run = 0 fresh)", () => {
    const incoming = [{ url: "https://example.com/a" }, { url: "https://example.com/b" }];
    const { fresh, skipped } = splitNewLinks(existing, incoming);
    expect(fresh).toEqual([]);
    expect(skipped).toBe(2);
  });
  it("empty existing = all fresh", () => {
    const { fresh, skipped } = splitNewLinks([], [{ url: "https://x.com/1" }]);
    expect(fresh.length).toBe(1);
    expect(skipped).toBe(0);
  });
});

describe("D2 import schema design passthrough", () => {
  const base = {
    version: 1 as const,
    profile: { displayName: "Test" },
    links: [],
  };
  it("old payloads (no design) still valid", () => {
    expect(importSchema.safeParse(base).success).toBe(true);
  });
  it("design block accepted", () => {
    const parsed = importSchema.safeParse({
      ...base,
      design: { theme: "midnight", layout: "bento" },
    });
    expect(parsed.success).toBe(true);
  });
  it("bad design layout rejected", () => {
    const parsed = importSchema.safeParse({
      ...base,
      design: { layout: "grid" },
    });
    expect(parsed.success).toBe(false);
  });
});
