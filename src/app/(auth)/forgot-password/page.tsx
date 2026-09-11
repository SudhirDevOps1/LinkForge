"use client";

// =============================================================================
// ✉️ Forgot Password Page — Self-Sovereign Multi-Method Password Recovery
// -----------------------------------------------------------------------------
// - Method 1: Email Reset Link (single-use token)
// - Method 2: 2FA Authenticator Code (Google Auth / 1Password / Backup Codes)
// - Method 3: Hardware Passkey Sign-In bypass (WebAuthn / FIDO2)
// - ALTCHA Proof-of-Work anti-bot protection on all flows
// - Dual-bucket rate limiting with live 1-second interval cooldown banner
// =============================================================================
import { CheckCircle2, Clock, Fingerprint, KeyRound, Mail, MailCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Field, Input } from "@/components/ui";
import { AltchaWidget } from "@/components/auth/AltchaWidget";
import { authClient } from "@/lib/auth/auth-client";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"email" | "totp">("email");
  const [email, setEmail] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [altchaToken, setAltchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
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

  // Method 1: Email Reset Link
  async function onSubmitEmail(e: React.FormEvent) {
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

  // Method 2: TOTP / 2FA Reset
  async function onSubmitTotp(e: React.FormEvent) {
    e.preventDefault();
    if (cooldownSeconds > 0) return;

    if (!altchaToken) {
      toast.error("Please complete the security challenge verification.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: totpCode,
          newPassword,
          altcha: altchaToken,
        }),
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

        toast.error(data.error ?? "Failed to reset password. Please check your details.");
        return;
      }

      setResetSuccess(true);
      toast.success("Password updated successfully! You can now sign in.");
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Method 3: Passkey Biometric Bypass
  async function handlePasskeySignIn() {
    setPasskeyLoading(true);
    try {
      const res = await authClient.signIn.passkey();
      if (res.error) {
        toast.error(res.error.message || "Passkey verification failed or was canceled.");
        return;
      }
      toast.success("Identity verified via Passkey! Redirecting to settings...");
      router.push("/dashboard/settings");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message || "Passkey authentication failed.");
    } finally {
      setPasskeyLoading(false);
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
      ) : resetSuccess ? (
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-300" />
          <h1 className="mt-4 font-display text-2xl font-bold">Password Reset Complete</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Your password has been successfully updated via Two-Factor authentication.
          </p>
          <Button
            className="mt-6 w-full"
            size="lg"
            onClick={() => router.push("/login")}
          >
            Sign In with New Password
          </Button>
        </div>
      ) : (
        <div>
          <h1 className="font-display text-2xl font-bold">Account Recovery</h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Choose your recovery method below
          </p>

          {/* Mode Switcher Tabs */}
          <div className="mt-5 grid grid-cols-2 rounded-xl bg-white/5 p-1 border border-white/10 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode("email")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                mode === "email"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              Email Link
            </button>
            <button
              type="button"
              onClick={() => setMode("totp")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                mode === "totp"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Authenticator (2FA)
            </button>
          </div>

          {isLockedOut && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400 animate-pulse" />
              <div>
                <span className="font-semibold text-amber-300">Rate Limit Active:</span>{" "}
                Please wait{" "}
                <span className="font-mono font-bold text-white">{cooldownSeconds}s</span> before requesting another attempt.
              </div>
            </div>
          )}

          {mode === "email" ? (
            <form onSubmit={onSubmitEmail} className="mt-6 space-y-5">
              <Field label="Account Email">
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
                {isLockedOut ? `Locked for ${cooldownSeconds}s` : "Send reset link"}
              </Button>
            </form>
          ) : (
            <form onSubmit={onSubmitTotp} className="mt-6 space-y-4">
              <Field label="Account Email">
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

              <Field label="6-Digit Authenticator Code (or Backup Code)">
                <Input
                  type="text"
                  required
                  disabled={isLockedOut || loading}
                  placeholder="123456 or recovery code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                />
              </Field>

              <Field label="New Password (min 8 characters)">
                <Input
                  type="password"
                  required
                  minLength={8}
                  disabled={isLockedOut || loading}
                  placeholder="Enter new secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Field>

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
                {isLockedOut ? `Locked for ${cooldownSeconds}s` : "Reset Password Instantly"}
              </Button>
            </form>
          )}

          {/* Passkey Biometric Alternative */}
          <div className="mt-7 border-t border-white/10 pt-5 text-center">
            <p className="text-xs text-zinc-400 mb-3">
              Have a biometric passkey registered on this device?
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              loading={passkeyLoading}
              onClick={handlePasskeySignIn}
            >
              <Fingerprint className="h-4 w-4 text-violet-400" />
              Sign in with Touch ID / Face ID / Windows Hello
            </Button>
          </div>

          <p className="mt-5 text-center text-sm text-zinc-500">
            <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
              ← Back to sign in
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
