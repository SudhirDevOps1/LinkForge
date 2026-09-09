"use client";

// =============================================================================
// 📤 ShareButton — native share + copy link + QR code (public bio pages)
// Web Share API (mobile) → clipboard fallback (desktop) + QR dialog + download.
// =============================================================================
import { Check, Copy, Download, QrCode, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, cn } from "./ui";

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  async function share() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* dismissed → fallback below */
      }
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadQr() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "linkforge-qr.svg";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <div className="mt-8 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={share}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-medium transition-colors hover:bg-white/5"
        >
          <Share2 className="h-4 w-4" /> Share
        </button>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors",
            copied ? "border-emerald-400/40 text-emerald-300" : "border-white/15 hover:bg-white/5",
          )}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          aria-label="Show QR code"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 transition-colors hover:bg-white/5"
        >
          <QrCode className="h-4 w-4" />
        </button>
      </div>
      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} title="Scan to open">
        <div ref={qrRef} className="flex justify-center rounded-2xl bg-white p-5">
          <QRCodeSVG value={url} size={220} level="M" />
        </div>
        <p className="mt-3 break-all text-center text-xs text-zinc-500">{url}</p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={downloadQr}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-violet-500 px-4 text-sm font-semibold text-white hover:bg-violet-400"
          >
            <Download className="h-4 w-4" /> Download QR
          </button>
        </div>
      </Dialog>
    </>
  );
}
