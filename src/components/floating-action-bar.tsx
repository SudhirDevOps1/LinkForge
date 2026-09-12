"use client";

// =============================================================================
// 📱 FloatingActionBar — Sticky Mobile Quick-Action Dock
// Features:
// - Always-accessible bottom pill dock on mobile screens
// - 1-tap WhatsApp DM (if available in creator's links)
// - 1-tap Save Contact (.vcf)
// - 1-tap Share Profile & QR Code Modal
// - 1-tap Copy Profile URL with toast feedback
// =============================================================================
import { useEffect, useState } from "react";
import { MessageCircle, QrCode, Share2, UserPlus, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import type { Link } from "@/db/schema";

interface FloatingActionBarProps {
  displayName: string;
  slug: string;
  bio?: string;
  avatarUrl?: string | null;
  links: Link[];
  accentColor?: string;
}

export function FloatingActionBar({
  displayName,
  slug,
  bio,
  avatarUrl,
  links,
  accentColor = "#8b5cf6",
}: FloatingActionBarProps) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Detect WhatsApp link from creator's active links
  const waLink = links.find(
    (l) =>
      l.isActive &&
      (l.type === "whatsapp" ||
        (l.url && (l.url.includes("wa.me") || l.url.includes("api.whatsapp.com"))))
  );

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${slug}`
      : `https://linkforge-demo.vercel.app/${slug}`;

  // Generate QR code when modal opens
  useEffect(() => {
    if (qrOpen) {
      QRCode.toDataURL(profileUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [qrOpen, profileUrl]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success("Profile link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadVCard = () => {
    const vcardLines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${displayName}`,
      `N:${displayName};;;;`,
      bio ? `NOTE:${bio.replace(/\n/g, "\\n")}` : "",
      `URL:${profileUrl}`,
      avatarUrl ? `PHOTO;VALUE=URI:${avatarUrl}` : "",
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\r\n");

    const blob = new Blob([vcardLines], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "contact"}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Contact card (.vcf) saved!");
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} | LinkForge`,
          text: bio || `Check out ${displayName}'s profile!`,
          url: profileUrl,
        });
        return;
      } catch {
        // Fallback to QR modal if share is cancelled or rejected
      }
    }
    setQrOpen(true);
  };

  return (
    <>
      {/* Sticky Mobile Floating Dock */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 sm:hidden flex items-center gap-1.5 p-1.5 rounded-full bg-black/80 backdrop-blur-xl border shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-3 duration-300"
        style={{
          borderColor: `${accentColor}40`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 16px ${accentColor}25`,
        }}
      >
        {/* WhatsApp Button (if configured) */}
        {waLink && (
          <a
            href={waLink.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Chat on WhatsApp"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all active:scale-95"
          >
            <MessageCircle className="h-4 w-4 fill-emerald-400/30 text-emerald-400" />
            <span>Chat</span>
          </a>
        )}

        {/* Save Contact (.vcf) */}
        <button
          type="button"
          onClick={handleDownloadVCard}
          title="Save contact card"
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/10 text-xs font-medium transition-all active:scale-95"
        >
          <UserPlus className="h-3.5 w-3.5 text-violet-400" />
          <span>Save</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          title="Share profile"
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/10 text-xs font-medium transition-all active:scale-95"
        >
          <Share2 className="h-3.5 w-3.5 text-violet-400" />
          <span>Share</span>
        </button>

        {/* QR Code Button */}
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          title="Scan QR Code"
          className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-zinc-300 border border-white/10 transition-all active:scale-95"
        >
          <QrCode className="h-4 w-4 text-violet-400" />
        </button>

        {/* Copy URL Button */}
        <button
          type="button"
          onClick={handleCopy}
          title="Copy Profile URL"
          className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-zinc-300 border border-white/10 transition-all active:scale-95"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4 text-zinc-400" />
          )}
        </button>
      </div>

      {/* QR Code Modal for Mobile Dock */}
      {qrOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-3xl border border-white/15 bg-zinc-950 p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white font-display mb-1">
              Scan Profile QR
            </h3>
            <p className="text-xs text-zinc-400 mb-4 truncate">
              {displayName} (@{slug})
            </p>

            <div className="flex justify-center p-3 rounded-2xl bg-white shadow-inner mb-4">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-56 h-56 rounded-lg"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-zinc-400 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-zinc-200 hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Link"}</span>
              </button>
              <button
                type="button"
                onClick={() => setQrOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
