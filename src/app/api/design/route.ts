// 🎨 GET/PATCH /api/design — manual custom design (accent/radius/font/icons)
// Theme/layout PATCH /api/profile par rehte hain; yeh layer uske upar override
// hai (profiles.design JSON, nullable). NULL = theme defaults.
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import {
  ApiError,
  assertSameOrigin,
  guardRateLimit,
  handle,
  json,
  parseOrThrow,
} from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { clampDesign, parseDesign } from "@/lib/design";
import { designPrefsSchema } from "@/lib/validations";

export const GET = handle(async () => {
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");
  return json({ design: parseDesign(profile.design) });
});

export const PATCH = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "design:save", 30);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");
  const prefs = parseOrThrow(designPrefsSchema, await req.json().catch(() => ({})));
  // Merge (existing keys preserve) + server-side clamp — client bypass safe
  const merged = clampDesign({ ...(parseDesign(profile.design) ?? {}), ...prefs });
  const [updated] = await db
    .update(profiles)
    .set({ design: Object.keys(merged).length > 0 ? merged : null, updatedAt: new Date() })
    .where(eq(profiles.id, profile.id))
    .returning({ design: profiles.design });
  return json({ ok: true, design: parseDesign(updated?.design) });
});
