"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";

const POPULAR_SUGGESTIONS = ["sudhir", "aarav.dev", "priya.design", "creator", "studio", "tech"];

export function HeroClaimBar() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const clean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (clean !== slug) {
      setSlug(clean);
      return;
    }

    if (!clean) {
      setStatus("idle");
      setMessage("");
      return;
    }

    if (clean.length < 3) {
      setStatus("invalid");
      setMessage("Kam se kam 3 characters zaroori hain");
      return;
    }

    setStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username/check?slug=${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (data.available) {
          setStatus("available");
          setMessage("Available! Aapka link 100% free hai");
        } else {
          setStatus("taken");
          setMessage(data.reason || "Yeh username already booked hai");
        }
      } catch {
        setStatus("available");
        setMessage("Available! Free forever");
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [slug]);

  function handleClaim(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const clean = slug.trim().toLowerCase();
    if (clean.length >= 3) {
      router.push(`/signup?claim=${encodeURIComponent(clean)}`);
    } else {
      router.push("/signup");
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-2xl px-2">
      <form
        onSubmit={handleClaim}
        className="group relative flex flex-col items-center gap-2 rounded-2xl border border-violet-500/30 bg-ink-950/80 p-2 shadow-[0_0_50px_rgba(139,92,246,0.2)] backdrop-blur-xl sm:flex-row sm:rounded-full"
      >
        <div className="flex w-full flex-1 items-center gap-1.5 px-3 py-2 sm:py-0">
          <span className="select-none text-xs font-semibold text-zinc-500 sm:text-sm">
            linkforge-demo.vercel.app/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="your-name"
            maxLength={39}
            className="w-full bg-transparent font-display text-sm font-bold text-white placeholder-zinc-600 outline-none sm:text-base"
          />
          {status === "checking" && <Loader2 className="h-4 w-4 animate-spin text-violet-400" />}
          {status === "available" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          {status === "taken" && <XCircle className="h-4 w-4 text-rose-400" />}
        </div>

        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 font-display text-sm font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(139,92,246,0.6)] active:scale-[0.98] sm:w-auto sm:rounded-full"
        >
          <Sparkles className="h-4 w-4" />
          <span>Claim Link</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {/* Real-time feedback badge */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
        {status === "available" && (
          <span className="flex items-center gap-1.5 font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            {message}
          </span>
        )}
        {status === "taken" && (
          <span className="font-medium text-rose-400">{message}</span>
        )}
        {status === "invalid" && (
          <span className="font-medium text-amber-400">{message}</span>
        )}
        {status === "idle" && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-zinc-500">
            <span className="text-[11px] uppercase tracking-wider text-zinc-600">Ideas:</span>
            {POPULAR_SUGGESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSlug(item)}
                className="rounded-md border border-white/5 bg-white/[0.03] px-2 py-0.5 text-xs text-zinc-400 transition-colors hover:border-violet-500/40 hover:text-violet-300"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
