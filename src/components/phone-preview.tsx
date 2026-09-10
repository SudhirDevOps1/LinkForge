"use client";

// =============================================================================
// 📱 PhonePreview — Interactive responsive live bio preview studio
// Supports iPhone 16 Pro, Android Pixel & Frameless device frames,
// zoom scaling (80%, 90%, 100%), live theme quick-switch, and 1-click URL copy.
// =============================================================================
import {
  Check,
  Copy,
  ExternalLink,
  Laptop,
  Maximize2,
  Minimize2,
  Palette,
  RotateCcw,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Link } from "@/db/schema";
import { BioRenderer, type BioProfileShape } from "./bio-renderer";
import { cn } from "@/components/ui";
import { THEMES } from "@/lib/themes";

export type DeviceFrame = "iphone" | "android" | "frameless";
export type ZoomLevel = 80 | 90 | 100;

export function PhonePreview({
  profile,
  links,
  slug,
  className,
}: {
  profile: BioProfileShape;
  links: Link[];
  slug?: string | null;
  className?: string;
}) {
  const [device, setDevice] = useState<DeviceFrame>("iphone");
  const [zoom, setZoom] = useState<ZoomLevel>(100);
  const [copied, setCopied] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  const activeThemeId = previewTheme || profile.theme;
  const activeProfile: BioProfileShape = {
    ...profile,
    theme: activeThemeId,
  };

  const profileSlug = slug || profile.displayName.toLowerCase().replace(/[^a-z0-9]/g, "") || "bio";
  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${profileSlug}`
    : `https://linkforge-demo.vercel.app/${profileSlug}`;

  function copyPublicUrl() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Profile URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  function refresh() {
    setKey((prev) => prev + 1);
    toast.info("Preview refreshed");
  }

  return (
    <div className={cn("sticky top-6 mx-auto flex w-full max-w-[360px] flex-col items-center", className)}>
      {/* Top Device & Zoom Controls Toolbar */}
      <div className="mb-3 flex w-full items-center justify-between gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-xl">
        {/* Device Switcher */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDevice("iphone")}
            title="iPhone 16 Pro View"
            className={cn(
              "flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium transition-all",
              device === "iphone"
                ? "bg-violet-500/20 text-violet-200 border border-violet-500/30"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">iPhone</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("android")}
            title="Android / Pixel View"
            className={cn(
              "flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium transition-all",
              device === "android"
                ? "bg-violet-500/20 text-violet-200 border border-violet-500/30"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Laptop className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pixel</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("frameless")}
            title="Frameless View"
            className={cn(
              "flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium transition-all",
              device === "frameless"
                ? "bg-violet-500/20 text-violet-200 border border-violet-500/30"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clean</span>
          </button>
        </div>

        {/* Zoom & Refresh */}
        <div className="flex items-center gap-1">
          <div className="flex items-center rounded-xl bg-black/40 p-0.5 border border-white/5 text-[10px] font-semibold text-zinc-400">
            {([80, 90, 100] as ZoomLevel[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setZoom(lvl)}
                className={cn(
                  "rounded-lg px-1.5 py-0.5 transition-colors",
                  zoom === lvl ? "bg-white/15 text-white" : "hover:text-zinc-200"
                )}
              >
                {lvl}%
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={refresh}
            title="Refresh Preview"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* URL pill & Quick Actions */}
      <div className="mb-3 flex w-full items-center justify-between gap-2 rounded-xl border border-white/8 bg-black/40 px-3 py-1.5 text-xs">
        <span className="flex items-center gap-1.5 truncate text-zinc-400 font-mono text-[11px]">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate">/{profileSlug}</span>
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={copyPublicUrl}
            title="Copy Public Bio URL"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            title="Open Live Public Bio in New Tab"
            className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Outer Scaled Frame Wrapper */}
      <div
        style={{
          transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
          transformOrigin: "top center",
          height: zoom === 80 ? "512px" : zoom === 90 ? "576px" : "640px",
          width: "320px",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="relative"
      >
        {/* Device Frame */}
        <div
          className={cn(
            "relative h-[640px] w-[320px] overflow-hidden bg-black p-2.5 transition-all shadow-[0_30px_90px_-20px_rgba(139,92,246,.35)]",
            device === "iphone" && "rounded-[48px] border-[3px] border-zinc-700/80 ring-1 ring-white/20",
            device === "android" && "rounded-[38px] border-[2px] border-zinc-700/60 ring-1 ring-white/10",
            device === "frameless" && "rounded-[28px] border border-white/15 shadow-2xl p-0"
          )}
        >
          {/* Hardware elements */}
          {device === "iphone" && (
            <>
              {/* Dynamic Island */}
              <div className="absolute left-1/2 top-4 z-30 flex h-6 w-24 -translate-x-1/2 items-center justify-between rounded-full bg-black px-2 ring-1 ring-white/10">
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-900 border border-zinc-700/50" />
                <div className="h-2 w-2 rounded-full bg-emerald-500/80 animate-pulse" />
              </div>
              {/* Speaker slit */}
              <div className="absolute left-1/2 top-2 z-20 h-1 w-12 -translate-x-1/2 rounded-full bg-zinc-800" />
            </>
          )}

          {device === "android" && (
            /* Punch hole camera */
            <div className="absolute left-1/2 top-3 z-30 h-3 w-3 -translate-x-1/2 rounded-full bg-black ring-1 ring-zinc-800" />
          )}

          {/* Screen area with smooth scroll */}
          <div
            className={cn(
              "relative h-full w-full overflow-hidden bg-ink-950",
              device === "iphone" && "rounded-[38px]",
              device === "android" && "rounded-[32px]",
              device === "frameless" && "rounded-[26px]"
            )}
          >
            <div
              key={key}
              className="h-full w-full overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <BioRenderer profile={activeProfile} links={links} trackClicks={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Theme Quick Switcher Strip */}
      <div className="mt-4 w-full rounded-2xl border border-white/8 bg-white/[0.03] p-2.5 backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            <Palette className="h-3 w-3 text-violet-400" />
            Quick Theme Preview
          </span>
          {previewTheme && (
            <button
              type="button"
              onClick={() => setPreviewTheme(null)}
              className="text-[10px] text-violet-300 hover:underline"
            >
              Reset to saved
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {THEMES.map((t) => {
            const isSelected = activeThemeId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setPreviewTheme(t.id)}
                title={t.name}
                className={cn(
                  "relative flex shrink-0 items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-medium transition-all",
                  isSelected
                    ? "border border-violet-400/60 bg-white/10 text-white ring-1 ring-violet-400/40"
                    : "border border-white/5 bg-black/30 text-zinc-400 hover:text-white hover:border-white/15"
                )}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full border border-white/20"
                  style={{ background: t.swatch[2] }}
                />
                <span className="truncate max-w-[70px]">{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-zinc-500">
        Live preview · Changes sync real-time automatically
      </p>
    </div>
  );
}
