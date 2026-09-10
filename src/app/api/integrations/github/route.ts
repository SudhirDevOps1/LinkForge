// 🐙 /api/integrations/github — live preview + additive import
// GET  ?username=X&limit=20 → public profile + top repos (no DB write)
// POST { username, repos: string[] } → selected repos links me merge
// (splitNewLinks: duplicates skip, manual links safe). Koi delete nahi.
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { links } from "@/db/schema";
import {
  ApiError,
  assertSameOrigin,
  guardRateLimit,
  handle,
  json,
  parseOrThrow,
} from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { fetchGithubProfile, fetchGithubRepos, repoToLinkDraft } from "@/lib/github";
import { splitNewLinks } from "@/lib/import-merge";

const previewSchema = z.object({
  username: z.string().trim().min(1).max(39),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

const importBodySchema = z.object({
  username: z.string().trim().min(1).max(39),
  repos: z.array(z.string().trim().min(1).max(200)).min(1).max(50),
});

export const GET = handle(async (req: Request) => {
  await guardRateLimit(req, "github:preview", 20);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");
  const url = new URL(req.url);
  const { username, limit } = parseOrThrow(previewSchema, {
    username: url.searchParams.get("username") ?? "",
    limit: url.searchParams.get("limit") ?? undefined,
  });
  const [ghProfile, repos] = await Promise.all([
    fetchGithubProfile(username),
    fetchGithubRepos(username, limit),
  ]);
  return json({ profile: ghProfile, repos });
});

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "github:import", 10);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");
  const { username, repos } = parseOrThrow(importBodySchema, await req.json().catch(() => ({})));

  const all = await fetchGithubRepos(username, 50);
  const wanted = new Set(repos);
  const drafts = all
    .filter((r) => wanted.has(r.name))
    .map((r, i) => repoToLinkDraft(r, i));

  const existing = await db
    .select({ url: links.url, position: links.position })
    .from(links)
    .where(eq(links.profileId, profile.id))
    .orderBy(asc(links.position));
  const base = existing.length > 0 ? Math.max(...existing.map((r) => r.position)) + 1 : 0;
  const { fresh, skipped } = splitNewLinks(
    existing.map((r) => r.url),
    drafts,
  );
  if (fresh.length > 0) {
    await db.insert(links).values(
      fresh.map((l, i) => ({
        id: crypto.randomUUID(),
        profileId: profile.id,
        title: l.title,
        url: l.url,
        description: l.description ?? "",
        icon: "github",
        type: "github",
        size: "standard",
        position: base + i,
        isActive: true,
      })),
    );
  }
  return json({ ok: true, linksImported: fresh.length, linksSkipped: skipped });
});
