"use client";

// =============================================================================
// 🦆 DuckDB Analytics Visual View — Heatmap, Funnels, Retention & Query Runner
// =============================================================================
import { useState } from "react";
import {
  ArrowDown,
  Check,
  Code2,
  Copy,
  Database,
  Download,
  Flame,
  Layers,
  Sparkles,
  TrendingUp,
  Users2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { DuckDbAnalyticsResult } from "@/lib/analytics/duckdb";
import { Card } from "./ui";

interface DuckDbAnalyticsViewProps {
  data: DuckDbAnalyticsResult;
  profileSlug: string;
  days: number;
}

const HOURS_LABEL = [
  "12a", "1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a",
  "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p",
];

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DuckDbAnalyticsView({ data, profileSlug, days }: DuckDbAnalyticsViewProps) {
  const [activeQueryTab, setActiveQueryTab] = useState<"hourly" | "geo" | "retention">("hourly");
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [isCompacting, setIsCompacting] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{
    dayName: string;
    hour: number;
    views: number;
    clicks: number;
    total: number;
  } | null>(null);

  // Find peak hour in heatmap
  const peakCell = data.heatmap.reduce(
    (max, cell) => (cell.total > max.total ? cell : max),
    data.heatmap[0] ?? { dayOfWeek: 0, dayName: "—", hour: 0, views: 0, clicks: 0, total: 0 },
  );

  const getIntensityClass = (total: number) => {
    if (total === 0) return "bg-white/[0.04] hover:bg-white/10";
    if (total <= 2) return "bg-violet-900/40 border border-violet-800/40 text-violet-200 hover:bg-violet-800/60";
    if (total <= 5) return "bg-violet-600/70 text-white hover:bg-violet-500/80 shadow-[0_0_8px_rgba(139,92,246,0.3)]";
    if (total <= 10) return "bg-fuchsia-600/80 text-white hover:bg-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.4)]";
    return "bg-gradient-to-tr from-fuchsia-500 to-amber-400 text-black font-bold hover:brightness-110 shadow-[0_0_16px_rgba(234,179,8,0.5)]";
  };

  const handleCopyQuery = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedQuery(true);
    toast.success("DuckDB SQL query copied to clipboard!");
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const handleCompactDatabase = async () => {
    setIsCompacting(true);
    try {
      const res = await fetch("/api/analytics/duckdb", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        toast.success(`⚡ Database Optimized! ${json.message} (~98% space saved)`);
      } else {
        toast.error(json.error || "Failed to compact database rollups");
      }
    } catch {
      toast.error("Network error during database compaction");
    } finally {
      setIsCompacting(false);
    }
  };

  const activeQuery =
    activeQueryTab === "hourly"
      ? data.duckDbQueries.hourlyAggQuery
      : activeQueryTab === "geo"
      ? data.duckDbQueries.geoDeviceQuery
      : data.duckDbQueries.retentionCohortQuery;

  return (
    <div className="space-y-6">
      {/* Header bar with DuckDB badge and Database Compactor */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-purple-950/20 to-black p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300 ring-1 ring-violet-400/30">
            <Database className="h-5 w-5 text-amber-400" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-white">DuckDB OLAP Analytics & Vault Hub</h2>
              <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                Columnar Engine
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              High-speed in-memory aggregations, multi-dimensional heatmaps, and compact 98% DB storage rollups.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* One-click DB Compactor Button */}
          <button
            onClick={handleCompactDatabase}
            disabled={isCompacting}
            className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 transition-all hover:bg-amber-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            title="Compact raw events into compact daily rollup rows to save 98%+ database space"
          >
            <Zap className={`h-3.5 w-3.5 text-amber-400 ${isCompacting ? "animate-spin" : ""}`} />
            {isCompacting ? "Compacting..." : "Compact DB Rollups"}
          </button>

          {/* Compressed Export Hub */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            <a
              href={`/api/analytics/export?days=${days}&format=csv.gz`}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-violet-500/20 hover:text-white"
              title="GZIP Compressed CSV — 85% smaller file size"
            >
              <Download className="h-3.5 w-3.5 text-violet-400" /> .csv.gz
            </a>
            <a
              href={`/api/analytics/export?days=${days}&format=ndjson.gz`}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-violet-500/20 hover:text-white"
              title="DuckDB & BigQuery Newline-Delimited JSON"
            >
              <Download className="h-3.5 w-3.5 text-amber-400" /> .ndjson.gz
            </a>
            <a
              href={`/api/analytics/export?days=${days}&format=duckdb`}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-violet-500/20 hover:text-white"
              title="DuckDB SQL Loader Script"
            >
              <Code2 className="h-3.5 w-3.5 text-emerald-400" /> .sql
            </a>
          </div>
        </div>
      </div>

      {/* 24x7 Hourly Activity Heatmap */}
      <Card className="overflow-hidden p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" /> 24x7 Hourly Activity Heatmap
            </h3>
            <p className="text-xs text-zinc-400">
              Audience activity density mapped across every hour of each weekday.
            </p>
          </div>
          {peakCell.total > 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                Peak: <strong className="text-white">{peakCell.dayName} at {HOURS_LABEL[peakCell.hour]}</strong> ({peakCell.total} events)
              </span>
            </div>
          ) : null}
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[640px]">
            {/* Hour Labels Header */}
            <div className="mb-1.5 flex text-[10px] font-medium text-zinc-500">
              <div className="w-10 shrink-0 text-right pr-2">Day</div>
              <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                {HOURS_LABEL.map((h, i) => (
                  <div key={i} className="text-center font-mono">
                    {i % 3 === 0 ? h : "·"}
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap Rows (7 Days) */}
            <div className="space-y-1.5">
              {DAYS_SHORT.map((dayName, dIdx) => (
                <div key={dayName} className="flex items-center text-xs">
                  <div className="w-10 shrink-0 text-[11px] font-semibold text-zinc-400 pr-2 text-right">
                    {dayName}
                  </div>
                  <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                    {Array.from({ length: 24 }).map((_, hIdx) => {
                      const cell = data.heatmap.find(
                        (c) => c.dayOfWeek === dIdx && c.hour === hIdx,
                      ) ?? { views: 0, clicks: 0, total: 0 };

                      return (
                        <button
                          key={hIdx}
                          onMouseEnter={() =>
                            setHoveredCell({
                              dayName,
                              hour: hIdx,
                              views: cell.views,
                              clicks: cell.clicks,
                              total: cell.total,
                            })
                          }
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`group relative h-7 w-full rounded transition-all duration-150 ${getIntensityClass(
                            cell.total,
                          )}`}
                          aria-label={`${dayName} ${HOURS_LABEL[hIdx]}: ${cell.total} events`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Hover Tooltip / Detail Status Bar */}
            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500">Intensity:</span>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-white/[0.04]" title="0" />
                  <div className="h-3 w-3 rounded bg-violet-900/60" title="Low" />
                  <div className="h-3 w-3 rounded bg-violet-600/70" title="Medium" />
                  <div className="h-3 w-3 rounded bg-fuchsia-600/80" title="High" />
                  <div className="h-3 w-3 rounded bg-gradient-to-tr from-fuchsia-500 to-amber-400" title="Peak" />
                </div>
                <span className="text-[10px] text-zinc-500">(0 $\to$ Peak)</span>
              </div>

              {hoveredCell ? (
                <div className="font-mono text-zinc-200">
                  <strong className="text-white">{hoveredCell.dayName} @ {HOURS_LABEL[hoveredCell.hour]}</strong>:{" "}
                  <span className="text-violet-300">{hoveredCell.views} views</span>,{" "}
                  <span className="text-fuchsia-300">{hoveredCell.clicks} clicks</span> ({hoveredCell.total} total)
                </div>
              ) : (
                <div className="text-[11px] text-zinc-500">
                  Hover over any time cell to inspect exact views & clicks
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Conversion Funnel & Visitor Retention Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h3 className="font-display text-sm font-semibold text-white">Conversion & Engagement Funnel</h3>
          </div>

          <div className="space-y-4">
            {data.funnel.map((step, idx) => (
              <div key={step.step} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300">{step.step}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{step.count.toLocaleString()}</span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">
                      {step.conversionRate}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0
                        ? "bg-gradient-to-r from-violet-500 to-purple-500"
                        : "bg-gradient-to-r from-fuchsia-500 to-pink-500"
                    }`}
                    style={{ width: `${Math.max(4, step.conversionRate)}%` }}
                  />
                </div>
                {idx === 0 && (
                  <div className="flex items-center justify-center pt-1 text-[11px] text-zinc-500">
                    <ArrowDown className="h-3 w-3 mr-1 text-zinc-600" />
                    Drop-off: {data.funnel[1]?.dropoffRate ?? 0}%
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-zinc-400">
            Overall Click-Through Rate (CTR) across all links is{" "}
            <strong className="text-violet-300 font-semibold">{data.summary.overallCtr}%</strong>.
          </div>
        </Card>

        {/* Audience Loyalty & Retention */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
            <Users2 className="h-4 w-4 text-violet-400" />
            <h3 className="font-display text-sm font-semibold text-white">Audience Loyalty & Retention</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Total Visitors
              </span>
              <span className="mt-1 block text-2xl font-bold text-white">
                {data.retention.totalVisitors.toLocaleString()}
              </span>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Returning Visitors
              </span>
              <span className="mt-1 block text-2xl font-bold text-fuchsia-400">
                {data.retention.returningVisitors.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Retention Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Returning Rate</span>
              <strong className="text-white font-mono">{data.retention.returningRate}%</strong>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/5 flex">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                style={{ width: `${Math.max(2, data.retention.returningRate)}%` }}
                title={`Returning: ${data.retention.returningRate}%`}
              />
              <div
                className="h-full bg-white/10"
                style={{ width: `${100 - data.retention.returningRate}%` }}
                title={`New: ${100 - data.retention.returningRate}%`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-500 pt-1">
              <span>● Returning: {data.retention.returningVisitors}</span>
              <span>○ Single Visit: {data.retention.singleVisitVisitors}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* DuckDB SQL Query Workbench */}
      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-amber-400" />
            <h3 className="font-display text-sm font-semibold text-white">DuckDB OLAP SQL Workbench</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs">
              <button
                onClick={() => setActiveQueryTab("hourly")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  activeQueryTab === "hourly" ? "bg-violet-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Hourly Peak
              </button>
              <button
                onClick={() => setActiveQueryTab("geo")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  activeQueryTab === "geo" ? "bg-violet-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Geo & CTR
              </button>
              <button
                onClick={() => setActiveQueryTab("retention")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  activeQueryTab === "retention" ? "bg-violet-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Cohorts
              </button>
            </div>

            <button
              onClick={() => handleCopyQuery(activeQuery)}
              className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10"
            >
              {copiedQuery ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedQuery ? "Copied" : "Copy SQL"}
            </button>
          </div>
        </div>

        <p className="mb-2 text-xs text-zinc-400">
          Run directly in DuckDB CLI, Python (<code>duckdb.query(...)</code>), or MotherDuck over your exported <code>.csv.gz</code> or <code>.ndjson.gz</code>:
        </p>

        <div className="relative rounded-xl border border-white/10 bg-black/70 p-3.5 font-mono text-xs text-violet-200 overflow-x-auto">
          <pre>{activeQuery}</pre>
        </div>
      </Card>
    </div>
  );
}
