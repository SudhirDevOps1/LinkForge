"use client";

// =============================================================================
// 🐙 GitHubIntegration — preview-before-import (additive merge, koi delete nahi)
// Username → live public repos → checkbox select → import. Duplicates skip.
// =============================================================================
import { Loader2, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { GithubProfile, GithubRepo } from "@/lib/github";
import { BrandIcon } from "./icons";
import { cn } from "./ui";

export function GithubIntegration({ defaultUsername = "SudhirDevOps1" }: { defaultUsername?: string }) {
  const [username, setUsername] = useState(defaultUsername);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [ghProfile, setGhProfile] = useState<GithubProfile | null>(null);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function preview() {
    if (!username.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/integrations/github?username=${encodeURIComponent(username.trim())}&limit=20`,
      );
      const data = (await res.json().catch(() => ({}))) as {
        profile?: GithubProfile;
        repos?: GithubRepo[];
        error?: string;
      };
      if (!res.ok || !data.profile) throw new Error(data.error ?? "Fetch failed");
      setGhProfile(data.profile);
      setRepos(data.repos ?? []);
      setSelected(new Set((data.repos ?? []).slice(0, 10).map((r) => r.name)));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function importSelected() {
    if (selected.size === 0) {
      toast.error("Pehle repos select karo");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/integrations/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), repos: [...selected] }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        linksImported?: number;
        linksSkipped?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      toast.success(`${data.linksImported ?? 0} imported, ${data.linksSkipped ?? 0} skipped (duplicates)`);
      window.location.href = "/dashboard/links";
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500">
            <BrandIcon id="github" className="h-4 w-4" />
          </span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void preview();
            }}
            placeholder="GitHub username"
            spellCheck={false}
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-400/50 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={preview}
          disabled={loading || !username.trim()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Preview repos
        </button>
      </div>

      {ghProfile ? (
        <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ghProfile.avatarUrl} alt={ghProfile.login} className="h-12 w-12 rounded-full" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {ghProfile.name ?? ghProfile.login}{" "}
              <span className="font-normal text-zinc-500">@{ghProfile.login}</span>
            </p>
            {ghProfile.bio ? <p className="truncate text-xs text-zinc-500">{ghProfile.bio}</p> : null}
          </div>
          <span className="shrink-0 text-xs text-zinc-500">
            ★ {ghProfile.followers} · {ghProfile.publicRepos} repos
          </span>
        </div>
      ) : null}

      {repos.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Select repos to import ({selected.size}/{repos.length})
            </p>
            <div className="flex gap-2 text-xs">
              <button type="button" onClick={() => setSelected(new Set(repos.map((r) => r.name)))} className="text-zinc-400 hover:text-white">
                All
              </button>
              <button type="button" onClick={() => setSelected(new Set())} className="text-zinc-400 hover:text-white">
                None
              </button>
            </div>
          </div>
          <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {repos.map((r) => (
              <li key={r.name}>
                <button
                  type="button"
                  onClick={() => toggle(r.name)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                    selected.has(r.name)
                      ? "border-violet-400/50 bg-violet-500/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px]",
                      selected.has(r.name)
                        ? "border-violet-400 bg-violet-500 text-white"
                        : "border-white/20 text-transparent",
                    )}
                  >
                    ✓
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.name}</span>
                    {r.description ? (
                      <span className="block truncate text-xs text-zinc-500">{r.description}</span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-zinc-500">
                    {r.language ?? "—"}
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3" /> {r.stars}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={importSelected}
            disabled={importing || selected.size === 0}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-40"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Import {selected.size} as links (merge — kuch delete nahi hoga)
          </button>
        </>
      ) : null}
    </div>
  );
}
