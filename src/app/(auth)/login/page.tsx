"use client";

// =============================================================================
// 🔑 Login Page — Hardened Enterprise Authentication
// -----------------------------------------------------------------------------
// - Passkey (WebAuthn / FIDO2) Passwordless Login
// - Two-Factor Authentication (TOTP Authenticator) support
// - Anonymous Guest Instant Trial
// - ALTCHA Proof-of-Work anti-bot protection
// - Client-side lockout & cooldown countdown on rate limits or repeated failures
// - Generic error handling against user enumeration
// =============================================================================
import {
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Fingerprint,
  LogIn,
  Shield,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Field, Input } from "@/components/ui";
import { AltchaWidget } from "@/components/auth/AltchaWidget";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { authClient } from "@/lib/auth/auth-client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [altchaToken, setAltchaToken] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [anonLoading, setAnonLoading] = useState(false);

  // Two-Factor Authentication Challenge state
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);

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
        twoFactorRedirect?: boolean;
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

      // Check if account has Two-Factor Authentication enabled
      if (data.twoFactorRedirect) {
        setTwoFactorRequired(true);
        toast.info("Two-Factor Authentication required. Enter your authenticator code.");
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

  // Handle Two-Factor code verification
  async function handleVerify2FA(e: React.FormEvent) {
    e.preventDefault();
    if (!totpCode || totpCode.length < 6) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    setTotpLoading(true);
    try {
      const res = await authClient.twoFactor.verifyTotp({ code: totpCode });
      if (res.error) {
        toast.error(res.error.message || "Invalid two-factor authentication code.");
        return;
      }
      toast.success("Identity confirmed. Welcome back!");
      router.push(params.get("next") ?? "/dashboard");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message || "Verification failed.");
    } finally {
      setTotpLoading(false);
    }
  }

  // Handle Passkey (WebAuthn/FIDO2) Sign-In
  async function handlePasskeySignIn() {
    setPasskeyLoading(true);
    try {
      const res = await authClient.signIn.passkey();
      if (res.error) {
        toast.error(res.error.message || "Passkey sign-in failed.");
        return;
      }
      toast.success("Welcome back via biometric authentication!");
      router.push(params.get("next") ?? "/dashboard");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message || "Passkey sign-in was cancelled.");
    } finally {
      setPasskeyLoading(false);
    }
  }

  // Handle Anonymous / Guest Preview Sign-In
  async function handleAnonymousSignIn() {
    setAnonLoading(true);
    try {
      const res = await authClient.signIn.anonymous();
      if (res.error) {
        toast.error(res.error.message || "Guest session initialization failed.");
        return;
      }
      toast.success("Welcome, Guest Creator! You can explore and test features.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message || "Could not start guest session.");
    } finally {
      setAnonLoading(false);
    }
  }

  const isLockedOut = cooldownSeconds > 0;

  // 2FA Challenge View
  if (twoFactorRequired) {
    return (
      <form
        onSubmit={handleVerify2FA}
        className="glass noise relative rounded-3xl p-8 shadow-2xl space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">Two-Factor Authentication</h1>
            <p className="mt-0.5 text-xs text-zinc-400">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>
        </div>

        <Field label="Authenticator Code" hint="Google Authenticator / 1Password">
          <Input
            placeholder="123456"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
            disabled={totpLoading}
            className="text-center font-mono text-2xl tracking-widest"
            autoFocus
          />
        </Field>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={totpLoading}
          disabled={totpCode.length < 6}
        >
          <ShieldCheck className="h-4 w-4" /> Verify & Continue
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-xs text-zinc-400 hover:text-white"
          onClick={() => setTwoFactorRequired(false)}
        >
          Back to standard sign in
        </Button>
      </form>
    );
  }

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

        {/* 🌐 Social Sign-On (GitHub, Google, Discord via Better Auth) */}
        <SocialAuthButtons mode="signin" />

        {/* Biometric Passkey Login Option */}
        <div className="relative my-3 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative bg-ink-900/90 px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            or passwordless
          </span>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full border-white/10 hover:border-violet-500/30"
          onClick={handlePasskeySignIn}
          disabled={isLockedOut || passkeyLoading}
          loading={passkeyLoading}
        >
          <Fingerprint className="h-4 w-4 text-violet-400" />
          Sign in with Passkey
        </Button>

        {/* Anonymous Guest Experience Option */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-xs text-zinc-400 hover:text-white"
          onClick={handleAnonymousSignIn}
          disabled={isLockedOut || anonLoading}
          loading={anonLoading}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          Explore as Guest (Instant Preview)
        </Button>
      </div>

      <p className="mt-7 text-center text-xs text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-violet-400 hover:underline">
          Create account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="glass noise flex h-96 w-full items-center justify-center rounded-3xl">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
