"use client";

// =============================================================================
// 🎨 IconPicker — searchable real-brand + lucide icon picker (link dialog)
// 29 real brand SVGs (icons.tsx) + 13 lucide generics. Live preview ke saath.
// =============================================================================
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { BrandIcon, BRAND_IDS, BRAND_LABELS } from "./icons";
import { linkIcon } from "./bio-renderer";
import { cn } from "./ui";

const LUCIDE_OPTIONS = [
  { id: "link", label: "Link" },
  { id: "globe", label: "Website" },
  { id: "mail", label: "Email" },
  { id: "calendar", label: "Booking" },
  { id: "camera", label: "Photos" },
  { id: "video", label: "Video" },
  { id: "music", label: "Music" },
  { id: "play", label: "Play" },
  { id: "shop", label: "Shop" },
  { id: "file", label: "File / PDF" },
  { id: "star", label: "Featured" },
  { id: "heart", label: "Support" },
  { id: "at", label: "Mention" },
];

export function IconPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"brands" | "generic">(
    BRAND_IDS.includes(value) ? "brands" : "generic",
  );

  const brands = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BRAND_IDS.map((id) => ({ id, label: BRAND_LABELS[id] ?? id })).filter(
      (b) => !q || b.label.toLowerCase().includes(q) || b.id.includes(q),
    );
  }, [query]);

  const generics = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LUCIDE_OPTIONS.filter(
      (g) => !q || g.label.toLowerCase().includes(q) || g.id.includes(q),
    );
  }, [query]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-violet-300">
          {linkIcon({ icon: value, type: "link" }, "h-5 w-5")}
        </span>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons… (github, music, shop)"
            className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-2 text-sm text-white placeholder:text-zinc-600 focus:border-violet-400/50 focus:outline-none"
          />
        </div>
      </div>
      <div className="mb-2 flex gap-1.5">
        {(["brands", "generic"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-semibold transition-colors",
              tab === t ? "bg-violet-500 text-white" : "text-zinc-400 hover:text-white",
            )}
          >
            {t === "brands" ? `Brands · ${BRAND_IDS.length}` : `Generic · ${LUCIDE_OPTIONS.length}`}
          </button>
        ))}
      </div>
      <div className="grid max-h-44 grid-cols-8 gap-1.5 overflow-y-auto pr-1">
        {tab === "brands"
          ? brands.map((b) => (
              <button
                key={b.id}
                type="button"
                title={b.label}
                onClick={() => onChange(b.id)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg border p-1.5 transition-all",
                  value === b.id
                    ? "border-violet-400/60 bg-violet-500/15 text-violet-200"
                    : "border-white/5 text-zinc-400 hover:border-white/20 hover:text-white",
                )}
              >
                <BrandIcon id={b.id} className="h-5 w-5" />
              </button>
            ))
          : generics.map((g) => (
              <button
                key={g.id}
                type="button"
                title={g.label}
                onClick={() => onChange(g.id)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg border p-1.5 transition-all",
                  value === g.id
                    ? "border-violet-400/60 bg-violet-500/15 text-violet-200"
                    : "border-white/5 text-zinc-400 hover:border-white/20 hover:text-white",
                )}
              >
                {linkIcon({ icon: g.id, type: "link" }, "h-5 w-5")}
              </button>
            ))}
      </div>
      {(tab === "brands" ? brands : generics).length === 0 ? (
        <p className="mt-2 text-center text-xs text-zinc-500">Koi icon nahi mila — search badlo</p>
      ) : null}
    </div>
  );
}
