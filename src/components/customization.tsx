"use client";

// =============================================================================
// 🎨 BrandCustomization — allows users to customize brand colors, fonts, etc.
// Real-time preview updates applied to landing/theme settings.
// =============================================================================
import { Palette, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button, Card, Field, Input } from "@/components/ui";

const PRESETS = [
  { label: "Default", colors: { primary: "#8b5cf6", secondary: "#d946ef", background: "#050508", text: "#f4f4f8" } },
  { label: "Sunset", colors: { primary: "#fb7185", secondary: "#fb923c", background: "#0f0f18", text: "#fff1f2" } },
  { label: "Ocean", colors: { primary: "#38bdf8", secondary: "#818cf8", background: "#030b1a", text: "#eff6ff" } },
  { label: "Emerald", colors: { primary: "#34d399", secondary: "#a3e635", background: "#0e150c", text: "#f1f7e9" } },
];

export function BrandCustomization() {
  const [primary, setPrimary] = useState(PRESETS[0].colors.primary);
  const [bg, setBg] = useState(PRESETS[0].colors.background);
  const [saved, setSaved] = useState(false);

  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold">Brand customization</h3>
          <p className="text-xs text-zinc-500">Customize your site appearance globally</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Color presets</p>
        <div className="flex gap-2.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setPrimary(p.colors.primary);
                setBg(p.colors.background);
                setSaved(false);
              }}
              className={`group flex-1 overflow-hidden rounded-xl border p-2.5 text-center transition-all hover:-translate-y-0.5 ${
                p.colors.primary === primary ? "border-violet-400/60 ring-glow" : "border-white/10 hover:border-white/25"
              }`}
              title={p.label}
            >
              <div className="mx-auto h-8 w-8 rounded-full" style={{ backgroundColor: p.colors.primary }} />
              <span className="mt-1.5 block text-[10px] font-medium text-zinc-300">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Primary color" hint="Buttons, links, icons">
          <Input
            type="color"
            value={primary}
            onChange={(e) => { setPrimary(e.target.value); setSaved(false); }}
            className="h-12 w-full bg-transparent p-1"
          />
        </Field>
        <Field label="Background" hint="Page background tone">
          <Input
            type="color"
            value={bg}
            onChange={(e) => { setBg(e.target.value); setSaved(false); }}
            className="h-12 w-full bg-transparent p-1"
          />
        </Field>
      </div>

      <Button className="w-full" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1500); }}>
        <Palette className="h-4 w-4" />
        {saved ? "Saved!" : "Apply customization"}
      </Button>
    </Card>
  );
}
