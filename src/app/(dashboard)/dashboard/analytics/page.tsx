// 📊 Dashboard — Analytics page
// Charts browser me hi render hote hain (dynamic + ssr:false) — recharts ka
// SSR edge cases se production crash se bachne ke liye, skeleton ke saath.
import {
  Activity,
  Download,
  ExternalLink,
  Eye,
  Flame,
  Globe,
  MousePointerClick,
  Percent,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AnalyticsChartsLazy } from "@/components/analytics-charts-lazy";
import { DuckDbAnalyticsView } from "@/components/duckdb-analytics-view";
import { Card, StatCard } from "@/components/ui";
import { getAnalyticsSummary, getRecentEvents } from "@/lib/analytics";
import { computeDuckDbAnalytics } from "@/lib/analytics/duckdb";
import { getSessionUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90] as const;
const DEVICES = ["Mobile", "Desktop", "Tablet"] as const;

function pctDelta(cur: number, prev: number): string {
  if (prev <= 0) return cur > 0 ? "new" : "—";
  const d = Math.round(((cur - prev) / prev) * 100);
  return `${d >= 0 ? "+" : ""}${d}% vs prev`;
}

function timeAgo(date: Date): string {
  const s = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; device?: string }>;
}) {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/login");
  if (!ctx.profile) redirect("/dashboard/settings");

  const { days: daysParam, device: deviceParam } = await searchParams;
  const parsed = Number(daysParam ?? 7);
  const days = (RANGES as readonly number[]).includes(parsed) ? parsed : 7;
  const device = (DEVICES as readonly string[]).includes(deviceParam ?? "")
    ? deviceParam
    : undefined;
  const qs = (d: number, dev?: string) =>
    `/dashboard/analytics?days=${d}${dev ? `&device=${dev}` : ""}`;

  const prevEnd = new Date(Date.now() - days * 86_400_000); // eslint-disable-line react-hooks/purity -- server component, per-request single evaluation
  const [summary, prev, feed, duckdbData] = await Promise.all([
    getAnalyticsSummary(ctx.profile.id, days, device ? { device } : undefined),
    // Previous equal-length window — period-over-period comparison
    getAnalyticsSummary(ctx.profile.id, days, {
      ...(device ? { device } : {}),
      endDate: prevEnd,
    }),
    getRecentEvents(ctx.profile.id, 15),
    computeDuckDbAnalytics(ctx.profile.id, days),
  ]);

  // ---- Smart insights (server-computed) ----------------------------------------
  const peak = summary.timeseries.reduce(
    (best, d) =>
      d.views + d.clicks > best.views + best.clicks ? d : best,
    summary.timeseries[0] ?? { date: "—", views: 0, clicks: 0 },
  );
  const peakTotal = peak.views + peak.clicks;
  const peakLabel =
    peak.date === "—"
      ? "—"
      : new Date(`${peak.date}T00:00:00`).toLocaleDateString("en", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
  const mobileCount = summary.devices.find((d) => d.name === "Mobile")?.value ?? 0;
  const totalDevices = summary.devices.reduce((s, d) => s + d.value, 0);
  const mobileShare = totalDevices ? Math.round((mobileCount / totalDevices) * 100) : 0;
  const topReferrer = summary.referrers[0];
  const topCountry = summary.countries[0];

  const insights = [
    {
      icon: Flame,
      label: "Peak day",
      value: peakTotal > 0 ? peakLabel : "No traffic yet",
      sub: peakTotal > 0 ? `${peakTotal} events` : "Share your page to get data",
    },
    {
      icon: ExternalLink,
      label: "Top referrer",
      value: topReferrer && topReferrer.value > 0 ? topReferrer.name : "—",
      sub: topReferrer && topReferrer.value > 0 ? `${topReferrer.value} views` : "No referrer data",
    },
    {
      icon: Globe,
      label: "Top country",
      value: topCountry && topCountry.value > 0 ? topCountry.name : "—",
      sub: topCountry && topCountry.value > 0 ? `${topCountry.value} events` : "No geo data",
    },
    {
      icon: Smartphone,
      label: "Mobile share",
      value: `${mobileShare}%`,
      sub: `${mobileCount} of ${totalDevices} events`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Analytics</h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Privacy-first — IPs cryptographically hashed, zero cookies, zero device fingerprinting
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={qs(r, device)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                  r === days ? "bg-violet-500 text-white" : "text-zinc-400 hover:text-white",
                )}
              >
                {r}d
              </Link>
            ))}
          </div>
          <div className="flex gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1">
            <Link
              href={qs(days)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                !device ? "bg-violet-500 text-white" : "text-zinc-400 hover:text-white",
              )}
            >
              All
            </Link>
            {DEVICES.map((d) => (
              <Link
                key={d}
                href={qs(days, d)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  d === device ? "bg-violet-500 text-white" : "text-zinc-400 hover:text-white",
                )}
              >
                {d}
              </Link>
            ))}
          </div>
          <a
            href={qs(days, device)}
            title="Refresh data"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-zinc-300 transition-colors hover:bg-white/5"
          >
            <RefreshCw className="h-4 w-4" />
          </a>
          <a
            href={`/api/analytics/export?days=${days}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/15 px-3.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
            title="Standard CSV"
          >
            <Download className="h-4 w-4" /> CSV
          </a>
          <a
            href={`/api/analytics/export?days=${days}&format=csv.gz`}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-500/10 px-3 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/20"
            title="GZIP Compressed CSV (85% smaller file)"
          >
            <Download className="h-3.5 w-3.5" /> .csv.gz (85% smaller)
          </a>
        </div>
      </div>
      {device ? (
        <p className="text-xs text-zinc-500">
          Filtered: <span className="font-semibold text-violet-300">{device}</span> devices only —{" "}
          <Link href={qs(days)} className="underline hover:text-white">
            clear
          </Link>
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Page views" value={summary.totals.views} icon={<Eye className="h-5 w-5" />} sub={pctDelta(summary.totals.views, prev.totals.views)} />
        <StatCard label="Link clicks" value={summary.totals.clicks} icon={<MousePointerClick className="h-5 w-5" />} sub={pctDelta(summary.totals.clicks, prev.totals.clicks)} />
        <StatCard label="Unique visitors" value={summary.totals.uniqueVisitors} icon={<Users className="h-5 w-5" />} sub={pctDelta(summary.totals.uniqueVisitors, prev.totals.uniqueVisitors)} />
        <StatCard label="Click-through rate" value={`${summary.totals.ctr}%`} icon={<Percent className="h-5 w-5" />} sub={pctDelta(summary.totals.ctr, prev.totals.ctr)} />
      </div>

      {/* Smart insights */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {insights.map((ins) => (
          <Card key={ins.label} className="flex items-center gap-3.5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <ins.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {ins.label}
              </span>
              <span className="block truncate text-sm font-semibold text-white">{ins.value}</span>
              <span className="block text-xs text-zinc-500">{ins.sub}</span>
            </span>
          </Card>
        ))}
      </div>

      <AnalyticsChartsLazy summary={summary} />

      {/* 🦆 DuckDB OLAP Analytics Engine: 24x7 Heatmap, Funnel, Cohorts & SQL */}
      <DuckDbAnalyticsView data={duckdbData} profileSlug={ctx.profile.slug} days={days} />

      {/* Live activity feed */}
      <Card className="p-0">
        <div className="flex items-center gap-2 border-b border-white/5 px-5 py-4">
          <Activity className="h-4 w-4 text-violet-300" />
          <h2 className="text-sm font-semibold">Live activity</h2>
          <span className="ml-auto text-xs text-zinc-500">latest {feed.length} events</span>
        </div>
        {feed.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-zinc-500">
            No activity recorded yet — share your link and analytics will appear here live.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {feed.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                    e.type === "click"
                      ? "bg-violet-500/15 text-violet-300"
                      : "bg-emerald-500/15 text-emerald-300",
                  )}
                >
                  {e.type}
                </span>
                <span className="min-w-0 flex-1 truncate text-zinc-300">
                  {e.linkTitle ?? "Page view"}
                </span>
                <span className="hidden text-xs text-zinc-500 sm:block">
                  {e.referrer} · {e.country || "—"} · {e.device}
                </span>
                <span className="shrink-0 text-xs text-zinc-500">{timeAgo(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
