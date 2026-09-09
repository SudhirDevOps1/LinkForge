// 🔗 /api/links — profile ke links: GET (list) / POST (create)
import { asc, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { links } from "@/db/schema";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { linkCreateSchema } from "@/lib/validations";

export const GET = handle(async () => {
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");
  const rows = await db
    .select()
    .from(links)
    .where(eq(links.profileId, profile.id))
    .orderBy(asc(links.position));
  return json({ links: rows });
});

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "links:create", 60);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");
  const input = parseOrThrow(linkCreateSchema, await req.json().catch(() => ({})));

  // Naya link sabse neeche (max position + 1)
  const [agg] = await db
    .select({ max: max(links.position) })
    .from(links)
    .where(eq(links.profileId, profile.id));
  const position = (agg?.max ?? -1) + 1;

  const [created] = await db
    .insert(links)
    .values({
      id: crypto.randomUUID(),
      profileId: profile.id,
      title: input.title,
      url: input.url,
      description: input.description ?? "",
      icon: input.icon ?? "link",
      type: input.type ?? "link",
      size: input.size ?? "standard",
      position,
      thumbnailUrl: input.thumbnailUrl || null,
    })
    .returning();
  return json({ link: created }, { status: 201 });
});
