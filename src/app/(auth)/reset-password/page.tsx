"use client";

// 🔁 Reset password — token se naya password
import { KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Button, Field, Input } from "@/components/ui";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Reset failed");
        return;
      }
      toast.success("Password update ho gaya — ab sign in karein");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass noise relative rounded-3xl p-8 shadow-2xl">
      <h1 className="font-display text-2xl font-bold">New password</h1>
      <p className="mt-1.5 text-sm text-zinc-400">Apna naya password set karein</p>
      {!token ? (
        <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300">
          Reset token missing hai — email wala link dobara kholen.
        </p>
      ) : (
        <div className="mt-7 space-y-5">
          <Field label="New password" hint="Minimum 8 characters">
            <Input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            <KeyRound className="h-4 w-4" />
            Update password
          </Button>
        </div>
      )}
      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
          ← Back to sign in
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
