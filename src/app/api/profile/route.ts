// 🪪 /api/profile — current user ki profile GET / PATCH
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getTheme } from "@/lib/themes";
import { RESERVED_SLUGS, profileUpdateSchema } from "@/lib/validations";

export const GET = handle(async () => {
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");
  return json({ profile });
});

export const PATCH = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "profile:update", 60);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");
  const input = parseOrThrow(profileUpdateSchema, await req.json().catch(() => ({})));

  // Theme valid hai ya nahi
  if (input.theme && !getTheme(input.theme)) {
    throw new ApiError(400, "Unknown theme");
  }

  // Slug uniqueness — apne alawa kisi aur ka slug nahi hona chahiye
  if (input.slug && input.slug !== profile.slug) {
    if (RESERVED_SLUGS.has(input.slug)) {
      throw new ApiError(409, "Yeh slug reserved hai — koi aur try karein");
    }
    const taken = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(eq(profiles.slug, input.slug), ne(profiles.id, profile.id)))
      .limit(1);
    if (taken.length > 0) throw new ApiError(409, "Yeh slug pehle se liya ja chuka hai");
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    // empty string → null cleanup for optional nullable fields
    if (["avatarUrl", "customDomain", "seoTitle", "seoDescription", "ogImageUrl"].includes(key)) {
      patch[key] = value === "" ? null : value;
    } else {
      patch[key] = value;
    }
  }

  const [updated] = await db
    .update(profiles)
    .set(patch)
    .where(eq(profiles.id, profile.id))
    .returning();
  return json({ profile: updated });
});
