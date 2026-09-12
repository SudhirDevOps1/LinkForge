"use client";

// =============================================================================
// 🎮 ThemePlayground — landing page ka interactive demo
// Visitors bina signup ke saare 12 themes + dono layouts live try kar sakte hain.
// =============================================================================
import { Check, LayoutGrid, List, MousePointerClick } from "lucide-react";
import { useState } from "react";
import type { Link } from "@/db/schema";
import { BioRenderer } from "@/components/bio-renderer";
import { THEMES } from "@/lib/themes";

function sampleLink(partial: Partial<Link> & { title: string; url: string }): Link {
  return {
    id: `sample-${partial.title}`,
    profileId: "sample",
    description: "",
    icon: "link",
    type: "link",
    size: "standard",
    position: 0,
    isActive: true,
    thumbnailUrl: null,
    isPinned: false,
    badge: null,
    isSpotlight: false,
    scheduledAt: null,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

const SAMPLE_LINKS: Link[] = [
  sampleLink({
    title: "Latest vlog — Goa diaries",
    url: "https://youtube.com",
    description: "12 min of sunshine",
    type: "youtube",
    size: "feature",
    position: 0,
  }),
  sampleLink({
    title: "Morning lo-fi mix",
    url: "https://open.spotify.com",
    description: "Code + coffee playlist",
    type: "spotify",
    size: "wide",
    position: 1,
  }),
  sampleLink({
    title: "Portfolio",
    url: "https://example.com",
    icon: "globe",
    position: 2,
  }),
  sampleLink({
    title: "Media kit (PDF)",
    url: "https://example.com",
    description: "Brand collaborations",
    type: "file",
    icon: "file",
    position: 3,
  }),
  sampleLink({
    title: "@maya.creates",
    url: "https://instagram.com",
    type: "instagram",
    position: 4,
  }),
];

export function ThemePlayground() {
  const [theme, setTheme] = useState("midnight");
  const [layout, setLayout] = useState("bento");

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
      {/* Controls */}
      <div className="glass rounded-3xl p-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
          <MousePointerClick className="h-3.5 w-3.5" />
          Try it live — no signup
        </p>

        <p className="mb-2.5 mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Layout
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "list", label: "List", icon: List },
            { id: "bento", label: "Bento", icon: LayoutGrid },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setLayout(opt.id)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                layout === opt.id
                  ? "border-violet-400/50 bg-violet-500/15 text-white"
                  : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
              }`}
            >
              <opt.icon className="h-4 w-4" />
              {opt.label}
            </button>
          ))}
        </div>

        <p className="mb-2.5 mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Theme · {THEMES.length}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={t.name}
                className={`group relative overflow-hidden rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${
                  active ? "border-violet-400/70 ring-glow" : "border-white/10"
                }`}
              >
                <span className="block h-12 p-1.5" style={{ background: t.swatch[0] }}>
                  <span className="block h-1.5 w-3/4 rounded-full" style={{ background: t.swatch[1] }} />
                  <span className="mt-1 block h-1.5 w-full rounded-full" style={{ background: t.swatch[1] }} />
                  <span className="mt-1 block h-1.5 w-2/3 rounded-full" style={{ background: t.swatch[2] }} />
                </span>
                <span className="block bg-ink-850 px-1 py-1 text-center text-[10px] font-medium text-zinc-300">
                  {t.name}
                </span>
                {active ? (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                ) : null}
              </button>
            );
          })}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs font-medium text-zinc-400">Custom accent:</span>
          <input
            type="color"
            value="#8b5cf6"
            onChange={(e) => {
              // Visual customization: changes preview accent dynamically
              const previewEl = document.querySelector(".preview-glow");
              if (previewEl) {
                (previewEl as HTMLElement).style.background = `radial-gradient(circle at center, ${e.target.value}22, transparent 70%)`;
              }
            }}
            className="h-8 w-12 rounded-lg border-0 bg-transparent p-0 cursor-pointer"
          />
        </div>
        </div>
      </div>

      {/* Mini browser preview */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-[0_40px_100px_-30px_rgba(139,92,246,.4)]">
        <div className="flex items-center gap-2 border-b border-white/5 bg-ink-850 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-3 flex-1 truncate rounded-lg bg-white/5 px-3 py-1 text-center font-mono text-[11px] text-zinc-400">
            linkforge.page/maya
          </span>
        </div>
        <div className="h-[560px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <BioRenderer
            profile={{
              displayName: "Maya Rao",
              bio: "Travel creator · 120k explorers · new vlog every Friday",
              avatarUrl: null,
              theme,
              layout,
            }}
            links={SAMPLE_LINKS}
            trackClicks={false}
          />
        </div>
      </div>
    </div>
  );
}
