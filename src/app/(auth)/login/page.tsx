"use client";

// =============================================================================
// 🔑 Login Page — Hardened Enterprise Authentication
// -----------------------------------------------------------------------------
// - ALTCHA Proof-of-Work anti-bot protection
// - Client-side lockout & cooldown countdown on rate limits or repeated failures
// - Generic error handling against user enumeration
// =============================================================================
import { AlertCircle, Clock, Eye, EyeOff, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Field, Input } from "@/components/ui";
import { AltchaWidget } from "@/components/auth/AltchaWidget";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [altchaToken, setAltchaToken] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // Client-side cooldown & rate limit state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown countdown timer
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, altcha: altchaToken }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        retryAfter?: number;
      };

      if (!res.ok) {
        // Handle 429 Rate Limit
        if (res.status === 429) {
          const waitTime = Number(data.retryAfter) || 60;
          setCooldownSeconds(waitTime);
          toast.error(`Too many attempts. Please wait ${waitTime} seconds.`);
          return;
        }

        // Track failed attempt count
        const newFails = failedAttempts + 1;
        setFailedAttempts(newFails);

        // After 5 consecutive client-side failures, enforce a 30s local cooldown
        if (newFails >= 5) {
          setCooldownSeconds(30);
          toast.error("Multiple failed attempts. Please wait 30 seconds before retrying.");
        } else {
          toast.error(data.error ?? "Invalid email or password");
        }
        return;
      }

      // Reset failure tracking on success
      setFailedAttempts(0);
      setCooldownSeconds(0);
      toast.success("Welcome back!");
      router.push(params.get("next") ?? "/dashboard");
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
      <h1 className="font-display text-2xl font-bold">Welcome back</h1>
      <p className="mt-1.5 text-sm text-zinc-400">
        Sign in to your LinkForge creator account
      </p>

      {/* Cooldown / Lockout Warning Banner */}
      {isLockedOut && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400 animate-pulse" />
          <div>
            <span className="font-semibold text-amber-300">Rate Limit Active:</span>{" "}
            Too many attempts. For your security, submission is paused for{" "}
            <span className="font-mono font-bold text-white">{cooldownSeconds}s</span>.
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

        <Field label="Password">
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              required
              disabled={isLockedOut || loading}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              disabled={isLockedOut}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white focus-ring rounded p-0.5"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-violet-300 hover:text-violet-200">
            Forgot password?
          </Link>
        </div>

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
              <LogIn className="h-4 w-4" />
              Sign in
            </>
          )}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Don't have an account?{" "}
        <Link href="/signup" className="font-medium text-violet-300 hover:text-violet-200">
          Sign up free
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
