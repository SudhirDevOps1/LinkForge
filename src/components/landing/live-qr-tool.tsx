"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Download, Copy, Check, Sparkles, Sliders } from "lucide-react";
import { Reveal } from "./anim";

const COLOR_PRESETS = [
  { label: "Violet", color: "#8b5cf6", bg: "#ffffff" },
  { label: "Cyber Cyan", color: "#06b6d4", bg: "#ffffff" },
  { label: "Emerald", color: "#10b981", bg: "#ffffff" },
  { label: "Rose", color: "#f43f5e", bg: "#ffffff" },
  { label: "Classic Black", color: "#09090b", bg: "#ffffff" },
];

export function LiveQrTool() {
  const [url, setUrl] = useState("https://linkforge-demo.vercel.app/sudhir");
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadPng() {
    const svg = svgRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    canvas.width = 600;
    canvas.height = 600;

    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = selectedColor.bg;
      ctx.fillRect(0, 0, 600, 600);
      ctx.drawImage(img, 40, 40, 520, 520);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "linkforge-qr.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  return (
    <section id="qr-tool" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-24">
      <Reveal className="mb-14 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-300">
          <QrCode className="h-3.5 w-3.5" />
          Interactive QR Generator
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Live Vector QR Code Studio — <span className="text-gradient">Ready to Print</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Enter your bio link, select your color palette, and instantly generate and download a crisp, print-ready vector QR code.
        </p>
      </Reveal>

      <Reveal delay={150}>
        <div className="glass mx-auto max-w-4xl rounded-[2.5rem] border-white/10 p-6 sm:p-10">
          <div className="grid items-center gap-8 md:grid-cols-12">
            {/* Controls */}
            <div className="space-y-6 md:col-span-7">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Target Bio Link or Custom URL
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://linkforge-demo.vercel.app/yourname"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-violet-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs font-semibold text-zinc-300 hover:bg-white/10"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  QR Brand Color
                </label>
                <div className="mt-2 flex flex-wrap gap-2.5">
                  {COLOR_PRESETS.map((p) => {
                    const isPicked = selectedColor.label === p.label;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setSelectedColor(p)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                          isPicked
                            ? "border-violet-400 bg-white/10 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                            : "border-white/5 bg-white/[0.02] text-zinc-400 hover:text-white"
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full ring-1 ring-white/20"
                          style={{ backgroundColor: p.color }}
                        />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specs Badge */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-zinc-400">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div>
                    <span className="block text-[10px] uppercase text-zinc-500">Resolution</span>
                    <span className="font-semibold text-zinc-200">Vector SVG / 600px PNG</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-zinc-500">Format</span>
                    <span className="font-semibold text-zinc-200">ISO/IEC 18004</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-zinc-500">Error Correction</span>
                    <span className="font-semibold text-zinc-200">Level M (15%)</span>
                  </div>
                </div>
              </div>

              {/* Download CTA */}
              <button
                type="button"
                onClick={handleDownloadPng}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 font-display text-sm font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Download className="h-4 w-4" />
                <span>Download Print-Ready PNG (600x600)</span>
              </button>
            </div>

            {/* QR Preview Card */}
            <div className="flex flex-col items-center justify-center md:col-span-5">
              <div className="group relative rounded-3xl bg-white p-6 shadow-2xl transition-all duration-300 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                <QRCodeSVG
                  ref={svgRef}
                  value={url || "https://linkforge-demo.vercel.app"}
                  size={200}
                  level="M"
                  fgColor={selectedColor.color}
                  bgColor={selectedColor.bg}
                  marginSize={1}
                />
              </div>
              <p className="mt-4 font-mono text-xs text-zinc-400">
                Scan with any smartphone camera
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
