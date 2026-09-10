// =============================================================================
// 📝 B2 / Object Storage-Backed Daily Blog Service (Zero Database Bloat)
// -----------------------------------------------------------------------------
// Blog contents (.txt / .md / .html) are stored 100% in Object Storage via
// StorageAdapter (Backblaze B2 in cloud, Local in offline/dev).
// Database is never bloated with heavy article bodies.
// Manifest index is maintained at `blogs/${profileId}/manifest.json`.
// =============================================================================
import { getStorageAdapter } from "./storage";
import { decryptFilePayload, isPayloadEncrypted } from "./file-cipher";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export type BlogFormat = "markdown" | "html" | "txt";

export interface BlogPostHeader {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO date string
  readingTime: string;
  tags: string[];
  format: BlogFormat;
  coverImage?: string;
  fileKey: string;
  updatedAt: string;
}

export interface BlogPostDetail extends BlogPostHeader {
  content: string;
}

export interface BlogManifest {
  profileId: string;
  updatedAt: string;
  posts: BlogPostHeader[];
}

function calculateReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function sanitizeBlogSlug(title: string, userSlug?: string): string {
  const base = (userSlug || title)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `post-${Date.now()}`;
}

/**
 * Resolve profile ID and Slug from DB to support transparent dual lookup
 */
async function resolveProfileIdentifiers(identifier: string): Promise<{ id: string; slug: string } | null> {
  try {
    const clean = (identifier || "").toLowerCase().trim();
    const prof = await db.query.profiles.findFirst({
      where: or(eq(profiles.id, identifier), eq(profiles.slug, clean)),
      columns: { id: true, slug: true },
    });
    return prof ? { id: prof.id, slug: prof.slug } : null;
  } catch {
    return null;
  }
}

export async function getBlogManifest(profileIdentifier: string): Promise<BlogManifest> {
  const adapter = await getStorageAdapter();
  const cleanId = (profileIdentifier || "").trim();

  // Helper to read manifest from storage key
  async function readKey(key: string): Promise<BlogManifest | null> {
    try {
      const obj = await adapter.getObject(key);
      if (!obj || !obj.data) return null;
      let rawData = obj.data;
      if (isPayloadEncrypted(rawData)) {
        rawData = decryptFilePayload(rawData);
      }
      const parsed = JSON.parse(rawData.toString("utf8")) as BlogManifest;
      return parsed && Array.isArray(parsed.posts) ? parsed : null;
    } catch {
      return null;
    }
  }

  // 1. Check direct path
  let manifest = await readKey(`blogs/${cleanId}/manifest.json`);
  if (manifest && manifest.posts && manifest.posts.length > 0) {
    return manifest;
  }

  // 2. Check alternative identifier (ID vs Slug) from DB
  const pair = await resolveProfileIdentifiers(cleanId);
  if (pair) {
    const altKey = pair.id === cleanId ? pair.slug : pair.id;
    const altManifest = await readKey(`blogs/${altKey}/manifest.json`);
    if (altManifest && altManifest.posts && altManifest.posts.length > 0) {
      return altManifest;
    }
  }

  return manifest || { profileId: cleanId, updatedAt: new Date().toISOString(), posts: [] };
}

export async function saveBlogPost(
  profileId: string,
  input: {
    title: string;
    content: string;
    slug?: string;
    excerpt?: string;
    tags?: string[];
    format?: BlogFormat;
    coverImage?: string;
  },
  knownSlug?: string,
): Promise<BlogPostHeader> {
  const adapter = await getStorageAdapter();
  const slug = sanitizeBlogSlug(input.title, input.slug);
  const format: BlogFormat = input.format || "markdown";
  const ext = format === "html" ? "html" : format === "txt" ? "txt" : "md";
  const fileKey = `blogs/${profileId}/${slug}.${ext}`;
  const contentType = format === "html" ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8";

  // 1. Upload blog content directly to Object Storage (zero database bloat)
  await adapter.putObject(fileKey, Buffer.from(input.content, "utf8"), contentType);

  // 2. Generate excerpt and reading time
  const plainText = input.content.replace(/<[^>]+>/g, "").replace(/[#*`_~\[\]]/g, "");
  const excerpt =
    input.excerpt?.trim() ||
    (plainText.length > 200 ? `${plainText.slice(0, 197)}...` : plainText) ||
    "No excerpt provided.";
  const readingTime = calculateReadingTime(plainText);
  const now = new Date().toISOString();

  const header: BlogPostHeader = {
    slug,
    title: input.title.trim(),
    excerpt,
    date: now,
    readingTime,
    tags: (input.tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean),
    format,
    coverImage: input.coverImage?.trim() || undefined,
    fileKey,
    updatedAt: now,
  };

  // 3. Update manifest
  const manifest = await getBlogManifest(profileId);
  const existingIdx = manifest.posts.findIndex((p) => p.slug === slug);
  if (existingIdx >= 0) {
    header.date = manifest.posts[existingIdx].date; // preserve original publish date
    manifest.posts[existingIdx] = header;
  } else {
    manifest.posts.unshift(header);
  }
  manifest.updatedAt = now;
  manifest.profileId = profileId;

  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");

  // Save to primary manifest key
  await adapter.putObject(
    `blogs/${profileId}/manifest.json`,
    manifestBuffer,
    "application/json; charset=utf-8",
  );

  // 4. Resolve slug and mirror manifest & post content for 100% resilient lookup & B2 console visibility
  let altSlug = knownSlug;
  if (!altSlug) {
    const pair = await resolveProfileIdentifiers(profileId);
    altSlug = pair?.slug;
  }

  if (altSlug && altSlug !== profileId) {
    try {
      await adapter.putObject(
        `blogs/${altSlug}/manifest.json`,
        manifestBuffer,
        "application/json; charset=utf-8",
      );
      await adapter.putObject(
        `blogs/${altSlug}/${slug}.${ext}`,
        Buffer.from(input.content, "utf8"),
        contentType,
      );
    } catch {
      // Non-critical mirror
    }
  }

  return header;
}

export async function getBlogPost(profileIdentifier: string, slug: string): Promise<BlogPostDetail | null> {
  const manifest = await getBlogManifest(profileIdentifier);
  const header = manifest.posts.find((p) => p.slug === slug);
  if (!header) return null;

  const adapter = await getStorageAdapter();
  try {
    const obj = await adapter.getObject(header.fileKey);
    if (obj && obj.data) {
      let rawData = obj.data;
      if (isPayloadEncrypted(rawData)) {
        rawData = decryptFilePayload(rawData);
      }
      return { ...header, content: rawData.toString("utf8") };
    }
  } catch (err) {
    console.error(`[blog] Failed to fetch primary content for ${header.fileKey}:`, err);
  }

  // Fallback check if fileKey was keyed by slug instead of ID or vice versa
  const pair = await resolveProfileIdentifiers(profileIdentifier);
  if (pair) {
    const altTarget = pair.id === profileIdentifier ? pair.slug : pair.id;
    const ext = header.format === "html" ? "html" : header.format === "txt" ? "txt" : "md";
    const altKey = `blogs/${altTarget}/${slug}.${ext}`;
    try {
      const obj = await adapter.getObject(altKey);
      if (obj && obj.data) {
        let rawData = obj.data;
        if (isPayloadEncrypted(rawData)) {
          rawData = decryptFilePayload(rawData);
        }
        return { ...header, fileKey: altKey, content: rawData.toString("utf8") };
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export async function deleteBlogPost(profileIdentifier: string, slug: string): Promise<boolean> {
  const manifest = await getBlogManifest(profileIdentifier);
  const header = manifest.posts.find((p) => p.slug === slug);
  if (!header) return false;

  const adapter = await getStorageAdapter();
  try {
    await adapter.deleteObject(header.fileKey);
  } catch (err) {
    console.warn(`[blog] Failed to delete file ${header.fileKey}:`, err);
  }

  manifest.posts = manifest.posts.filter((p) => p.slug !== slug);
  manifest.updatedAt = new Date().toISOString();

  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");

  await adapter.putObject(
    `blogs/${manifest.profileId}/manifest.json`,
    manifestBuffer,
    "application/json; charset=utf-8",
  );

  const pair = await resolveProfileIdentifiers(profileIdentifier);
  if (pair && pair.slug && pair.slug !== manifest.profileId) {
    try {
      await adapter.putObject(
        `blogs/${pair.slug}/manifest.json`,
        manifestBuffer,
        "application/json; charset=utf-8",
      );
      const ext = header.format === "html" ? "html" : header.format === "txt" ? "txt" : "md";
      await adapter.deleteObject(`blogs/${pair.slug}/${slug}.${ext}`);
    } catch {
      // ignore
    }
  }

  return true;
}
