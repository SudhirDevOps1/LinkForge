"use client";

// =============================================================================
// 🧭 Dashboard Shell — sidebar + topbar + responsive mobile nav & drawer
// =============================================================================
import {
  BarChart3,
  Blocks,
  ExternalLink,
  Files,
  LayoutDashboard,
  Link2,
  ListOrdered,
  LogOut,
  Menu,
  Palette,
  Settings,
  Mail,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/components/ui";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/links", label: "Links", icon: ListOrdered },
  { href: "/dashboard/media", label: "Media", icon: Files },
  { href: "/dashboard/appearance", label: "Appearance", icon: Palette },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/subscribers", label: "Subscribers", icon: Mail },
  { href: "/dashboard/integrations", label: "Integrations", icon: Blocks },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  // Primary mobile tabs
  const primaryMobileNav = [
    { href: "/dashboard/links", label: "Links", icon: ListOrdered },
    { href: "/dashboard/appearance", label: "Style", icon: Palette },
    { href: "/dashboard/analytics", label: "Stats", icon: BarChart3 },
    { href: "/dashboard/subscribers", label: "Audience", icon: Mail },
  ];

  return (
    <div className="flex min-h-screen bg-ink-950 text-white antialiased overflow-x-hidden">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/5 bg-ink-900/80 p-4 backdrop-blur-xl md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2 pt-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-md shadow-violet-500/20">
            <Link2 className="h-4 w-4 text-white" />
          </span>
          <span className="font-display font-bold tracking-tight text-lg">LinkForge</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto [scrollbar-width:none]">
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
              <item.icon className="h-4.5 w-4.5 shrink-0" />
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
              <ExternalLink className="h-4.5 w-4.5 shrink-0" />
              View live page
            </a>
          ) : null}
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-white/5 bg-ink-950/85 px-4 py-3 backdrop-blur-xl md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-sm shadow-violet-500/20">
            <Link2 className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="font-display font-bold">LinkForge</span>
        </Link>
        <div className="flex items-center gap-1.5">
          {slug ? (
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white"
              aria-label="View live page"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Live</span>
            </a>
          ) : null}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-300 hover:text-white"
            aria-label="Open mobile menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (High Priority items + Drawer trigger) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-white/8 bg-ink-950/95 px-2 py-2 backdrop-blur-2xl md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {primaryMobileNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-xl py-1 text-[11px] font-medium transition-colors",
              isActive(item.href) ? "text-violet-300 font-semibold" : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            <item.icon className={cn("h-5 w-5", isActive(item.href) ? "text-violet-400" : "text-zinc-500")} />
            {item.label}
          </Link>
        ))}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 rounded-xl py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:text-zinc-300",
            mobileMenuOpen && "text-violet-300",
          )}
        >
          <Menu className="h-5 w-5" />
          Menu
        </button>
      </nav>

      {/* Mobile Slide-Up Full Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-md md:hidden animate-fade-in">
          <div className="max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-ink-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
                  <Link2 className="h-3.5 w-3.5 text-white" />
                </span>
                <span className="font-display font-bold">Navigation Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full bg-white/5 p-1.5 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-2xl border p-3 text-xs font-semibold transition-all",
                    isActive(item.href)
                      ? "border-violet-500/40 bg-violet-500/15 text-violet-200"
                      : "border-white/5 bg-white/[0.02] text-zinc-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4 text-violet-400" />
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="space-y-2 border-t border-white/5 pt-3">
              {slug && (
                <a
                  href={`/${slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Live Public Page (/{slug})
                </a>
              )}
              <button
                onClick={signOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <main className="relative flex-1 px-4 pb-28 pt-20 sm:px-6 md:ml-60 md:pb-12 md:pt-8 lg:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden">
          <div className="absolute -top-24 left-1/3 h-56 w-[480px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[110px]" />
        </div>
        <div className="relative z-[1] mx-auto max-w-7xl 2xl:max-w-[1540px]">
          {children}
        </div>
      </main>
    </div>
  );
}
