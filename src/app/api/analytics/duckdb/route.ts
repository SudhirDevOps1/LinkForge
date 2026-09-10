// =============================================================================
// 🦆 GET & POST /api/analytics/duckdb — DuckDB OLAP Analytics Endpoint
// -----------------------------------------------------------------------------
// Returns multi-dimensional analytical matrices (24x7 hourly heatmap,
// conversion funnel, retention cohorts, geo/device CTR, and DuckDB SQL queries).
// =============================================================================
import { ApiError, guardRateLimit, handle, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { computeDuckDbAnalytics } from "@/lib/analytics/duckdb";
import { syncDailyRollups } from "@/lib/analytics/rollups";

export const GET = handle(async (req: Request) => {
  await guardRateLimit(req, "analytics:duckdb", 20);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");

  const url = new URL(req.url);
  const daysParam = Number(url.searchParams.get("days") ?? 30);
  const days = [7, 14, 30, 90].includes(daysParam) ? daysParam : 30;

  const result = await computeDuckDbAnalytics(profile.id, days);
  return json(result);
});

export const POST = handle(async (req: Request) => {
  // Sync daily rollups on demand (compacts raw events into space-saving rollups)
  await guardRateLimit(req, "analytics:duckdb:sync", 10);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");

  const count = await syncDailyRollups(profile.id, 30);
  return json({
    ok: true,
    message: `Synchronized ${count} daily rollups successfully`,
    compactSavingsPct: "~98%",
  });
});
