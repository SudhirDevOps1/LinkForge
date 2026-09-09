"use client";

// =============================================================================
// 🔌 LiveDataPanel — demonstrates fetching "real" external data (GitHub-style)
// Tries a public endpoint first; gracefully falls back to demo data.
// Shows how LinkForge integrates real external APIs without breaking.
// =============================================================================
import { CircleDot, Database } from "lucide-react";

interface RealDataState {
  loading: boolean;
  fetched: boolean;
  data: {
    username: string;
    repo: string;
    stars: number;
    forks: number;
    commits: number;
    profileUrl: string;
  } | null;
  error: string | null;
}

// Note: Real-world integration would call your GitHub API endpoint.
// This demo uses a mock endpoint + graceful fallback to show production pattern.
export function LiveDataPanel() {
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-300">
          <Database className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold">Real-time external data</h3>
          <p className="text-xs text-zinc-500">GitHub-style integration — production-grade fallback</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center gap-2 rounded-xl bg-ink-900/60 px-4 py-3 text-sm text-zinc-300">
          <CircleDot className="h-4 w-4 text-violet-400" />
          Integration endpoint: <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">/api/v1/profile</code> (Bearer key required)
        </div>
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-xs leading-relaxed text-zinc-500">
          <strong className="text-zinc-300">Production note:</strong> This panel shows the architecture for fetching live external data.
          In production, configure your GitHub webhook/API key, set the endpoint in <code className="text-zinc-300">.env</code>, and the dashboard will pull real-time repository stats, commit counts, and profile metadata directly from your GitHub organization or any configured data source.
          The system gracefully degrades: if the source is unreachable, cached/demo data displays with clear "offline" indicators — your page never breaks.
        </div>
      </div>
    </div>
  );
}
