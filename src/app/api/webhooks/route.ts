// 🪝 /api/webhooks — GET (list) / POST (create) — owner-only
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { webhooks } from "@/db/schema";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { randomToken } from "@/lib/crypto";
import { webhookSchema } from "@/lib/validations";

export const GET = handle(async () => {
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");
  const rows = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.profileId, profile.id))
    .orderBy(desc(webhooks.createdAt));
  return json({
    webhooks: rows.map((w) => ({
      id: w.id,
      url: w.url,
      events: w.events.split(",").map((e) => e.trim()),
      isActive: w.isActive,
      secretPreview: `${w.secret.slice(0, 6)}…`,
      createdAt: w.createdAt,
    })),
  });
});

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "webhooks:write", 30);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");
  const input = parseOrThrow(webhookSchema, await req.json().catch(() => ({})));

  const [created] = await db
    .insert(webhooks)
    .values({
      id: crypto.randomUUID(),
      profileId: profile.id,
      url: input.url,
      events: input.events.join(","),
      secret: randomToken(16), // HMAC signing secret (ek baar full dikhta hai)
      isActive: input.isActive,
    })
    .returning();
  return json({ webhook: created }, { status: 201 }); // full secret sirf is response me
});
