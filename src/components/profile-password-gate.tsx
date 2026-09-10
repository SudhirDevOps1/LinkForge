"use client";

// =============================================================================
// 🔒 ProfilePasswordGate — password-protected profile ke liye visitor gate
// =============================================================================
import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";

interface ProfilePasswordGateProps {
  slug: string;
  displayName: string;
  avatarUrl?: string | null;
}

export function ProfilePasswordGate({ slug, displayName, avatarUrl }: ProfilePasswordGateProps) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlock() {
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Galat password hai");
        setLoading(false);
        return;
      }
      // Reload page so server sees the unlock cookie
      window.location.reload();
    } catch {
      setError("Kuch gadbad ho gayi. Dobara try karein.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center shadow-2xl">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="mx-auto mb-4 h-20 w-20 rounded-full object-cover ring-2 ring-violet-500/40"
          />
        ) : (
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20 text-violet-400">
            <Lock className="h-8 w-8" />
          </div>
        )}
        <h1 className="font-display text-xl font-bold text-white">{displayName}</h1>
        <p className="mt-1 text-sm text-zinc-400">Yeh profile password se protected hai</p>

        <div className="mt-6 space-y-4 text-left">
          <Field label="Password" error={error ?? undefined}>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password daalein"
                onKeyDown={(e) => e.key === "Enter" && unlock()}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Button onClick={unlock} loading={loading} className="w-full">
            <Lock className="mr-2 h-4 w-4" />
            Unlock karein
          </Button>
        </div>
      </div>
    </div>
  );
}
