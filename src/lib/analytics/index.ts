// =============================================================================
// 📊 Analytics — privacy-first click & view tracking
// -----------------------------------------------------------------------------
// - Raw IP kabhi store nahi hota (salted SHA-256 hash)
// - Country sirf edge headers se (x-vercel-ip-country / cf-ipcountry)
// - Retention: ANALYTICS_RETENTION_DAYS (default 30) — probabilistic GC
// - Aggregations JS me hote hain → Postgres & SQLite dono dialects portable
// =============================================================================
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { events, links, type AnalyticsEvent } from "@/db/schema";
import { hashIp } from "@/lib/crypto";

// ---- Lightweight UA parser (no heavy dependency) -----------------------------
export function parseUserAgent(ua: string): {
  device: string;
  browser: string;
  os: string;
} {
  const s = ua.toLowerCase();
  const device = /ipad|tablet/.test(s)
    ? "Tablet"
    : /mobi|android|iphone|ipod/.test(s)
      ? "Mobile"
      : "Desktop";
  const browser = /edg\//.test(s)
    ? "Edge"
    : /opr\/|opera/.test(s)
      ? "Opera"
      : /chrome\//.test(s)
        ? "Chrome"
        : /safari\//.test(s) && !/chrome/.test(s)
          ? "Safari"
          : /firefox\//.test(s)
            ? "Firefox"
            : /curl|wget|postman/.test(s)
              ? "Bot"
              : "Other";
  const os = /windows/.test(s)
    ? "Windows"
    : /mac os x|macos/.test(s)
      ? "macOS"
      : /android/.test(s)
        ? "Android"
        : /iphone|ipad|ipod/.test(s)
          ? "iOS"
          : /linux/.test(s)
            ? "Linux"
            : "Other";
  return { device, browser, os };
}

function referrerHost(referer: string | null): string {
  if (!referer) return "Direct";
  try {
    return new URL(referer).host.replace(/^www\./, "") || "Direct";
  } catch {
    return "Direct";
  }
}

export interface TrackInput {
  profileId: string;
  linkId?: string | null;
  type: "view" | "click";
  headers: Headers;
  analyticsEnabled?: boolean;
}

/** Event insert karta hai (fire-and-forget friendly). Analytics disabled → no-op. */
export async function trackEvent(input: TrackInput): Promise<void> {
  if (process.env.ANALYTICS_ENABLED === "false") return;
  if (input.analyticsEnabled === false) return;
  const { headers } = input;
  const ua = headers.get("user-agent") ?? "";
  const { device, browser, os } = parseUserAgent(ua);
  const country =
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    headers.get("x-country-code") ??
    "";
  const fwd = headers.get("x-forwarded-for");
  const ip =
    fwd?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "0.0.0.0";

  await db.insert(events).values({
    profileId: input.profileId,
    linkId: input.linkId ?? null,
    type: input.type,
    referrer: referrerHost(headers.get("referer")),
    country,
    device,
    browser,
    os,
    ipHash: hashIp(ip),
  });

  // Probabilistic retention GC (~1% of writes) — old data auto-purge
  const retentionDays = Number(process.env.ANALYTICS_RETENTION_DAYS ?? 30);
  if (Number.isFinite(retentionDays) && Math.random() < 0.01) {
    const cutoff = new Date(Date.now() - retentionDays * 86_400_000);
    await db.delete(events).where(lt(events.createdAt, cutoff));
  }
}

// ---- Dashboard aggregations ---------------------------------------------------
export interface AnalyticsSummary {
  range: { days: number; since: string };
  totals: { views: number; clicks: number; uniqueVisitors: number; ctr: number };
  timeseries: Array<{ date: string; views: number; clicks: number }>;
  topLinks: Array<{ id: string; title: string; url: string; clicks: number }>;
  devices: Array<{ name: string; value: number }>;
  browsers: Array<{ name: string; value: number }>;
  os: Array<{ name: string; value: number }>;
  countries: Array<{ name: string; value: number }>;
  referrers: Array<{ name: string; value: number }>;
}

function group(rows: AnalyticsEvent[], key: keyof AnalyticsEvent) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[key] ?? "") || "Unknown";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

export async function getAnalyticsSummary(
  profileId: string,
  days = 7,
  opts?: { device?: string; endDate?: Date },
): Promise<AnalyticsSummary> {
  const end = opts?.endDate ?? new Date();
  const since = new Date(end.getTime() - days * 86_400_000);
  let rows = await db
    .select()
    .from(events)
    .where(and(eq(events.profileId, profileId), gte(events.createdAt, since), lt(events.createdAt, end)))
    .orderBy(desc(events.createdAt))
    .limit(50_000);
  // Device filter (dashboard ?device=Mobile) — saare aggregations respect karte hain
  if (opts?.device) {
    rows = rows.filter((r) => r.device === opts.device);
  }

  const views = rows.filter((r) => r.type === "view");
  const clicks = rows.filter((r) => r.type === "click");
  const uniqueVisitors = new Set(rows.map((r) => r.ipHash).filter(Boolean)).size;

  // Timeseries — fill zero days (window end = `end`, comparison-safe)
  const series = new Map<string, { views: number; clicks: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    series.set(d, { views: 0, clicks: 0 });
  }
  for (const r of rows) {
    const d = new Date(r.createdAt).toISOString().slice(0, 10);
    const bucket = series.get(d);
    if (!bucket) continue;
    if (r.type === "view") bucket.views += 1;
    else bucket.clicks += 1;
  }

  // Top links
  const profileLinks = await db
    .select({ id: links.id, title: links.title, url: links.url })
    .from(links)
    .where(eq(links.profileId, profileId));
  const clickCount = new Map<string, number>();
  for (const c of clicks) {
    if (c.linkId) clickCount.set(c.linkId, (clickCount.get(c.linkId) ?? 0) + 1);
  }
  const topLinks = profileLinks
    .map((l) => ({ ...l, clicks: clickCount.get(l.id) ?? 0 }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 8);

  return {
    range: { days, since: since.toISOString() },
    totals: {
      views: views.length,
      clicks: clicks.length,
      uniqueVisitors,
      ctr: views.length ? Math.round((clicks.length / views.length) * 1000) / 10 : 0,
    },
    timeseries: [...series.entries()].map(([date, v]) => ({ date, ...v })),
    topLinks,
    devices: group(rows, "device"),
    browsers: group(rows, "browser"),
    os: group(rows, "os"),
    countries: group(rows.filter((r) => r.country), "country"),
    referrers: group(views, "referrer"),
  };
}

// ---- Activity feed ------------------------------------------------------------
export interface RecentEvent {
  id: string | number;
  type: string;
  linkTitle: string | null;
  referrer: string;
  country: string;
  device: string;
  createdAt: Date;
}

/** Latest events (dashboard activity feed) — link titles ke saath */
export async function getRecentEvents(
  profileId: string,
  limit = 15,
): Promise<RecentEvent[]> {
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.profileId, profileId))
    .orderBy(desc(events.createdAt))
    .limit(Math.min(Math.max(limit, 1), 50));
  const linkIds = [...new Set(rows.map((r) => r.linkId).filter((v): v is string => !!v))];
  const linkRows =
    linkIds.length > 0
      ? await db
          .select({ id: links.id, title: links.title })
          .from(links)
          .where(eq(links.profileId, profileId))
      : [];
  const titles = new Map(linkRows.map((l) => [l.id, l.title]));
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    linkTitle: r.linkId ? (titles.get(r.linkId) ?? "(deleted link)") : null,
    referrer: r.referrer,
    country: r.country,
    device: r.device,
    createdAt: r.createdAt,
  }));
}
