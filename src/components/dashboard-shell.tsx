"use client";

// =============================================================================
// 🧭 Dashboard Shell — sidebar + topbar (responsive)
// =============================================================================
import {
  BarChart3,
  ExternalLink,
  Files,
  LayoutDashboard,
  Link2,
  ListOrdered,
  LogOut,
  Palette,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/links", label: "Links", icon: ListOrdered },
  { href: "/dashboard/media", label: "Media", icon: Files },
  { href: "/dashboard/appearance", label: "Appearance", icon: Palette },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({
  slug,
  children,
}: {
  slug: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-ink-950">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/5 bg-ink-900/60 p-4 backdrop-blur-xl md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2 pt-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Link2 className="h-4 w-4 text-white" />
          </span>
          <span className="font-display font-bold tracking-tight">LinkForge</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                isActive(item.href)
                  ? "bg-violet-500/15 text-violet-200 shadow-[inset_0_0_0_1px_rgba(139,92,246,.25)]"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/5 pt-3">
          {slug ? (
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
            >
              <ExternalLink className="h-4.5 w-4.5" />
              View live page
            </a>
          ) : null}
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar + bottom nav */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-white/5 bg-ink-950/85 px-4 py-3 backdrop-blur-xl md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Link2 className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="font-display font-bold">LinkForge</span>
        </Link>
        <div className="flex items-center gap-1">
          {slug ? (
            <a href={`/${slug}`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-zinc-400 hover:text-white" aria-label="View live page">
              <ExternalLink className="h-4.5 w-4.5" />
            </a>
          ) : null}
          <button onClick={signOut} className="rounded-lg p-2 text-zinc-400 hover:text-red-300" aria-label="Sign out">
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-white/5 bg-ink-950/90 px-2 py-2 backdrop-blur-xl md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-medium",
              isActive(item.href) ? "text-violet-300" : "text-zinc-500",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Main content */}
      <main className="relative flex-1 px-4 pb-28 pt-20 sm:px-8 md:ml-60 md:pb-12 md:pt-8">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden">
          <div className="absolute -top-24 left-1/3 h-56 w-[480px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[110px]" />
        </div>
        <div className="relative z-[1] mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
