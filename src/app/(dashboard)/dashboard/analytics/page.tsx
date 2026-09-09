// 📊 Dashboard — Analytics page
// Charts browser me hi render hote hain (dynamic + ssr:false) — recharts ka
// SSR edge cases se production crash se bachne ke liye, skeleton ke saath.
import {
  Download,
  ExternalLink,
  Eye,
  Flame,
  Globe,
  MousePointerClick,
  Percent,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AnalyticsChartsLazy } from "@/components/analytics-charts-lazy";
import { Card, StatCard } from "@/components/ui";
import { getAnalyticsSummary } from "@/lib/analytics";
import { getSessionUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90] as const;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/login");
  if (!ctx.profile) redirect("/dashboard/settings");

  const { days: daysParam } = await searchParams;
  const parsed = Number(daysParam ?? 7);
  const days = (RANGES as readonly number[]).includes(parsed) ? parsed : 7;
  const summary = await getAnalyticsSummary(ctx.profile.id, days);

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
            Privacy-first — IPs hashed hain, koi cookies nahi, koi fingerprinting nahi
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/dashboard/analytics?days=${r}`}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                  r === days ? "bg-violet-500 text-white" : "text-zinc-400 hover:text-white",
                )}
              >
                {r}d
              </Link>
            ))}
          </div>
          <a
            href={`/api/analytics/export?days=${days}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
          >
            <Download className="h-4 w-4" /> CSV
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Page views" value={summary.totals.views} icon={<Eye className="h-5 w-5" />} />
        <StatCard label="Link clicks" value={summary.totals.clicks} icon={<MousePointerClick className="h-5 w-5" />} />
        <StatCard label="Unique visitors" value={summary.totals.uniqueVisitors} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Click-through rate" value={`${summary.totals.ctr}%`} icon={<Percent className="h-5 w-5" />} />
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
    </div>
  );
}
