// 📥 /api/integrations/import — universal batch import endpoint
// Imports playlist videos, course chapters, RSS articles, Spotify albums, digital products.
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { links } from "@/db/schema";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { LINK_SIZES, LINK_TYPES } from "@/lib/validations";

const batchImportSchema = z.object({
  links: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        url: z.string().trim().min(1).max(1000),
        description: z.string().trim().max(500).optional().default(""),
        icon: z.string().trim().max(100).optional().default("link"),
        type: z.enum(LINK_TYPES).optional().default("link"),
        size: z.enum(LINK_SIZES).optional().default("standard"),
        thumbnailUrl: z.string().nullable().optional(),
      }),
    )
    .min(1)
    .max(100),
});

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "integrations:import", 20);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");

  const body = parseOrThrow(batchImportSchema, await req.json().catch(() => ({})));

  // Existing links check
  const existing = await db
    .select({ url: links.url, position: links.position })
    .from(links)
    .where(eq(links.profileId, profile.id))
    .orderBy(asc(links.position));

  const existingUrls = new Set(existing.map((l) => l.url.trim().toLowerCase()));
  const basePosition = existing.length > 0 ? Math.max(...existing.map((l) => l.position)) + 1 : 0;

  const fresh = body.links.filter((l) => !existingUrls.has(l.url.trim().toLowerCase()));
  const skipped = body.links.length - fresh.length;

  if (fresh.length > 0) {
    await db.insert(links).values(
      fresh.map((item, idx) => ({
        id: crypto.randomUUID(),
        profileId: profile.id,
        title: item.title,
        url: item.url,
        description: item.description ?? "",
        icon: item.icon ?? "link",
        type: item.type ?? "link",
        size: item.size ?? "standard",
        thumbnailUrl: item.thumbnailUrl || null,
        position: basePosition + idx,
        isActive: true,
      })),
    );
  }

  return json({
    ok: true,
    importedCount: fresh.length,
    skippedCount: skipped,
  });
});
