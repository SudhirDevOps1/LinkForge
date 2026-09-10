// =============================================================================
// 📝 B2 / Object Storage-Backed Daily Blog Service (Zero Database Bloat)
// -----------------------------------------------------------------------------
// As per architecture requirement: Blog contents (.txt / .md / .html) are
// stored 100% in Backblaze B2 / Object Storage via StorageAdapter.
// Neon PostgreSQL is never bloated with heavy article bodies.
// Manifest index is maintained at `blogs/${profileId}/manifest.json`.
// =============================================================================
import { getStorageAdapter } from "./storage";

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

export async function getBlogManifest(profileId: string): Promise<BlogManifest> {
  const adapter = await getStorageAdapter();
  const manifestKey = `blogs/${profileId}/manifest.json`;

  try {
    const obj = await adapter.getObject(manifestKey);
    if (!obj || !obj.data) {
      return { profileId, updatedAt: new Date().toISOString(), posts: [] };
    }
    const parsed = JSON.parse(obj.data.toString("utf8")) as BlogManifest;
    return parsed && Array.isArray(parsed.posts) ? parsed : { profileId, updatedAt: new Date().toISOString(), posts: [] };
  } catch (err) {
    console.warn(`[blog] Failed to read manifest for ${profileId}, returning empty:`, (err as Error).message);
    return { profileId, updatedAt: new Date().toISOString(), posts: [] };
  }
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
): Promise<BlogPostHeader> {
  const adapter = await getStorageAdapter();
  const slug = sanitizeBlogSlug(input.title, input.slug);
  const format: BlogFormat = input.format || "markdown";
  const ext = format === "html" ? "html" : format === "txt" ? "txt" : "md";
  const fileKey = `blogs/${profileId}/${slug}.${ext}`;
  const contentType = format === "html" ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8";

  // 1. Upload blog content directly to B2 / Object Storage (zero Neon DB bloat)
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

  // 3. Update manifest in B2 / Object Storage
  const manifest = await getBlogManifest(profileId);
  const existingIdx = manifest.posts.findIndex((p) => p.slug === slug);
  if (existingIdx >= 0) {
    header.date = manifest.posts[existingIdx].date; // preserve original publish date
    manifest.posts[existingIdx] = header;
  } else {
    manifest.posts.unshift(header);
  }
  manifest.updatedAt = now;

  await adapter.putObject(
    `blogs/${profileId}/manifest.json`,
    Buffer.from(JSON.stringify(manifest, null, 2), "utf8"),
    "application/json; charset=utf-8",
  );

  return header;
}

export async function getBlogPost(profileId: string, slug: string): Promise<BlogPostDetail | null> {
  const manifest = await getBlogManifest(profileId);
  const header = manifest.posts.find((p) => p.slug === slug);
  if (!header) return null;

  const adapter = await getStorageAdapter();
  try {
    const obj = await adapter.getObject(header.fileKey);
    if (!obj || !obj.data) return null;
    const content = obj.data.toString("utf8");
    return { ...header, content };
  } catch (err) {
    console.error(`[blog] Failed to fetch content for ${header.fileKey}:`, err);
    return null;
  }
}

export async function deleteBlogPost(profileId: string, slug: string): Promise<boolean> {
  const manifest = await getBlogManifest(profileId);
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

  await adapter.putObject(
    `blogs/${profileId}/manifest.json`,
    Buffer.from(JSON.stringify(manifest, null, 2), "utf8"),
    "application/json; charset=utf-8",
  );

  return true;
}
