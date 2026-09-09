// =============================================================================
// 🩹 NEXT-PATCH Phase C tests — media validation (pure unit, no DB/storage)
// Run: npx vitest run tests/patch-c.test.ts
// =============================================================================
import { describe, expect, it } from "vitest";
import {
  completeSchema,
  presignSchema,
} from "@/lib/validations";
import {
  extensionMatchesMime,
  isAllowedMime,
  isTicketExpired,
  mimeForExtension,
  parseRangeHeader,
} from "@/lib/upload-validation";

describe("C7 ext↔MIME map", () => {
  it("known extensions resolve", () => {
    expect(mimeForExtension("pdf")).toBe("application/pdf");
    expect(mimeForExtension("JPG")).toBe("image/jpeg");
    expect(mimeForExtension("exe")).toBeNull();
    expect(mimeForExtension("svg")).toBeNull();
  });
  it("allowlist blocks executables/scripts/svg", () => {
    expect(isAllowedMime("application/x-msdownload")).toBe(false);
    expect(isAllowedMime("image/svg+xml")).toBe(false);
    expect(isAllowedMime("image/png")).toBe(true);
    expect(isAllowedMime("application/pdf")).toBe(true);
  });
  it("extension must match mime (spoof guard)", () => {
    expect(extensionMatchesMime("photo.png", "image/png")).toBe(true);
    expect(extensionMatchesMime("photo.jpg", "image/png")).toBe(false);
    expect(extensionMatchesMime("noext", "image/png")).toBe(false);
  });
});

describe("C5 Range parse", () => {
  it("full prefix range", () => {
    expect(parseRangeHeader("bytes=0-1023", 5000)).toEqual({ start: 0, end: 1023 });
  });
  it("open-ended clamps to size", () => {
    expect(parseRangeHeader("bytes=4000-", 5000)).toEqual({ start: 4000, end: 4999 });
  });
  it("suffix range = last N bytes", () => {
    expect(parseRangeHeader("bytes=-500", 5000)).toEqual({ start: 4500, end: 4999 });
  });
  it("invalid → null (416)", () => {
    expect(parseRangeHeader("bytes=9000-9999", 5000)).toBeNull();
    expect(parseRangeHeader("bytes=5-2", 5000)).toBeNull();
    expect(parseRangeHeader("items=0-1", 5000)).toBeNull();
    expect(parseRangeHeader(null, 5000)).toBeNull();
  });
});

describe("C2 ticket expiry + schemas", () => {
  it("expired tickets detected", () => {
    expect(isTicketExpired(new Date(Date.now() - 1000))).toBe(true);
    expect(isTicketExpired(new Date(Date.now() + 60_000))).toBe(false);
  });
  it("presign schema validates shape", () => {
    expect(
      presignSchema.safeParse({ fileName: "a.pdf", mime: "application/pdf", size: 100 }).success,
    ).toBe(true);
    expect(
      presignSchema.safeParse({ fileName: "a.pdf", mime: "application/pdf", size: 0 }).success,
    ).toBe(false);
  });
  it("complete schema needs uuid", () => {
    expect(completeSchema.safeParse({ ticketId: "nope" }).success).toBe(false);
    expect(
      completeSchema.safeParse({ ticketId: "123e4567-e89b-12d3-a456-426614174000" }).success,
    ).toBe(true);
  });
});
