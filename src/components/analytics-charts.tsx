"use client";

// =============================================================================
// 📈 AnalyticsCharts — recharts visualizations (views/clicks, devices, links)
// =============================================================================
import type { AnalyticsSummary } from "@/lib/analytics";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "./ui";

export const CHART_COLORS = ["#8b5cf6", "#e879f9", "#38bdf8", "#34d399", "#fbbf24", "#fb7185"];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-ink-850/95 px-3.5 py-2.5 text-xs shadow-xl backdrop-blur">
      {label ? <p className="mb-1 font-semibold text-white">{label}</p> : null}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5 text-zinc-300">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function AnalyticsCharts({ summary }: { summary: AnalyticsSummary }) {
  const series = summary.timeseries.map((d) => ({
    ...d,
    day: new Date(`${d.date}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" }),
  }));

  return (
    <div className="space-y-4">
      {/* Views vs Clicks */}
      <Card>
        <h3 className="mb-4 font-display text-sm font-semibold text-zinc-300">
          Views vs Clicks — last {summary.range.days} days
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e879f9" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#e879f9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,.15)" }} />
              <Area type="monotone" dataKey="views" name="Views" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gradViews)" />
              <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#e879f9" strokeWidth={2.5} fill="url(#gradClicks)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top links */}
        <Card>
          <h3 className="mb-4 font-display text-sm font-semibold text-zinc-300">Top links by clicks</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.topLinks.slice(0, 6)} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid stroke="rgba(255,255,255,.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={110}
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => (v.length > 14 ? `${v.slice(0, 14)}…` : v)}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,.04)" }} />
                <Bar dataKey="clicks" name="Clicks" radius={[0, 8, 8, 0]} barSize={18}>
                  {summary.topLinks.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Devices donut */}
        <Card>
          <h3 className="mb-4 font-display text-sm font-semibold text-zinc-300">Devices</h3>
          <div className="flex h-60 items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.devices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {summary.devices.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="w-36 space-y-2">
              {summary.devices.map((d, i) => (
                <li key={d.name} className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {d.name} <span className="ml-auto font-semibold text-white">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* Breakdown tables */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: "Top referrers", rows: summary.referrers },
          { title: "Browsers", rows: summary.browsers },
          { title: "Countries", rows: summary.countries.length ? summary.countries : [{ name: "No geo data (local dev)", value: 0 }] },
        ].map((table) => (
          <Card key={table.title}>
            <h3 className="mb-3 font-display text-sm font-semibold text-zinc-300">{table.title}</h3>
            <ul className="space-y-2">
              {table.rows.slice(0, 6).map((row) => (
                <li key={row.name} className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-zinc-400">{row.name}</span>
                  <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 font-semibold text-white">
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
