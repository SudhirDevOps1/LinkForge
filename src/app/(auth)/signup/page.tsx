"use client";

// =============================================================================
// 📝 Signup Page — Hardened Enterprise Registration
// -----------------------------------------------------------------------------
// - ALTCHA Proof-of-Work anti-bot protection
// - Client-side cooldown countdown on rate limits
// - Strict validation and clean generic error feedback
// =============================================================================
import { Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Field, Input } from "@/components/ui";
import { AltchaWidget } from "@/components/auth/AltchaWidget";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [altchaToken, setAltchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Countdown timer for rate limiting
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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, altcha: altchaToken }),
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

        toast.error(data.error ?? "Registration failed. Please check your details.");
        return;
      }

      toast.success("Account created successfully — welcome to LinkForge!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const isLockedOut = cooldownSeconds > 0;

  return (
    <form
      onSubmit={onSubmit}
      className="glass noise relative rounded-3xl p-8 shadow-2xl"
    >
      <h1 className="font-display text-2xl font-bold">Create your page</h1>
      <p className="mt-1.5 text-sm text-zinc-400">
        Launch your personal link-in-bio page in 30 seconds — free forever
      </p>

      {isLockedOut && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400 animate-pulse" />
          <div>
            <span className="font-semibold text-amber-300">Rate Limit Active:</span>{" "}
            Too many registrations from this network. Please wait{" "}
            <span className="font-mono font-bold text-white">{cooldownSeconds}s</span> before retrying.
          </div>
        </div>
      )}

      <div className="mt-7 space-y-5">
        <Field label="Your name">
          <Input
            required
            maxLength={80}
            disabled={isLockedOut || loading}
            autoComplete="name"
            placeholder="Aarav Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

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

        <Field
          label="Password"
          hint="Minimum 8 characters, at least one letter and one number required"
        >
          <Input
            type="password"
            required
            minLength={8}
            disabled={isLockedOut || loading}
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            <>
              <Sparkles className="h-4 w-4" />
              Create account
            </>
          )}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
          Sign in
        </Link>
      </p>
    </form>
  );
}
