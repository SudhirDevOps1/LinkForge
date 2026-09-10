// 🔍 Root 404 — branded not-found page
import { Compass, Home } from "lucide-react";
import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink-950 px-6 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-72 w-[520px] -translate-x-1/2 rounded-full bg-violet-600/12 blur-[120px]" />
      </div>
      <p className="relative font-display text-8xl font-bold tracking-tight text-white/10">
        404
      </p>
      <div className="relative -mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
        <Compass className="h-7 w-7 text-violet-300" />
      </div>
      <h1 className="relative mt-6 font-display text-2xl font-bold text-white">
        Rasta bhatak gaye?
      </h1>
      <p className="relative mt-2 max-w-sm text-sm text-zinc-500">
        Yeh page exist nahi karta — ho sakta hai URL galat ho ya page hata diya gaya ho.
      </p>
      <div className="relative mt-8 flex gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-400"
        >
          <Home className="h-4 w-4" /> Home
        </Link>
        <Link
          href="/#playground"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
        >
          Explore themes
        </Link>
      </div>
    </div>
  );
}
