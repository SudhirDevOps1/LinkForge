import { db } from "@/db";
import { profiles } from "@/db/schema";
import { json } from "@/lib/api";
import { RESERVED_SLUGS, slugSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawSlug = (searchParams.get("slug") || "").trim().toLowerCase();

  if (!rawSlug) {
    return json({ available: false, error: "Slug is required" }, { status: 400 });
  }

  const parseResult = slugSchema.safeParse(rawSlug);
  if (!parseResult.success) {
    return json({
      available: false,
      slug: rawSlug,
      reason: parseResult.error.issues[0]?.message || "Invalid slug format (3-39 chars, alphanumeric & hyphens)",
    });
  }

  const slug = parseResult.data;

  if (RESERVED_SLUGS.has(slug)) {
    return json({
      available: false,
      slug,
      reason: "This username is reserved for system routes",
    });
  }

  try {
    const existing = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      return json({
        available: false,
        slug,
        reason: "Already claimed by another creator",
      });
    }

    return json({
      available: true,
      slug,
      reason: "Available! Free forever",
    });
  } catch (err) {
    console.error("[username-check] error:", err);
    return json({
      available: true,
      slug,
      reason: "Available! Free forever",
    });
  }
}
