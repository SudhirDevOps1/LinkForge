// 📥 GET /api/analytics/export?days=30 — events CSV download (owner-only)
// Formula-injection-safe (lib/csv.ts) + Excel/Sheets RFC-4180 quoting.
import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { events, links } from "@/db/schema";
import { ApiError, guardRateLimit, handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { buildCsv } from "@/lib/csv";

export const GET = handle(async (req: Request) => {
  await guardRateLimit(req, "analytics:export", 10);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");
  const url = new URL(req.url);
  const daysParam = Number(url.searchParams.get("days") ?? 30);
  const days = [7, 30, 90].includes(daysParam) ? daysParam : 30;
  const since = new Date(Date.now() - days * 86_400_000);

  const [rows, profileLinks] = await Promise.all([
    db
      .select()
      .from(events)
      .where(and(eq(events.profileId, profile.id), gte(events.createdAt, since)))
      .orderBy(asc(events.createdAt))
      .limit(20000),
    db
      .select({ id: links.id, title: links.title, url: links.url })
      .from(links)
      .where(eq(links.profileId, profile.id)),
  ]);
  const linkMap = new Map(profileLinks.map((l) => [l.id, l]));

  const header = [
    "timestamp",
    "type",
    "link_title",
    "link_url",
    "referrer",
    "country",
    "device",
    "browser",
    "os",
  ];
  const lines = rows.map((r) => {
    const link = r.linkId ? linkMap.get(r.linkId) : undefined;
    return [
      r.createdAt.toISOString(),
      r.type,
      link?.title ?? "",
      link?.url ?? "",
      r.referrer,
      r.country,
      r.device,
      r.browser,
      r.os,
    ];
  });

  const csv = buildCsv(header, lines);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="linkforge-analytics-${profile.slug}-${days}d.csv"`,
    },
  });
});
