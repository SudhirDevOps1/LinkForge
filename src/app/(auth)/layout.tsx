// 🔐 Auth layout — centered glass card with ambient background
import { Link2 } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-[720px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-fuchsia-600/12 blur-[110px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_28px_rgba(139,92,246,.5)]">
            <Link2 className="h-5 w-5 text-white" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">LinkForge</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
