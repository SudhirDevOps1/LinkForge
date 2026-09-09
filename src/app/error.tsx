"use client";

// =============================================================================
// 🚨 Route error boundary — koi bhi page crash ho to branded recovery UI
// (Next.js isko automatically pakadta hai — scary default screen nahi dikhegi)
// =============================================================================
import { Home, RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[linkforge] route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-72 w-[480px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px]" />
      </div>
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10">
        <TriangleAlert className="h-7 w-7 text-red-300" />
      </div>
      <h1 className="relative mt-6 font-display text-2xl font-bold text-white">
        Kuch gadbad ho gayi
      </h1>
      <p className="relative mt-2 max-w-sm text-sm text-zinc-500">
        Page load nahi ho paya. Thodi der baad dobara try karein — aapka data safe hai.
      </p>
      {error.digest ? (
        <p className="relative mt-3 font-mono text-[11px] text-zinc-600">
          ref: {error.digest}
        </p>
      ) : null}
      <div className="relative mt-8 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-400"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
        >
          <Home className="h-4 w-4" /> Home
        </Link>
      </div>
    </div>
  );
}
