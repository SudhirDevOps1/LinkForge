// 📊 Dashboard Overview — quick stats + setup checklist
import { asc, count, eq } from "drizzle-orm";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Circle,
  ExternalLink,
  Eye,
  Link2,
  MousePointerClick,
  Palette,
  Percent,
} from "lucide-react";
import Link from "next/link";
import { Card, StatCard } from "@/components/ui";
import { db } from "@/db";
import { links as linksTable } from "@/db/schema";
import { getAnalyticsSummary } from "@/lib/analytics";
import { getSessionUser } from "@/lib/auth";
import { getTheme } from "@/lib/themes";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/login");
  const { user, profile } = ctx;
  if (!profile) redirect("/dashboard/settings");

  const [summary, [linkAgg], recentLinks] = await Promise.all([
    getAnalyticsSummary(profile.id, 30),
    db.select({ count: count() }).from(linksTable).where(eq(linksTable.profileId, profile.id)),
    db
      .select()
      .from(linksTable)
      .where(eq(linksTable.profileId, profile.id))
      .orderBy(asc(linksTable.position))
      .limit(4),
  ]);

  const theme = getTheme(profile.theme);
  const linkCount = linkAgg?.count ?? 0;
  const checklist = [
    { done: profile.bio.length > 0, label: "Profile bio likhein", href: "/dashboard/settings" },
    { done: Boolean(profile.avatarUrl), label: "Avatar upload karein", href: "/dashboard/settings" },
    { done: linkCount > 0, label: "Apna pehla link jodein", href: "/dashboard/links" },
    { done: profile.theme !== "midnight", label: "Ek theme choose karein", href: "/dashboard/appearance" },
    { done: Boolean(profile.customDomain), label: "Custom domain connect karein", href: "/dashboard/settings" },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Namaste, {user.name.split(" ")[0] || "creator"}
          </h1>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-zinc-400">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: profile.isPublished ? "#34d399" : "#fbbf24" }}
            />
            <span>
              linkforge.page/<span className="text-zinc-200">{profile.slug}</span>
            </span>
            <a
              href={`/${profile.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-violet-300 hover:text-violet-200"
            >
              Open <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <Link
          href="/dashboard/links"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-500 px-4 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,.4)] transition-colors hover:bg-violet-400"
        >
          <Link2 className="h-4 w-4" /> Add link
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Views (30d)" value={summary.totals.views} icon={<Eye className="h-5 w-5" />} sub={`${summary.totals.uniqueVisitors} unique visitors`} />
        <StatCard label="Clicks (30d)" value={summary.totals.clicks} icon={<MousePointerClick className="h-5 w-5" />} sub="har link ke total clicks" />
        <StatCard label="CTR" value={`${summary.totals.ctr}%`} icon={<Percent className="h-5 w-5" />} sub="views → clicks ratio" />
        <StatCard label="Links live" value={linkCount} icon={<Link2 className="h-5 w-5" />} sub={`theme: ${theme.name}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Checklist */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Launch checklist</h2>
            <span className="text-xs font-medium text-zinc-500">
              {doneCount}/{checklist.length}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
              style={{ width: `${(doneCount / checklist.length) * 100}%` }}
            />
          </div>
          <ul className="mt-4 space-y-2.5">
            {checklist.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-2.5 text-sm text-zinc-300 transition-colors hover:text-white"
                >
                  {item.done ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                  ) : (
                    <Circle className="h-4.5 w-4.5 text-zinc-600 group-hover:text-violet-300" />
                  )}
                  <span className={item.done ? "line-through opacity-60" : ""}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* Top links */}
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Top links (30d)</h2>
            <Link href="/dashboard/analytics" className="group inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200">
              <BarChart3 className="h-3.5 w-3.5" /> Full analytics
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {summary.topLinks.slice(0, 4).map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{l.title}</p>
                  <p className="truncate text-xs text-zinc-500">{l.url}</p>
                </div>
                <span className="shrink-0 rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300">
                  {l.clicks} clicks
                </span>
              </div>
            ))}
            {recentLinks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-500">
                Abhi koi link nahi —{" "}
                <Link href="/dashboard/links" className="text-violet-300 hover:underline">
                  pehla link jodein
                </Link>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      {/* Quick theme strip */}
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-9 w-9 rounded-xl border border-white/10"
                style={{ background: theme.swatch[i] }}
              />
            ))}
          </div>
          <div>
            <p className="text-sm font-semibold">Current theme: {theme.name}</p>
            <p className="text-xs text-zinc-500">
              Layout: {profile.layout === "bento" ? "Bento grid" : "Classic list"} · {theme.description}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/appearance"
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
        >
          <Palette className="h-4 w-4" /> Customize
        </Link>
      </Card>
    </div>
  );
}
