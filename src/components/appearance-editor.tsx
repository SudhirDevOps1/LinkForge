"use client";

// =============================================================================
// 🎨 AppearanceEditor — theme picker + layout toggle + live preview
// =============================================================================
import { Check, LayoutGrid, List, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Link } from "@/db/schema";
import type { BioProfileShape } from "@/components/bio-renderer";
import { PhonePreview } from "@/components/phone-preview";
import { cn } from "@/components/ui";
import { THEMES } from "@/lib/themes";

export function AppearanceEditor({
  profile: initialProfile,
  links,
}: {
  profile: BioProfileShape;
  links: Link[];
}) {
  const [theme, setTheme] = useState(initialProfile.theme);
  const [layout, setLayout] = useState(initialProfile.layout);
  const [saving, setSaving] = useState(false);
  const dirty = theme !== initialProfile.theme || layout !== initialProfile.layout;

  const previewProfile = { ...initialProfile, theme, layout };

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, layout }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Save failed");
        return;
      }
      toast.success("Appearance save ho gayi");
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Appearance</h1>
            <p className="mt-1 text-sm text-zinc-500">Theme aur layout choose karein</p>
          </div>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-500 px-5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,.4)] transition-all hover:bg-violet-400 disabled:opacity-40 disabled:pointer-events-none"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </button>
        </div>

        {/* Layout toggle */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Layout
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "list", label: "Classic list", desc: "Simple vertical stack", icon: List },
              { id: "bento", label: "Bento grid", desc: "Pinterest-style spans", icon: LayoutGrid },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setLayout(opt.id)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all",
                  layout === opt.id
                    ? "border-violet-400/50 bg-violet-500/10 ring-glow"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20",
                )}
              >
                <opt.icon className={cn("h-5 w-5", layout === opt.id ? "text-violet-300" : "text-zinc-500")} />
                <span>
                  <span className="block text-sm font-semibold">{opt.label}</span>
                  <span className="block text-xs text-zinc-500">{opt.desc}</span>
                </span>
                {layout === opt.id ? <Check className="ml-auto h-4 w-4 text-violet-300" /> : null}
              </button>
            ))}
          </div>
        </section>

        {/* Theme grid */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Theme · {THEMES.length} available
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {THEMES.map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "group overflow-hidden rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5",
                    active
                      ? "border-violet-400/60 ring-glow"
                      : "border-white/10 hover:border-white/25",
                  )}
                >
                  <div className="relative h-24 p-2.5" style={{ background: t.swatch[0] }}>
                    <div className="space-y-1.5">
                      <div className="h-2 w-3/4 rounded-full" style={{ background: t.swatch[1] }} />
                      <div className="h-2 w-full rounded-full" style={{ background: t.swatch[1] }} />
                      <div className="h-2 w-2/3 rounded-full" style={{ background: t.swatch[2] }} />
                    </div>
                    {active ? (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    ) : null}
                  </div>
                  <div className="bg-ink-850 px-3 py-2.5">
                    <p className="text-xs font-semibold">{t.name}</p>
                    <p className="text-[10px] text-zinc-500">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="hidden lg:block">
        <PhonePreview profile={previewProfile} links={links} />
      </div>
    </div>
  );
}
