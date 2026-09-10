"use client";

// =============================================================================
// 📬 NewsletterSubscribe — Public Bio Page Verified Email Subscription
// -----------------------------------------------------------------------------
// Elegant glassmorphism subscribe box with real-time MX DNS verification,
// disposable email filtering, and smooth state transitions.
// =============================================================================
import { Check, Loader2, Mail, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function NewsletterSubscribe({
  slug,
  displayName,
  accentColor = "#8b5cf6",
}: {
  slug: string;
  displayName: string;
  accentColor?: string;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || submitting) return;

    setSubmitting(true);
    setStatusMessage(null);
    setIsError(false);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email: email.trim() }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        error?: string;
        alreadySubscribed?: boolean;
      };

      if (!res.ok) {
        let errText = data.error ?? "Subscription failed";
        if (errText.includes("Failed query") || errText.includes("relation") || errText.includes("syntax")) {
          errText = "Database provisioning in progress. Kripya kuchh seconds baad dobara try karein.";
        }
        throw new Error(errText);
      }

      setSubscribed(true);
      setStatusMessage(data.message ?? "Successfully subscribed! 🎉");
      toast.success(data.message ?? "Subscribed! 🎉");
    } catch (err) {
      const msg = (err as Error).message;
      setIsError(true);
      setStatusMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-white/20">
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${accentColor}25`, color: accentColor }}
        >
          <Mail className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-zinc-100 flex items-center gap-1.5">
            Stay in the loop <Sparkles className="h-3 w-3 text-amber-300 opacity-80" />
          </h3>
          <p className="text-xs text-zinc-400">
            {displayName} ke naye links aur updates email par paane ke liye subscribe karein.
          </p>
        </div>
      </div>

      {subscribed ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-medium text-emerald-300 animate-in fade-in zoom-in-95 duration-200">
          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (isError) setIsError(false);
            }}
            placeholder="apna.email@example.com"
            required
            disabled={submitting}
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-400 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
            style={{ background: accentColor }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying MX…
              </>
            ) : (
              "Subscribe"
            )}
          </button>
        </form>
      )}

      {isError && statusMessage && !subscribed ? (
        <p className="mt-2 text-[11px] font-medium text-rose-400 animate-in fade-in duration-150">
          ⚠️ {statusMessage}
        </p>
      ) : null}

      <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-500">
        <span>🔒 Zero Spam · Real MX Verified</span>
        <span>Unsubscribe anytime</span>
      </div>
    </div>
  );
}
