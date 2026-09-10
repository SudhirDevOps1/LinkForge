// =============================================================================
// 🦆 DuckDB OLAP Analytical Engine & SQL Generator
// -----------------------------------------------------------------------------
// High-performance columnar and multi-dimensional analysis over link events.
// Supports in-memory OLAP metrics, 24x7 hourly heatmap, retention cohorts,
// conversion funnels, and DuckDB/MotherDuck/Parquet compatible SQL query generation.
// =============================================================================
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { events, links, type AnalyticsEvent } from "@/db/schema";

export interface HourlyHeatmapCell {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayName: string;
  hour: number; // 0 .. 23
  views: number;
  clicks: number;
  total: number;
}

export interface FunnelStep {
  step: string;
  count: number;
  conversionRate: number; // percentage
  dropoffRate: number; // percentage
}

export interface RetentionCohort {
  totalVisitors: number;
  singleVisitVisitors: number;
  returningVisitors: number;
  returningRate: number; // percentage
}

export interface DuckDbAnalyticsResult {
  summary: {
    days: number;
    since: string;
    totalEvents: number;
    views: number;
    clicks: number;
    uniqueVisitors: number;
    overallCtr: number;
  };
  heatmap: HourlyHeatmapCell[];
  funnel: FunnelStep[];
  retention: RetentionCohort;
  deviceShare: {
    mobile: number;
    desktop: number;
    tablet: number;
    other: number;
  };
  topLocations: Array<{
    country: string;
    views: number;
    clicks: number;
    ctr: number;
  }>;
  duckDbQueries: {
    hourlyAggQuery: string;
    geoDeviceQuery: string;
    retentionCohortQuery: string;
    oneLineCliRun: string;
  };
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Executes DuckDB-style OLAP aggregations across the profile's events.
 */
export async function computeDuckDbAnalytics(
  profileId: string,
  days = 30,
): Promise<DuckDbAnalyticsResult> {
  const since = new Date(Date.now() - days * 86_400_000);

  const [rawRows, profileLinks] = await Promise.all([
    db
      .select()
      .from(events)
      .where(and(eq(events.profileId, profileId), gte(events.createdAt, since)))
      .orderBy(desc(events.createdAt))
      .limit(100000),
    db
      .select({ id: links.id, title: links.title, url: links.url })
      .from(links)
      .where(eq(links.profileId, profileId)),
  ]);

  return calculateDuckDbMetrics(rawRows, profileLinks, days);
}

/**
 * Pure in-memory OLAP metric calculation function for DuckDB.
 */
export function calculateDuckDbMetrics(
  rawRows: AnalyticsEvent[],
  profileLinks: Array<{ id: string; title: string; url: string }>,
  days = 30,
): DuckDbAnalyticsResult {
  const since = new Date(Date.now() - days * 86_400_000);
  const totalEvents = rawRows.length;
  const views = rawRows.filter((r) => r.type === "view");
  const clicks = rawRows.filter((r) => r.type === "click");
  const uniqueIps = new Set(rawRows.map((r) => r.ipHash).filter(Boolean));
  const uniqueVisitors = uniqueIps.size;
  const overallCtr = views.length > 0 ? Math.round((clicks.length / views.length) * 1000) / 10 : 0;

  // 1. 24x7 Hourly Heatmap
  const heatmapMap = new Map<string, { views: number; clicks: number }>();
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      heatmapMap.set(`${d}-${h}`, { views: 0, clicks: 0 });
    }
  }

  for (const row of rawRows) {
    const dt = new Date(row.createdAt);
    const day = dt.getDay();
    const hour = dt.getHours();
    const cell = heatmapMap.get(`${day}-${hour}`);
    if (cell) {
      if (row.type === "view") cell.views++;
      else cell.clicks++;
    }
  }

  const heatmap: HourlyHeatmapCell[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const cell = heatmapMap.get(`${d}-${h}`) ?? { views: 0, clicks: 0 };
      heatmap.push({
        dayOfWeek: d,
        dayName: DAY_NAMES[d],
        hour: h,
        views: cell.views,
        clicks: cell.clicks,
        total: cell.views + cell.clicks,
      });
    }
  }

  // 2. Conversion Funnel: Profile Page Views -> Total Link Clicks
  const funnel: FunnelStep[] = [
    {
      step: "Profile Page Views",
      count: views.length,
      conversionRate: 100,
      dropoffRate: 0,
    },
    {
      step: "Link Engagements (Clicks)",
      count: clicks.length,
      conversionRate: views.length > 0 ? Math.round((clicks.length / views.length) * 1000) / 10 : 0,
      dropoffRate:
        views.length > 0
          ? Math.max(0, Math.round(((views.length - clicks.length) / views.length) * 1000) / 10)
          : 0,
    },
  ];

  // 3. Retention Cohort: Single vs Multi-Day Returning Visitors
  const visitorDays = new Map<string, Set<string>>();
  for (const row of rawRows) {
    if (!row.ipHash) continue;
    const dateStr = new Date(row.createdAt).toISOString().slice(0, 10);
    let set = visitorDays.get(row.ipHash);
    if (!set) {
      set = new Set();
      visitorDays.set(row.ipHash, set);
    }
    set.add(dateStr);
  }

  let returningCount = 0;
  for (const daysSet of visitorDays.values()) {
    if (daysSet.size > 1) {
      returningCount++;
    }
  }
  const singleVisitCount = Math.max(0, uniqueVisitors - returningCount);
  const returningRate =
    uniqueVisitors > 0 ? Math.round((returningCount / uniqueVisitors) * 1000) / 10 : 0;

  const retention: RetentionCohort = {
    totalVisitors: uniqueVisitors,
    singleVisitVisitors: singleVisitCount,
    returningVisitors: returningCount,
    returningRate,
  };

  // 4. Device Share
  let mobileCount = 0;
  let desktopCount = 0;
  let tabletCount = 0;
  let otherCount = 0;

  for (const row of rawRows) {
    const dev = (row.device || "").toLowerCase();
    if (dev.includes("mobile")) mobileCount++;
    else if (dev.includes("tablet")) tabletCount++;
    else if (dev.includes("desktop")) desktopCount++;
    else otherCount++;
  }

  const denom = totalEvents || 1;
  const deviceShare = {
    mobile: Math.round((mobileCount / denom) * 1000) / 10,
    desktop: Math.round((desktopCount / denom) * 1000) / 10,
    tablet: Math.round((tabletCount / denom) * 1000) / 10,
    other: Math.round((otherCount / denom) * 1000) / 10,
  };

  // 5. Geographic Country CTR Ranking
  const countryMetrics = new Map<string, { views: number; clicks: number }>();
  for (const row of rawRows) {
    const c = row.country || "Unknown";
    if (c === "Unknown") continue;
    let entry = countryMetrics.get(c);
    if (!entry) {
      entry = { views: 0, clicks: 0 };
      countryMetrics.set(c, entry);
    }
    if (row.type === "view") entry.views++;
    else entry.clicks++;
  }

  const topLocations = [...countryMetrics.entries()]
    .map(([country, m]) => ({
      country,
      views: m.views,
      clicks: m.clicks,
      ctr: m.views > 0 ? Math.round((m.clicks / m.views) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.views + b.clicks - (a.views + a.clicks))
    .slice(0, 10);

  // 6. Pre-generated DuckDB SQL Queries
  const duckDbQueries = {
    hourlyAggQuery: `SELECT \n  strftime(to_timestamp(timestamp), '%A') AS weekday,\n  hour(to_timestamp(timestamp)) AS hour_of_day,\n  count(*) FILTER (WHERE type = 'view') AS views,\n  count(*) FILTER (WHERE type = 'click') AS clicks\nFROM read_csv_auto('analytics.csv.gz')\nGROUP BY 1, 2\nORDER BY views DESC;`,
    geoDeviceQuery: `SELECT \n  country,\n  device,\n  count(*) AS total_interactions,\n  round(count(*) FILTER (WHERE type = 'click') * 100.0 / NULLIF(count(*) FILTER (WHERE type = 'view'), 0), 1) AS ctr_pct\nFROM read_csv_auto('analytics.csv.gz')\nWHERE country != ''\nGROUP BY 1, 2\nORDER BY total_interactions DESC\nLIMIT 20;`,
    retentionCohortQuery: `WITH user_days AS (\n  SELECT ip_hash, count(DISTINCT strftime(to_timestamp(timestamp), '%Y-%m-%d')) AS active_days\n  FROM read_csv_auto('analytics.csv.gz')\n  GROUP BY ip_hash\n)\nSELECT \n  count(*) AS total_users,\n  count(*) FILTER (WHERE active_days > 1) AS returning_users,\n  round(count(*) FILTER (WHERE active_days > 1) * 100.0 / count(*), 2) AS retention_rate_pct\nFROM user_days;`,
    oneLineCliRun: `duckdb -c "SELECT country, count(*) as clicks FROM read_csv_auto('analytics.csv.gz') WHERE type = 'click' GROUP BY country ORDER BY clicks DESC LIMIT 10;"`,
  };

  return {
    summary: {
      days,
      since: since.toISOString(),
      totalEvents,
      views: views.length,
      clicks: clicks.length,
      uniqueVisitors,
      overallCtr,
    },
    heatmap,
    funnel,
    retention,
    deviceShare,
    topLocations,
    duckDbQueries,
  };
}
