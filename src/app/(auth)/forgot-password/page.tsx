"use client";

// ✉️ Forgot password — reset link request
import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button, Field, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        toast.error("Request failed — please try again in a few moments");
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

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
          <div className="mt-7 space-y-5">
            <Field label="Email">
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Send reset link
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
