"use client";

// 📝 Signup page — account banao, seedha dashboard
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button, Field, Input } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Signup failed");
        return;
      }
      toast.success("Account ban gaya — welcome to LinkForge!");
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="glass noise relative rounded-3xl p-8 shadow-2xl"
    >
      <h1 className="font-display text-2xl font-bold">Create your page</h1>
      <p className="mt-1.5 text-sm text-zinc-400">
        30 seconds me apna link-in-bio page live karein — free forever
      </p>

      <div className="mt-7 space-y-5">
        <Field label="Your name">
          <Input
            required
            maxLength={80}
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
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field
          label="Password"
          hint="Minimum 8 characters, ek letter aur ek number zaroori"
        >
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
          <Sparkles className="h-4 w-4" />
          Create account
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Pehle se account hai?{" "}
        <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
          Sign in
        </Link>
      </p>
    </form>
  );
}
