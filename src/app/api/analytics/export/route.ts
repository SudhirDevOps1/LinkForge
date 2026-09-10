import { and, asc, eq, gte } from "drizzle-orm";
import { gzipSync } from "zlib";
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
  const days = [7, 14, 30, 90].includes(daysParam) ? daysParam : 30;
  const format = (url.searchParams.get("format") ?? "csv").toLowerCase();
  const since = new Date(Date.now() - days * 86_400_000);

  const [rows, profileLinks] = await Promise.all([
    db
      .select()
      .from(events)
      .where(and(eq(events.profileId, profile.id), gte(events.createdAt, since)))
      .orderBy(asc(events.createdAt))
      .limit(50000),
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

  // 1. DuckDB / BigQuery newline-delimited JSON compressed (ndjson.gz)
  if (format === "ndjson.gz" || format === "json.gz") {
    const jsonLines = rows
      .map((r) => {
        const link = r.linkId ? linkMap.get(r.linkId) : undefined;
        return JSON.stringify({
          timestamp: r.createdAt.toISOString(),
          type: r.type,
          link_title: link?.title ?? null,
          link_url: link?.url ?? null,
          referrer: r.referrer,
          country: r.country,
          device: r.device,
          browser: r.browser,
          os: r.os,
        });
      })
      .join("\n");

    const compressed = gzipSync(Buffer.from(jsonLines, "utf-8"));
    return new Response(new Uint8Array(compressed), {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="linkforge-duckdb-${profile.slug}-${days}d.ndjson.gz"`,
      },
    });
  }

  // 2. High-compression GZIP CSV (csv.gz — 85% smaller)
  if (format === "csv.gz" || format === "gz") {
    const compressed = gzipSync(Buffer.from(csv, "utf-8"));
    return new Response(new Uint8Array(compressed), {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="linkforge-analytics-${profile.slug}-${days}d.csv.gz"`,
      },
    });
  }

  // 3. DuckDB SQL Setup Script
  if (format === "duckdb" || format === "sql") {
    const duckdbSql = `-- LinkForge DuckDB Analytics Loader for @${profile.slug}\n-- Run in DuckDB CLI: duckdb < analytics-${profile.slug}.sql\n\nCREATE OR REPLACE TABLE events AS \nSELECT * FROM read_csv_auto('linkforge-analytics-${profile.slug}-${days}d.csv.gz');\n\n-- 1. Daily Totals\nSELECT strftime(to_timestamp(timestamp), '%Y-%m-%d') as date, type, count(*) as count\nFROM events\nGROUP BY 1, 2\nORDER BY 1 DESC;\n\n-- 2. Top Countries with CTR\nSELECT country, count(*) FILTER (WHERE type = 'view') as views, count(*) FILTER (WHERE type = 'click') as clicks\nFROM events\nWHERE country != ''\nGROUP BY country\nORDER BY views DESC\nLIMIT 10;\n`;
    return new Response(duckdbSql, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="linkforge-duckdb-loader-${profile.slug}.sql"`,
      },
    });
  }

  // 4. Default uncompressed CSV
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="linkforge-analytics-${profile.slug}-${days}d.csv"`,
    },
  });
});

