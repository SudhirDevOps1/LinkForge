// ⏳ Dashboard loading skeleton — route transitions par instant feedback
export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-label="Loading dashboard">
      <div className="flex items-end justify-between">
        <div className="space-y-2.5">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-white/8" />
          <div className="h-4 w-64 animate-pulse rounded-lg bg-white/5" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded-xl bg-white/8" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass h-32 animate-pulse rounded-2xl" />
        ))}
      </div>
      <div className="glass h-64 animate-pulse rounded-2xl" />
    </div>
  );
}
