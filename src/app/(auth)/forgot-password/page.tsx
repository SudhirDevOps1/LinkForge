"use client";

// =============================================================================
// ✉️ Forgot Password Page — Hardened Password Reset Request
// -----------------------------------------------------------------------------
// - ALTCHA Proof-of-Work anti-bot protection
// - Anti-enumeration generic confirmation messaging
// - Client-side cooldown countdown on rate limits
// =============================================================================
import { Clock, MailCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Field, Input } from "@/components/ui";
import { AltchaWidget } from "@/components/auth/AltchaWidget";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [altchaToken, setAltchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Rate limit countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldownSeconds > 0) return;

    if (!altchaToken) {
      toast.error("Please complete the security challenge verification.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, altcha: altchaToken }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        retryAfter?: number;
      };

      if (!res.ok) {
        if (res.status === 429) {
          const waitTime = Number(data.retryAfter) || 60;
          setCooldownSeconds(waitTime);
          toast.error(`Too many attempts. Please wait ${waitTime} seconds.`);
          return;
        }

        toast.error(data.error ?? "Request failed — please try again in a few moments");
        return;
      }

      setSent(true);
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const isLockedOut = cooldownSeconds > 0;

  return (
    <div className="glass noise relative rounded-3xl p-8 shadow-2xl">
      {sent ? (
        <div className="text-center">
          <MailCheck className="mx-auto h-10 w-10 text-emerald-300" />
          <h1 className="mt-4 font-display text-2xl font-bold">Check your inbox</h1>
          <p className="mt-2 text-sm text-zinc-400">
            If an account exists for <span className="text-zinc-200">{email}</span>,
            a reset link has been sent. The link remains valid for 1 hour.
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm font-medium text-violet-300 hover:text-violet-200">
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <h1 className="font-display text-2xl font-bold">Reset password</h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Enter your email address to receive a password reset link
          </p>

          {isLockedOut && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400 animate-pulse" />
              <div>
                <span className="font-semibold text-amber-300">Rate Limit Active:</span>{" "}
                Please wait{" "}
                <span className="font-mono font-bold text-white">{cooldownSeconds}s</span> before requesting another reset link.
              </div>
            </div>
          )}

          <div className="mt-7 space-y-5">
            <Field label="Email">
              <Input
                type="email"
                required
                disabled={isLockedOut || loading}
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            {/* ALTCHA Proof-of-Work Verification */}
            <div className="pt-1">
              <AltchaWidget
                onVerify={(token) => setAltchaToken(token)}
                onExpire={() => setAltchaToken(null)}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
              disabled={isLockedOut || loading || !altchaToken}
            >
              {isLockedOut ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Locked for {cooldownSeconds}s
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-zinc-500">
            <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
              ← Back to sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
