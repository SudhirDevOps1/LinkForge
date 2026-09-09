"use client";

// =============================================================================
// 📈 AnalyticsChartsLazy — recharts ko browser me hi load karo
// `ssr:false` Server Components me allowed nahi, isliye yeh client wrapper
// dynamic import karta hai (skeleton fallback ke saath).
// =============================================================================
import dynamic from "next/dynamic";
import type { AnalyticsSummary } from "@/lib/analytics";

const Charts = dynamic(
  () => import("@/components/analytics-charts").then((m) => m.AnalyticsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4" aria-label="Loading charts">
        <div className="glass h-72 animate-pulse rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass h-64 animate-pulse rounded-2xl" />
          <div className="glass h-64 animate-pulse rounded-2xl" />
        </div>
      </div>
    ),
  },
);

export function AnalyticsChartsLazy({ summary }: { summary: AnalyticsSummary }) {
  return <Charts summary={summary} />;
}
