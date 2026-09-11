"use client";

// =============================================================================
// 🌐 SocialAuthButtons — Enterprise OAuth Social Sign-On (GitHub, Google, Discord)
// Powered by Better Auth client. Seamless 1-tap authentication.
// =============================================================================
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BrandIcon } from "@/components/icons";
import { authClient } from "@/lib/auth/auth-client";

interface SocialAuthButtonsProps {
  mode?: "signin" | "signup";
}

export function SocialAuthButtons({ mode = "signin" }: SocialAuthButtonsProps) {
  const [activeProvider, setActiveProvider] = useState<string | null>(null);

  async function handleSocial(provider: "github" | "google" | "discord") {
    setActiveProvider(provider);
    try {
      const res = await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
      if (res?.error) {
        toast.error(res.error.message || `Failed to authenticate with ${provider}.`);
      }
    } catch (err) {
      toast.error((err as Error).message || `Social sign-in with ${provider} failed.`);
    } finally {
      setActiveProvider(null);
    }
  }

  const providers = [
    { id: "github" as const, label: "GitHub", tone: "hover:border-zinc-400 hover:bg-zinc-800/40" },
    { id: "google" as const, label: "Google", tone: "hover:border-amber-400/40 hover:bg-amber-500/10" },
    { id: "discord" as const, label: "Discord", tone: "hover:border-[#5865F2]/50 hover:bg-[#5865F2]/10" },
  ];

  return (
    <div className="space-y-3">
      <div className="relative my-2 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <span className="relative bg-ink-900/90 px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          or continue with
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {providers.map((p) => {
          const isLoading = activeProvider === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={Boolean(activeProvider)}
              onClick={() => handleSocial(p.id)}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 transition-all ${p.tone} disabled:opacity-50`}
              title={`${mode === "signup" ? "Sign up" : "Sign in"} with ${p.label}`}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
              ) : (
                <BrandIcon id={p.id} className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
