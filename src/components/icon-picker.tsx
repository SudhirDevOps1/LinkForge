"use client";

// =============================================================================
// 🎨 IconPicker — 150+ Unified Searchable Icon Catalog & Color Customizer
// 🇮🇳 India Platforms (UPI, Paytm, PhonePe, GPay, Swiggy, Zomato, Flipkart, etc.)
// Global Brands (YouTube, Spotify, GitHub, WhatsApp, etc.) + Lucide Icons.
// Single unified searchable grid with Authentic Brand Color previews & Custom Color!
// =============================================================================

import { useMemo, useState } from "react";
import { Check, Eye, Palette, RotateCcw, Search, Sparkles } from "lucide-react";
import {
  ALL_ICONS,
  BRAND_COLORS,
  formatIcon,
  type IconCategory,
  parseIcon,
} from "./icons";
import { linkIcon } from "./bio-renderer";
import { cn } from "./ui";

const CATEGORY_TABS: { id: IconCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "india", label: "🇮🇳 India & UPI" },
  { id: "brands", label: "Brands" },
  { id: "social", label: "Social & Chat" },
  { id: "media", label: "Media & Audio" },
  { id: "shop", label: "Shop & Money" },
  { id: "tech", label: "Tech & Dev" },
  { id: "creative", label: "Creative" },
  { id: "general", label: "General" },
];

const POPULAR_BRAND_SWATCHES = [
  { hex: "#097939", name: "UPI Green" },
  { hex: "#5F259F", name: "PhonePe Purple" },
  { hex: "#00BAF2", name: "Paytm Blue" },
  { hex: "#FC8019", name: "Swiggy Orange" },
  { hex: "#CB202D", name: "Zomato Red" },
  { hex: "#2874F0", name: "Flipkart Blue" },
  { hex: "#FF0000", name: "YouTube Red" },
  { hex: "#1DB954", name: "Spotify Green" },
  { hex: "#25D366", name: "WhatsApp Green" },
  { hex: "#5865F2", name: "Discord Blurple" },
];

const STANDARD_PALETTE = [
  { hex: "#FFFFFF", name: "White" },
  { hex: "#EF4444", name: "Red" },
  { hex: "#F97316", name: "Orange" },
  { hex: "#F59E0B", name: "Amber" },
  { hex: "#10B981", name: "Emerald" },
  { hex: "#06B6D4", name: "Cyan" },
  { hex: "#3B82F6", name: "Blue" },
  { hex: "#8B5CF6", name: "Violet" },
  { hex: "#EC4899", name: "Pink" },
  { hex: "#71717A", name: "Zinc" },
];

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (formattedValue: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IconCategory>("all");
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  // Brand colors display toggle in grid — enabled by default so users see actual brand colors!
  const [gridBrandColors, setGridBrandColors] = useState(true);

  // Parse currently selected icon id & color
  const { id: selectedId, color: selectedColor } = useMemo(
    () => parseIcon(value),
    [value],
  );

  // Selected icon info & official brand color if available
  const selectedMeta = useMemo(
    () => ALL_ICONS.find((i) => i.id === selectedId),
    [selectedId],
  );

  const officialBrandColor = useMemo(
    () => BRAND_COLORS[selectedId] ?? selectedMeta?.brandColor,
    [selectedId, selectedMeta],
  );

  // Filter 150+ icons by query and category in ONE unified list
  const filteredIcons = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_ICONS.filter((item) => {
      // Category check
      if (category !== "all" && item.category !== category) return false;
      // Query check
      if (!q) return true;
      if (item.label.toLowerCase().includes(q)) return true;
      if (item.id.toLowerCase().includes(q)) return true;
      if (item.keywords?.some((k) => k.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [query, category]);

  function handleSelectIcon(item: (typeof ALL_ICONS)[number]) {
    // If user clicks a brand and no custom color was set, or if they choose a brand,
    // preserve color or format with chosen color
    onChange(formatIcon(item.id, selectedColor));
  }

  function handleSetColor(color?: string | null) {
    onChange(formatIcon(selectedId, color));
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-3.5 backdrop-blur-md shadow-2xl">
      {/* Top Header: Live Selected Icon Preview & Quick Color Actions */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/5 shadow-md transition-all"
            style={selectedColor ? { color: selectedColor } : undefined}
          >
            {linkIcon({ icon: value, type: "link" }, "h-6 w-6")}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">
                {selectedMeta?.label ?? selectedId}
              </span>
              {selectedMeta?.category === "india" && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                  🇮🇳 India
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Icon Color:{" "}
              {selectedColor ? (
                <span className="font-mono font-semibold text-white inline-flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full ring-1 ring-white/40"
                    style={{ backgroundColor: selectedColor }}
                  />
                  {selectedColor}
                  {selectedColor.toLowerCase() === officialBrandColor?.toLowerCase() && " (Official Brand)"}
                </span>
              ) : (
                <span className="text-zinc-500">Theme Default (Auto)</span>
              )}
            </p>
          </div>
        </div>

        {/* Color buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {officialBrandColor && (
            <button
              type="button"
              onClick={() => handleSetColor(officialBrandColor)}
              title={`Use official brand color (${officialBrandColor})`}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all shadow-sm",
                selectedColor?.toLowerCase() === officialBrandColor.toLowerCase()
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/50"
                  : "border-white/15 bg-white/5 text-zinc-200 hover:border-white/30 hover:bg-white/10 hover:text-white",
              )}
            >
              <span
                className="h-2.5 w-2.5 rounded-full ring-1 ring-white/50"
                style={{ backgroundColor: officialBrandColor }}
              />
              Official Color
            </button>
          )}

          <button
            type="button"
            onClick={() => setColorMenuOpen((prev) => !prev)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
              colorMenuOpen
                ? "border-violet-400 bg-violet-500/25 text-violet-100 ring-1 ring-violet-400/50"
                : selectedColor
                  ? "border-violet-500/50 bg-violet-500/15 text-violet-200"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10 hover:text-white",
            )}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>{colorMenuOpen ? "Hide Palette" : "Change Color"}</span>
          </button>

          {selectedColor && (
            <button
              type="button"
              onClick={() => handleSetColor(null)}
              title="Reset to Theme Color"
              className="flex h-7 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Color Customizer Panel */}
      {colorMenuOpen && (
        <div className="mb-3.5 rounded-xl border border-violet-500/30 bg-violet-500/[0.06] p-3 animate-in fade-in slide-in-from-top-1">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" /> Icon Color Customizer
            </span>
            <span className="text-[11px] text-zinc-400">Apply brand colors, swatches or custom hex</span>
          </div>

          {/* Quick presets */}
          <div className="space-y-2">
            {/* Top Brands row */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
                Popular Brand Colors
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {POPULAR_BRAND_SWATCHES.map((b) => (
                  <button
                    key={b.name}
                    type="button"
                    title={`${b.name} (${b.hex})`}
                    onClick={() => handleSetColor(b.hex)}
                    className={cn(
                      "group flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] transition-all",
                      selectedColor?.toLowerCase() === b.hex.toLowerCase()
                        ? "border-white bg-white/20 text-white font-medium shadow"
                        : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/25 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full ring-1 ring-black/40 shrink-0"
                      style={{ backgroundColor: b.hex }}
                    />
                    <span className="truncate max-w-[80px]">{b.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Standard Swatches & Custom Picker row */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetColor(null)}
                  className={cn(
                    "rounded-lg border px-2 py-1 text-xs transition-colors",
                    !selectedColor
                      ? "border-violet-400 bg-violet-500/20 text-white font-medium"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:text-white",
                  )}
                >
                  Theme Default
                </button>

                {STANDARD_PALETTE.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => handleSetColor(c.hex)}
                    className={cn(
                      "relative flex h-6 w-6 items-center justify-center rounded-full border transition-transform hover:scale-110",
                      selectedColor?.toLowerCase() === c.hex.toLowerCase()
                        ? "border-white ring-2 ring-violet-400 scale-105"
                        : "border-white/20",
                    )}
                    style={{ backgroundColor: c.hex }}
                  >
                    {selectedColor?.toLowerCase() === c.hex.toLowerCase() && (
                      <Check
                        className={cn(
                          "h-3 w-3",
                          c.hex === "#FFFFFF" ? "text-zinc-900" : "text-white",
                        )}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2 py-1">
                <input
                  type="color"
                  value={selectedColor || "#FFFFFF"}
                  onChange={(e) => handleSetColor(e.target.value)}
                  className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                  title="Custom color picker"
                />
                <input
                  type="text"
                  placeholder="#hex"
                  value={selectedColor || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.startsWith("#") || v === "") {
                      handleSetColor(v || null);
                    }
                  }}
                  className="w-18 bg-transparent text-xs font-mono text-white placeholder:text-zinc-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Input & Grid Color Toggle Bar */}
      <div className="mb-2.5 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 150+ icons… (upi, paytm, phonepe, insta, yt, music, shop, code, food)"
            className="h-9.5 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-8 text-xs text-white placeholder:text-zinc-500 focus:border-violet-400/50 focus:bg-white/[0.08] focus:outline-none transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Toggle Brand Colors in Grid */}
        <button
          type="button"
          onClick={() => setGridBrandColors((prev) => !prev)}
          title="Grid me brand colors dikhayein ya monochrome"
          className={cn(
            "flex h-9.5 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-medium transition-colors",
            gridBrandColors
              ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
              : "border-white/10 bg-white/5 text-zinc-400 hover:text-white",
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{gridBrandColors ? "Brand Colors: ON" : "Brand Colors: OFF"}</span>
        </button>
      </div>

      {/* Quick Category Filter Pills (No split tabs — all searchable together!) */}
      <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const count =
            tab.id === "all"
              ? ALL_ICONS.length
              : ALL_ICONS.filter((i) => i.category === tab.id).length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategory(tab.id)}
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all",
                category === tab.id
                  ? "bg-violet-500 text-white shadow-sm"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "ml-1 text-[10px]",
                  category === tab.id ? "text-violet-200" : "text-zinc-500",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Unified 150+ Icons Grid */}
      <div className="grid max-h-56 grid-cols-6 sm:grid-cols-8 md:grid-cols-9 gap-1.5 overflow-y-auto pr-1">
        {filteredIcons.map((item) => {
          const isSelected = selectedId === item.id;
          // Determine color for icon in grid:
          // If selected and user has custom color, use user's custom color.
          // Otherwise, if gridBrandColors is ON and item has a brand color, render with brand color!
          const iconColor =
            isSelected && selectedColor
              ? selectedColor
              : gridBrandColors && item.brandColor
                ? item.brandColor
                : undefined;

          return (
            <button
              key={item.id}
              type="button"
              title={`${item.label}${item.category === "india" ? " (🇮🇳 India)" : ""}`}
              onClick={() => handleSelectIcon(item)}
              className={cn(
                "group relative flex aspect-square flex-col items-center justify-center rounded-xl border p-1 transition-all",
                isSelected
                  ? "border-violet-400/90 bg-violet-500/20 text-white shadow-lg shadow-violet-500/10 ring-2 ring-violet-400/50"
                  : "border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:bg-white/5 hover:text-white",
              )}
            >
              <div
                className="flex items-center justify-center transition-transform group-hover:scale-110"
                style={iconColor ? { color: iconColor } : undefined}
              >
                {linkIcon({ icon: item.id, type: "link" }, "h-5 w-5")}
              </div>
              <span className="mt-1 w-full truncate text-[9px] text-center font-normal text-zinc-400 group-hover:text-zinc-200">
                {item.label}
              </span>

              {/* India badge indicator */}
              {item.category === "india" && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm" />
              )}
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredIcons.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-xs text-zinc-400 font-medium">No icons found</p>
          <p className="mt-1 text-[11px] text-zinc-600">
            Try searching for "link", "music", "video", "shop", "code", or "mail" instead of "{query}"
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500 px-1">
        <span>{filteredIcons.length} icons available</span>
        <span>Click icon to select · Custom & brand colors supported</span>
      </div>
    </div>
  );
}
