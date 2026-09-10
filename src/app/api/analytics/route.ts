// 📊 GET /api/analytics?days=7|30|90 — dashboard summary (owner-only)
import { ApiError, guardRateLimit, handle, json } from "@/lib/api";
import { getAnalyticsSummary } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";

export const GET = handle(async (req: Request) => {
  await guardRateLimit(req, "analytics:read", 60);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");
  const url = new URL(req.url);
  const daysParam = Number(url.searchParams.get("days") ?? 7);
  const days = [7, 30, 90].includes(daysParam) ? daysParam : 7;
  const summary = await getAnalyticsSummary(profile.id, days);
  return json(summary);
});
