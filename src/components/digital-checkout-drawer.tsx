"use client";

import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  GraduationCap,
  Heart,
  Loader2,
  Lock,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "./ui";

export interface DigitalItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  price?: string;
  type: "course" | "product" | "lead_magnet" | "session" | "tip" | string;
  downloadUrl?: string;
  upiId?: string;
  syllabus?: Array<{ title: string; duration?: string; isFreePreview?: boolean }>;
}

interface DigitalCheckoutDrawerProps {
  item: DigitalItem | null;
  slug: string;
  displayName: string;
  onClose: () => void;
  accentColor?: string;
}

export function DigitalCheckoutDrawer({
  item,
  slug,
  displayName,
  onClose,
  accentColor = "#8b5cf6",
}: DigitalCheckoutDrawerProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  if (!item) return null;

  const isLeadMagnet =
    item.type === "lead_magnet" ||
    item.price?.toLowerCase().includes("free") ||
    item.title.toLowerCase().includes("free");

  const isCourse = item.type === "course" || item.title.toLowerCase().includes("course");
  const isSession = item.type === "session" || item.type === "cal" || item.title.toLowerCase().includes("session");
  const isTip = item.type === "tip" || item.type === "tipping";

  // Extract clean numerical amount if available
  const cleanAmount = item.price?.replace(/[^0-9.]/g, "") || "499";
  const upiPayee = item.upiId || "creator@upi";
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(upiPayee)}&pn=${encodeURIComponent(
    displayName,
  )}&am=${encodeURIComponent(cleanAmount)}&cu=INR&tn=${encodeURIComponent(item.title.slice(0, 30))}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    upiIntentUrl,
  )}`;

  async function handleClaimFreebie(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok && !data.alreadySubscribed) {
        throw new Error(data.error || "Subscription failed");
      }
      setUnlocked(true);
      toast.success("Access unlocked! Your download is ready.");
    } catch (err: any) {
      toast.error(err.message || "Failed to unlock free resource");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopyUpi() {
    navigator.clipboard.writeText(upiPayee);
    setCopiedUpi(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopiedUpi(false), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-white/15 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Close Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white font-bold text-xs shadow-md"
              style={{ background: accentColor }}
            >
              {isCourse ? (
                <GraduationCap className="w-4 h-4" />
              ) : isSession ? (
                <Calendar className="w-4 h-4" />
              ) : isTip ? (
                <Heart className="w-4 h-4" />
              ) : isLeadMagnet ? (
                <Download className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {isCourse
                  ? "Interactive Masterclass"
                  : isSession
                    ? "1:1 Video Consultation"
                    : isTip
                      ? "Support Creator"
                      : isLeadMagnet
                        ? "Free Digital Resource"
                        : "Digital Product"}
              </p>
              <p className="text-xs font-semibold text-zinc-200">{displayName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Title & Price Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
                {item.title}
              </h2>
              {item.price && (
                <span
                  className={cn(
                    "shrink-0 px-3 py-1 rounded-full text-xs font-black tracking-wide border shadow-sm",
                    isLeadMagnet
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-violet-500/20 text-violet-300 border-violet-500/30",
                  )}
                >
                  {item.price}
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-zinc-300">
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-white/5 bg-white/[0.02]">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Instant Digital Access</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-white/5 bg-white/[0.02]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>0% Platform Fees Direct</span>
            </div>
          </div>

          {/* Interactive Course Curriculum Preview */}
          {isCourse && item.syllabus && item.syllabus.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-violet-400" />
                  Course Curriculum ({item.syllabus.length} Modules)
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Full Lifetime Access</span>
              </div>
              <div className="space-y-1.5">
                {item.syllabus.map((lesson, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-500 w-5">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="font-medium text-zinc-200">{lesson.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {lesson.duration && (
                        <span className="text-[10px] text-zinc-500 font-mono">{lesson.duration}</span>
                      )}
                      {lesson.isFreePreview ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          PREVIEW
                        </span>
                      ) : (
                        <Lock className="w-3 h-3 text-zinc-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lead Magnet / Freebie Funnel */}
          {isLeadMagnet && (
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] space-y-3">
              {!unlocked ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" />
                      Enter your email to download instantly
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      We'll send you the download link and direct updates from {displayName}. Zero spam.
                    </p>
                  </div>
                  <form onSubmit={handleClaimFreebie} className="space-y-2">
                    <input
                      type="email"
                      required
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-zinc-900/80 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-emerald-400 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Unlock Free Download</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-3 space-y-3">
                  <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-300 mb-1">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Download Ready!</h3>
                  <p className="text-xs text-zinc-400">
                    Thank you for subscribing! Click below to download your file right now.
                  </p>
                  <a
                    href={item.downloadUrl || item.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Resource Now</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Paid Checkout: Direct UPI & Card Payment Options */}
          {!isLeadMagnet && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span>Select 0% Fee Payment Method</span>
                <span className="text-[10px] text-zinc-500 font-mono">Direct to Creator</span>
              </div>

              {/* UPI Instant Scan & Pay (Indian Creators & UPI users) */}
              <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 text-[10px] font-black">
                      UPI
                    </span>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">Instant UPI Direct Pay</p>
                      <p className="text-[10px] text-zinc-400">Google Pay, PhonePe, Paytm, BHIM</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQr(!showQr)}
                    className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showQr ? "Hide QR" : "Show QR"}</span>
                  </button>
                </div>

                {/* QR Code Canvas */}
                {showQr && (
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white text-zinc-950 space-y-2 animate-in fade-in duration-200">
                    <img
                      src={qrUrl}
                      alt="UPI QR Code"
                      className="w-48 h-48 rounded-lg"
                      loading="lazy"
                    />
                    <p className="text-[11px] font-bold text-zinc-800">
                      Scan with any UPI app to pay {item.price || `₹${cleanAmount}`}
                    </p>
                  </div>
                )}

                {/* UPI Mobile Intent & Copy Bar */}
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={upiIntentUrl}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-bold text-xs shadow-md transition-all text-center"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Open in UPI App</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 transition-colors shrink-0"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? "Copied" : "Copy ID"}</span>
                  </button>
                </div>
              </div>

              {/* Standard Web Checkout / Card / External Gateway */}
              <div className="flex flex-col gap-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/20 transition-all text-center"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Proceed to Card / Web Checkout ({item.price || "Instant"})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3 border-t border-white/5 bg-zinc-900/40 text-center text-[10px] text-zinc-500">
          Powered by LinkForge • 100% Secure Direct Creator Settlement
        </div>
      </div>
    </div>
  );
}
