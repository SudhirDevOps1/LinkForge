"use client";

// =============================================================================
// 📱 QRCodeButton — profile page ka QR code generate karta hai + PNG download
// Uses qrcode library for canvas-based rendering
// =============================================================================
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { QrCode, Download, X } from "lucide-react";
import { Button } from "@/components/ui";

interface QRCodeButtonProps {
  url: string;
  displayName: string;
}

export function QRCodeButton({ url, displayName }: QRCodeButtonProps) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 280,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    }
  }, [open, url]);

  function downloadQR() {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${displayName.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Download QR Code"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200"
      >
        <QrCode className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-zinc-900 p-6 text-center shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-white">QR Code</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-center rounded-xl bg-white p-3">
              <canvas ref={canvasRef} />
            </div>
            <p className="mt-3 truncate text-xs text-zinc-500">{url}</p>
            <Button onClick={downloadQR} className="mt-4 w-full" variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
