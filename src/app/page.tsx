// 🏠 Landing Page — LinkForge public homepage
import {
  ArrowRight,
  BarChart3,
  Braces,
  Cloud,
  Database,
  Globe,
  HardDrive,
  KeyRound,
  Link2,
  Lock,
  Palette,
  Sparkles,
  Webhook,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Faq } from "@/components/landing/faq";
import {
  Comparison,
  FinalCta,
  HowItWorks,
  StatsBar,
  Testimonials,
} from "@/components/landing/sections";
import { ThemePlayground } from "@/components/landing/theme-playground";
import { CursorGlow, HeroPhone3D, ParticleField } from "@/components/landing/hero-3d";
import { Reveal } from "@/components/landing/anim";
import { THEMES } from "@/lib/themes";
import { HeroClaimBar } from "@/components/landing/hero-claim-bar";
import { SecurityShowcase } from "@/components/landing/security-showcase";
import { NewsletterShowcase } from "@/components/landing/newsletter-showcase";
import { MediaEcosystem } from "@/components/landing/media-ecosystem";
import { CreatorArchetypes } from "@/components/landing/creator-archetypes";
import { LiveQrTool } from "@/components/landing/live-qr-tool";
import { EdgePerformance } from "@/components/landing/edge-performance";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 .3a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.49 5.92.43.38.82 1.11.82 2.24v3.32c0 .32.22.7.82.58A12 12 0 0 0 12 .3z" />
    </svg>
  );
}

const PROVIDERS = [
  "Neon", "Turso", "Cloudflare D1", "Supabase", "Upstash", "Backblaze B2",
  "Cloudflare R2", "AWS S3", "MinIO", "Vercel", "Netlify", "Railway", "Render",
];

const FEATURES = [
  {
    icon: Database,
    title: "Any database",
    body: "Neon, Turso, Cloudflare D1, Supabase ya local Postgres — ek env var se switch. Drizzle ORM ki unified API sab par chalti hai.",
    span: "sm:col-span-2",
  },
  {
    icon: Cloud,
    title: "Deploy anywhere",
    body: "Vercel, Cloudflare Pages, Netlify, Railway, Render ya Docker — same codebase, zero config change.",
    span: "",
  },
  {
    icon: HardDrive,
    title: "Any storage",
    body: "Backblaze B2, R2, S3, MinIO, Vercel Blob ya local disk. Presigned uploads built-in.",
    span: "",
  },
  {
    icon: BarChart3,
    title: "Privacy-first analytics",
    body: "Clicks, unique visitors, devices, geo, referrers — bina cookies, bina raw IP storage ke.",
    span: "sm:col-span-2",
  },
  {
    icon: Palette,
    title: "12 themes + bento grid",
    body: "Midnight se Cyber Neon tak — har pixel customizable. List ya bento layout, ek click me.",
    span: "",
  },
  {
    icon: Webhook,
    title: "Webhooks + REST API",
    body: "Click events par signed webhooks. Third-party apps ke liye API keys ke saath REST API.",
    span: "sm:col-span-2",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-ink-950 text-zinc-100">
      {/* Ambient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[560px] w-[860px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[140px] animate-spotlight" />
        <div className="absolute top-[42rem] -left-32 h-96 w-96 rounded-full bg-fuchsia-600/12 blur-[120px]" />
        <div className="absolute top-[110rem] -right-32 h-96 w-96 rounded-full bg-indigo-600/14 blur-[120px]" />
        <div className="absolute top-[170rem] -left-32 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute top-[240rem] -right-32 h-96 w-96 rounded-full bg-emerald-600/10 blur-[140px]" />
        <div className="absolute top-[310rem] -left-32 h-96 w-96 rounded-full bg-cyan-600/10 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)",
          }}
        />
      </div>

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_24px_rgba(139,92,246,.5)]">
            <Link2 className="h-4.5 w-4.5 text-white" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">LinkForge</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
          <a href="#security" className="transition-colors hover:text-white">Security</a>
          <a href="#newsletter" className="transition-colors hover:text-white">Newsletter</a>
          <a href="#media" className="transition-colors hover:text-white">Media</a>
          <a href="#features" className="transition-colors hover:text-white">Features</a>
          <a href="#playground" className="transition-colors hover:text-white">Playground</a>
          <a href="#creators" className="transition-colors hover:text-white">Creators</a>
          <a href="#qr-tool" className="transition-colors hover:text-white">QR Studio</a>
          <a href="#free" className="transition-colors hover:text-white">Pricing</a>
          <a href="https://github.com/SudhirDevOps1/LinkForge" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-white">
            <GithubIcon className="h-4 w-4" /> GitHub
          </a>
        </nav>
        <div className="flex items-center gap-2.5">
          <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,.45)] transition-all hover:bg-violet-400"
          >
            Start free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="noise relative z-10 mx-auto max-w-6xl px-5 pt-16 pb-10 text-center sm:pt-24">
        <ParticleField />
        <CursorGlow />
        <Reveal>
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            Open source · MIT license · Self-host anywhere
          </div>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="mx-auto mt-7 max-w-3xl font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
            One link.{" "}
            <span className="text-gradient">Every platform.</span>
            <br />
            Zero lock-in.
          </h1>
        </Reveal>
        <Reveal delay={200}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Advanced link-in-bio builder jo kisi bhi database, kisi bhi cloud aur
            kisi bhi storage par chalta hai — poori tarah free, poori tarah aapka.
          </p>
        </Reveal>
        <Reveal delay={300}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/signup"
              className="group inline-flex h-12 items-center gap-2 rounded-xl bg-violet-500 px-7 font-semibold text-white shadow-[0_0_36px_rgba(139,92,246,.5)] transition-all hover:bg-violet-400"
            >
              Build your page
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 px-7 font-semibold text-zinc-200 transition-all hover:border-white/30 hover:bg-white/5"
            >
              <Globe className="h-4 w-4" />
              Live demo
            </Link>
          </div>
        </Reveal>

        {/* 🚀 Interactive Real-Time Username Claim Bar */}
        <Reveal delay={350}>
          <HeroClaimBar />
        </Reveal>

        {/* Hero phone mock */}
        <div className="relative mx-auto mt-16 max-w-4xl">
          <div aria-hidden className="absolute inset-x-16 top-10 h-72 rounded-full bg-violet-600/25 blur-[110px]" />
          <HeroPhone3D />
        </div>
      </section>

      {/* Animated stats */}
      <StatsBar />

      {/* Provider marquee */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.02] py-6">
        <div className="overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)" }}>
          <div className="flex w-max animate-marquee gap-12 pr-12">
            {[...PROVIDERS, ...PROVIDERS].map((p, i) => (
              <span key={`${p}-${i}`} className="flex items-center gap-2 whitespace-nowrap font-display text-sm font-semibold text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400/70" />
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <HowItWorks />

      {/* 🔐 Dual-Layer Zero-Knowledge Security & Privacy Visualizer */}
      <SecurityShowcase />

      {/* Features bento */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-20">
        <Reveal className="mb-12 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Why LinkForge</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Enterprise-grade foundations,
            <span className="text-gradient"> hobby-project pricing.</span>
          </h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 100} className={f.span}>
              <div className="group glass relative h-full overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:border-violet-400/30">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-500/0 blur-3xl transition-all duration-500 group-hover:bg-violet-500/15" />
                <f.icon className="h-6 w-6 text-violet-300" />
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Lock, title: "Security hardened", body: "Rate limiting, CSRF, Zod validation, hashed IPs." },
            { icon: Globe, title: "Custom domains", body: "bio.aapka-domain.com — apna brand, apna domain." },
            { icon: KeyRound, title: "Export / Import", body: "Aapka data aapka hai — JSON me kabhi bhi nikaalein." },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 100}>
              <div className="glass h-full rounded-3xl p-5 transition-all duration-300 hover:border-violet-400/25">
                <div className="flex items-center gap-3">
                  <f.icon className="h-4.5 w-4.5 text-fuchsia-300" />
                  <h3 className="font-display text-sm font-semibold">{f.title}</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 💌 Built-in Verified Newsletter Engine */}
      <NewsletterShowcase />

      {/* 📱 Supercharged Rich Media Ecosystem */}
      <MediaEcosystem />

      {/* Interactive theme playground */}
      <section id="playground" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-20">
        <Reveal className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
            Interactive demo
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Pehle try karo, phir signup karo
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400">
            Neeche saare themes aur layouts live switch karke dekho — yehi
            real renderer hai jo tumhare page par chalega.
          </p>
        </Reveal>
        <Reveal delay={150}>
          <ThemePlayground />
        </Reveal>
      </section>

      {/* Themes strip */}
      <section id="themes" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 pb-24">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">12 themes</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Har vibe ke liye ek theme
            </h2>
          </div>
          <Link href="/signup" className="group inline-flex items-center gap-1.5 text-sm font-medium text-violet-300 hover:text-violet-200">
            Sab try karein <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {THEMES.map((theme, i) => (
            <Reveal key={theme.id} delay={(i % 4) * 80}>
              <div className="group h-full overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30">
                <div className="relative h-28 p-3" style={{ background: theme.swatch[0] }}>
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-3/4 rounded-full" style={{ background: theme.swatch[1] }} />
                    <div className="h-2.5 w-full rounded-full" style={{ background: theme.swatch[1] }} />
                    <div className="h-2.5 w-5/6 rounded-full" style={{ background: theme.swatch[2] }} />
                  </div>
                  <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full border-2" style={{ background: theme.swatch[2], borderColor: theme.swatch[1] }} />
                </div>
                <div className="bg-ink-850 px-3.5 py-3">
                  <p className="text-sm font-semibold">{theme.name}</p>
                  <p className="text-xs text-zinc-500">{theme.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 🎭 Creator Archetypes Showcase */}
      <CreatorArchetypes />

      {/* 📲 Interactive Live Vector QR Studio */}
      <LiveQrTool />

      {/* Comparison */}
      <Comparison />

      {/* ⚡ Blazing Speed & Global Edge Architecture */}
      <EdgePerformance />

      {/* Testimonials */}
      <Testimonials />

      {/* Free forever */}
      <section id="free" className="relative z-10 scroll-mt-24 border-t border-white/5 bg-gradient-to-b from-violet-950/30 to-transparent">
        <div className="mx-auto max-w-4xl px-5 py-24 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300">
              <Zap className="h-3.5 w-3.5" /> Free tier stack — ₹0/month
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-6xl">
              <span className="text-gradient">$0</span> se shuru karein
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-5 max-w-xl text-zinc-400">
              Neon (0.5 GB) + Turso (1 GB) + D1 (5 GB) + B2 (10 GB) + Vercel/Cloudflare
              free tier — production app bina ek rupee kharch kiye. Scale karna ho to
              self-host karein, koi lock-in nahi.
            </p>
          </Reveal>
          <div className="mx-auto mt-10 grid gap-3 text-left sm:grid-cols-3">
            {[
              { icon: Database, label: "Database", value: "Neon / Turso / D1", note: "0.5 – 5 GB free" },
              { icon: HardDrive, label: "Storage", value: "B2 / R2", note: "10 GB free" },
              { icon: Cloud, label: "Hosting", value: "Vercel / CF / Netlify", note: "Generous free tier" },
            ].map((row, i) => (
              <Reveal key={row.label} delay={i * 100}>
                <div className="glass h-full rounded-2xl p-5">
                  <row.icon className="h-5 w-5 text-violet-300" />
                  <p className="mt-3 text-xs uppercase tracking-wider text-zinc-500">{row.label}</p>
                  <p className="mt-1 font-display font-semibold">{row.value}</p>
                  <p className="text-xs text-emerald-300">{row.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={150}>
            <Link
              href="/signup"
              className="group mt-12 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 font-semibold text-ink-950 transition-all hover:bg-zinc-200"
            >
              <Braces className="h-4 w-4" />
              Start building — free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 mx-auto max-w-3xl scroll-mt-24 px-5 py-20">
        <Reveal className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">FAQ</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Sawal? Jawab ready hai
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <Faq />
        </Reveal>
      </section>

      {/* Final CTA */}
      <FinalCta />

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
                <Link2 className="h-4.5 w-4.5 text-white" />
              </span>
              <span className="font-display text-lg font-bold tracking-tight">LinkForge</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              Open-source link-in-bio builder. Any database. Any cloud. Any
              storage. Zero lock-in. Dual-layer AES-256 encrypted.
            </p>
            <div className="mt-5 flex gap-2.5">
              <a
                href="https://github.com/SudhirDevOps1/LinkForge"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition-colors hover:border-white/25 hover:text-white"
                aria-label="GitHub"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
              <Link
                href="/demo"
                className="flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3.5 text-xs font-medium text-zinc-400 transition-colors hover:border-white/25 hover:text-white"
              >
                <Globe className="h-3.5 w-3.5" /> Live demo
              </Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Product</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><a href="#security" className="text-zinc-400 transition-colors hover:text-white">Security & Encryption</a></li>
              <li><a href="#newsletter" className="text-zinc-400 transition-colors hover:text-white">Verified Newsletter</a></li>
              <li><a href="#media" className="text-zinc-400 transition-colors hover:text-white">Rich Media & UPI</a></li>
              <li><a href="#features" className="text-zinc-400 transition-colors hover:text-white">Features Bento</a></li>
              <li><a href="#playground" className="text-zinc-400 transition-colors hover:text-white">Live Playground</a></li>
              <li><a href="#creators" className="text-zinc-400 transition-colors hover:text-white">Creator Archetypes</a></li>
              <li><a href="#qr-tool" className="text-zinc-400 transition-colors hover:text-white">Vector QR Studio</a></li>
              <li><a href="#performance" className="text-zinc-400 transition-colors hover:text-white">Edge Performance</a></li>
              <li><a href="#free" className="text-zinc-400 transition-colors hover:text-white">Pricing</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Resources</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/demo" className="text-zinc-400 transition-colors hover:text-white">Demo page</Link></li>
              <li><Link href="/login" className="text-zinc-400 transition-colors hover:text-white">Log in</Link></li>
              <li><Link href="/signup" className="text-zinc-400 transition-colors hover:text-white">Sign up</Link></li>
              <li><a href="#faq" className="text-zinc-400 transition-colors hover:text-white">FAQ</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Legal & Security</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/privacy" className="text-zinc-400 transition-colors hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-zinc-400 transition-colors hover:text-white">Terms of Service</Link></li>
              <li><a href="#security" className="text-zinc-400 transition-colors hover:text-white">AES-256 Architecture</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-zinc-600">
            <p>© {new Date().getFullYear()} LinkForge · Open source (MIT) · Built for Creators</p>
            <p>One link. Every platform. Zero lock-in.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
