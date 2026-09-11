"use client";

// =============================================================================
// 🛡️ TwoFactorSettings — Zero-Cost TOTP Authenticator App (Google/MS/1Password)
// =============================================================================
import { Check, Copy, KeyRound, QrCode, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, Field, Input } from "@/components/ui";
import { authClient } from "@/lib/auth/auth-client";

interface TwoFactorSettingsProps {
  initialEnabled?: boolean;
}

export function TwoFactorSettings({ initialEnabled = false }: TwoFactorSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<"idle" | "password" | "scan" | "backup">("idle");
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Step 1: Start 2FA setup by validating password
  async function handleStartEnable(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter your current account password.");
      return;
    }
    setLoading(true);
    try {
      const res = await authClient.twoFactor.enable({ password });
      if (res.error) {
        toast.error(res.error.message || "Invalid password or failed to start 2FA setup.");
        return;
      }
      if (res.data && "totpURI" in res.data) {
        setTotpURI(res.data.totpURI || "");
        setBackupCodes(res.data.backupCodes || []);
        setStep("scan");
      }
    } catch (err) {
      toast.error((err as Error).message || "Failed to initialize Two-Factor authentication.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Confirm TOTP code
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!totpCode || totpCode.length < 6) {
      toast.error("Please enter the 6-digit code from your authenticator app.");
      return;
    }
    setLoading(true);
    try {
      const res = await authClient.twoFactor.verifyTotp({ code: totpCode });
      if (res.error) {
        toast.error(res.error.message || "Invalid verification code. Please try again.");
        return;
      }
      setIsEnabled(true);
      setStep("backup");
      toast.success("Two-Factor Authentication is now active!");
    } catch (err) {
      toast.error((err as Error).message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  // Disable 2FA
  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter your current password to disable 2FA.");
      return;
    }
    setLoading(true);
    try {
      const res = await authClient.twoFactor.disable({ password });
      if (res.error) {
        toast.error(res.error.message || "Failed to disable 2FA.");
        return;
      }
      setIsEnabled(false);
      setStep("idle");
      setPassword("");
      toast.success("Two-Factor Authentication has been disabled.");
    } catch (err) {
      toast.error((err as Error).message || "Failed to disable 2FA.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyBackupCodes() {
    if (!backupCodes.length) return;
    void navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    toast.success("Backup recovery codes copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            Two-Factor Authentication (2FA)
            {isEnabled ? (
              <Badge tone="green" className="ml-1">
                Active
              </Badge>
            ) : (
              <Badge tone="amber" className="ml-1">
                Disabled
              </Badge>
            )}
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            Protect your creator profile and link management using an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password). No SMS or email fees required.
          </p>
        </div>

        {step === "idle" && (
          <div>
            {isEnabled ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setStep("password")}
                className="shrink-0"
              >
                Disable 2FA
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep("password")}
                className="shrink-0"
              >
                Enable 2FA
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Step: Password confirmation to enable or disable */}
      {step === "password" && (
        <form
          onSubmit={isEnabled ? handleDisable : handleStartEnable}
          className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3"
        >
          <Field
            label="Account Password"
            hint={
              isEnabled
                ? "Confirm your password to turn off 2FA protection"
                : "Confirm your password to begin 2FA activation"
            }
          >
            <Input
              type="password"
              placeholder="Enter current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </Field>
          <div className="flex items-center gap-2">
            <Button type="submit" loading={loading} variant={isEnabled ? "danger" : "primary"}>
              {isEnabled ? "Disable Protection" : "Continue to QR Code"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep("idle");
                setPassword("");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Step: Scan QR Code & Enter 6-digit TOTP */}
      {step === "scan" && (
        <form
          onSubmit={handleVerifyCode}
          className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-400">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Scan with Authenticator App</h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Open Google Authenticator, Authy, or 1Password, tap add new account, and scan the key or paste the link below:
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
            <p className="text-[11px] font-medium text-zinc-400">Setup Key / URI:</p>
            <code className="mt-1 block break-all font-mono text-[11px] text-emerald-200">
              {totpURI}
            </code>
          </div>

          <Field label="6-Digit Verification Code" hint="Generated by your authenticator app">
            <Input
              placeholder="123456"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              disabled={loading}
              className="text-center font-mono text-lg tracking-widest max-w-[200px]"
              autoFocus
            />
          </Field>

          <div className="flex items-center gap-2">
            <Button type="submit" loading={loading} disabled={totpCode.length < 6}>
              <ShieldCheck className="h-4 w-4" /> Activate 2FA
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep("idle")}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Step: Backup recovery codes displayed */}
      {step === "backup" && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-amber-200 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Save Your Recovery Codes
            </h4>
            <Button variant="secondary" size="sm" onClick={handleCopyBackupCodes}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy Codes"}
            </Button>
          </div>
          <p className="text-xs text-amber-200/80">
            If you lose access to your authenticator app, these one-time backup codes are the only way to recover your account:
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/40 p-3 font-mono text-xs text-amber-100">
            {backupCodes.map((code, idx) => (
              <span key={idx} className="select-all">
                {code}
              </span>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => {
              setStep("idle");
              setPassword("");
            }}
            className="w-full"
          >
            I have saved my backup codes
          </Button>
        </div>
      )}
    </Card>
  );
}
