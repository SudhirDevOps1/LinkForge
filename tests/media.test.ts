// =============================================================================
// 📁 Media helper tests — filename safety, categories, formatting
// Run: npx vitest run
// =============================================================================
import { describe, expect, it } from "vitest";
import {
  extensionOf,
  fileCategory,
  formatBytes,
  nameWithoutExtension,
  sanitizeFileName,
} from "@/lib/media";
import { linkCreateSchema } from "@/lib/validations";

describe("sanitizeFileName", () => {
  it("strips directory traversal", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName("..\\..\\secret.pdf")).toBe("secret.pdf");
  });
  it("replaces unsafe characters", () => {
    expect(sanitizeFileName("my <cool> file!.pdf")).toBe("my-cool-file-.pdf");
  });
  it("collapses repeated dashes", () => {
    expect(sanitizeFileName("a   b.pdf")).toBe("a-b.pdf");
  });
  it("truncates long names preserving extension", () => {
    const long = `${"a".repeat(150)}.pdf`;
    const safe = sanitizeFileName(long);
    expect(safe.length).toBeLessThanOrEqual(100);
    expect(safe.endsWith(".pdf")).toBe(true);
  });
  it("falls back to 'file' for empty input", () => {
    expect(sanitizeFileName("")).toBe("file");
    expect(sanitizeFileName("!!!")).toBe("file");
  });
  it("keeps normal names intact", () => {
    expect(sanitizeFileName("Media-Kit_2026.pdf")).toBe("Media-Kit_2026.pdf");
  });
});

describe("fileCategory", () => {
  it("detects images", () => {
    expect(fileCategory("image/png")).toBe("image");
    expect(fileCategory("image/avif")).toBe("image");
  });
  it("detects pdf", () => {
    expect(fileCategory("application/pdf")).toBe("pdf");
  });
  it("detects audio and video", () => {
    expect(fileCategory("audio/mpeg")).toBe("audio");
    expect(fileCategory("video/mp4")).toBe("video");
  });
  it("detects docs and archives", () => {
    expect(fileCategory("text/plain")).toBe("doc");
    expect(
      fileCategory(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe("doc");
    expect(fileCategory("application/zip")).toBe("archive");
  });
  it("falls back to other", () => {
    expect(fileCategory("application/octet-stream")).toBe("other");
  });
});

describe("formatBytes", () => {
  it("formats zero and bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
  });
  it("formats KB/MB/GB", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(10 * 1024 * 1024)).toBe("10 MB");
    expect(formatBytes(2.5 * 1024 ** 3)).toBe("2.5 GB");
  });
  it("handles invalid input", () => {
    expect(formatBytes(-5)).toBe("0 B");
    expect(formatBytes(Number.NaN)).toBe("0 B");
  });
});

describe("extensionOf / nameWithoutExtension", () => {
  it("extracts lowercase extension", () => {
    expect(extensionOf("Report.PDF")).toBe("pdf");
    expect(extensionOf("noext")).toBe("");
  });
  it("strips extension for titles", () => {
    expect(nameWithoutExtension("my-media-kit.pdf")).toBe("my media kit");
    expect(nameWithoutExtension("plain")).toBe("plain");
  });
});

describe("file link type", () => {
  it("accepts type=file with https URL", () => {
    expect(
      linkCreateSchema.safeParse({
        title: "Media kit",
        url: "https://example.com/files/kit.pdf",
        type: "file",
      }).success,
    ).toBe(true);
  });
  it("still rejects javascript: URLs for file type", () => {
    expect(
      linkCreateSchema.safeParse({
        title: "x",
        url: "javascript:alert(1)",
        type: "file",
      }).success,
    ).toBe(false);
  });
});
