// =============================================================================
// 🏠 Landing content sections — server components (SEO friendly)
// Animations ke liye Reveal/CountUp client wrappers use hote hain.
// =============================================================================
import {
  ArrowRight,
  Check,
  Palette,
  Rocket,
  Star,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { CountUp, Reveal } from "./anim";

// ---- Animated stats band -------------------------------------------------------
const STATS = [
  { value: 12, suffix: "", label: "Production themes" },
  { value: 5, suffix: "", label: "Database providers" },
  { value: 6, suffix: "", label: "Storage backends" },
  { value: 5, suffix: "", label: "Deploy clouds" },
  { value: 100, suffix: "%", label: "Open source & free" },
];

export function StatsBar() {
  return (
    <section className="relative z-10 border-b border-white/5 bg-white/[0.015]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 sm:grid-cols-3 lg:grid-cols-5">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 80} className="text-center">
            <p className="font-display text-4xl font-bold text-white sm:text-5xl">
              <CountUp to={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
              {s.label}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ---- How it works ---------------------------------------------------------------
const STEPS = [
  {
    n: "01",
    icon: UserPlus,
    title: "Create your account",
    body: "Sign up in 30 seconds for free — no credit card required, no trial expiration countdowns.",
  },
  {
    n: "02",
    icon: Palette,
    title: "Customize links & style",
    body: "Add your links via drag-and-drop, upload media kits, and pick your vibe from 12 curated themes.",
  },
  {
    n: "03",
    icon: Rocket,
    title: "Share & track growth",
    body: "Drop your custom link in your social bios and track views and clicks with privacy-first analytics.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-20">
      <Reveal className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          3 steps · 2 minutes
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Ship your page tonight
        </h2>
      </Reveal>
      <div className="relative grid gap-4 md:grid-cols-3">
        <div
          aria-hidden
          className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent md:block"
        />
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 120}>
            <div className="glass group relative h-full rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/25 to-fuchsia-500/25 text-violet-200">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="font-display text-4xl font-bold text-white/8 transition-colors group-hover:text-violet-400/20">
                  {s.n}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ---- Comparison table --------------------------------------------------------------
const COMPARE_ROWS: Array<{
  feature: string;
  forge: string | boolean;
  standardSaaS: string | boolean;
  diy: string | boolean;
}> = [
  { feature: "Price", forge: "Free forever ($0)", standardSaaS: "$10–$25/month", diy: "Hosting + maintenance" },
  { feature: "Self-hostable (your own infra)", forge: true, standardSaaS: false, diy: true },
  { feature: "Choose your own database (Neon, Turso)", forge: true, standardSaaS: false, diy: false },
  { feature: "Choose your own storage (B2, R2, S3)", forge: true, standardSaaS: false, diy: false },
  { feature: "Privacy-first analytics (no ad trackers)", forge: true, standardSaaS: false, diy: false },
  { feature: "Webhooks + REST API", forge: true, standardSaaS: "Enterprise only", diy: "Build yourself" },
  { feature: "File & media uploads (PDF, audio, video)", forge: true, standardSaaS: "Limited", diy: "Build yourself" },
  { feature: "Custom domain with free SSL", forge: "Free", standardSaaS: "Paid tier only", diy: "Manual setup" },
  { feature: "Export your complete data anytime", forge: true, standardSaaS: false, diy: true },
];

function CompareCell({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (value === true)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
        <Check className="h-4 w-4" />
      </span>
    );
  if (value === false)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-zinc-600">
        <X className="h-4 w-4" />
      </span>
    );
  return (
    <span className={`text-xs font-medium sm:text-sm ${highlight ? "text-violet-200" : "text-zinc-400"}`}>
      {value}
    </span>
  );
}

export function Comparison() {
  return (
    <section id="compare" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-20">
      <Reveal className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          Honest comparison
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Why creators switch to LinkForge
        </h2>
      </Reveal>
      <Reveal>
        <div className="glass overflow-x-auto rounded-3xl">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Feature
                </th>
                <th className="bg-violet-500/10 px-5 py-4 text-center font-display text-sm font-bold text-violet-200">
                  LinkForge
                </th>
                <th className="px-5 py-4 text-center text-sm font-semibold text-zinc-400">
                  Standard Link SaaS
                </th>
                <th className="px-5 py-4 text-center text-sm font-semibold text-zinc-400">
                  DIY website
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.feature} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3.5 text-xs font-medium text-zinc-300 sm:text-sm">
                    {row.feature}
                  </td>
                  <td className="bg-violet-500/[0.07] px-5 py-3.5 text-center">
                    <CompareCell value={row.forge} highlight />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <CompareCell value={row.standardSaaS} />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <CompareCell value={row.diy} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </section>
  );
}

// ---- Testimonials -------------------------------------------------------------------
const QUOTES = [
  {
    quote:
      "Having my data live in my own database gives me total peace of mind. The analytics are clean, privacy-focused, and lightning fast.",
    name: "Priya Nair",
    role: "Food creator · 120k followers",
    initial: "P",
    color: "#e879f9",
  },
  {
    quote:
      "Bento layout with custom domain support for free? My entire creator stack shifted to LinkForge — from media kit PDFs to course curriculums.",
    name: "Rohan Mehta",
    role: "Indie hacker & YouTuber",
    initial: "R",
    color: "#38bdf8",
  },
  {
    quote:
      "Client booking links, workout PDFs, transformation videos — all in one profile. Webhooks trigger instant notifications whenever a client signs up.",
    name: "Sneha Kulkarni",
    role: "Fitness coach",
    initial: "S",
    color: "#34d399",
  },
];

export function Testimonials() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 py-20">
      <Reveal className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
          Creator stories
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Loved by independent creators
        </h2>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-3">
        {QUOTES.map((t, i) => (
          <Reveal key={t.name} delay={i * 120}>
            <figure className="glass flex h-full flex-col rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/25">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-zinc-300">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-white/5 pt-4">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-bold"
                  style={{ background: `${t.color}22`, color: t.color }}
                >
                  {t.initial}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{t.name}</span>
                  <span className="block text-xs text-zinc-500">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ---- Final CTA -------------------------------------------------------------------------
export function FinalCta() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border border-violet-400/25 bg-gradient-to-br from-violet-950/60 via-ink-900 to-fuchsia-950/40 p-10 text-center sm:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[560px] -translate-x-1/2 rounded-full bg-violet-600/25 blur-[100px]"
          />
          <h2 className="relative font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Your audience is one link away
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-sm text-zinc-400 sm:text-base">
            Free forever. Your data, your database, your rules.
            Ship your custom page in under 2 minutes.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="group inline-flex h-12 items-center gap-2 rounded-xl bg-violet-500 px-7 font-semibold text-white shadow-[0_0_36px_rgba(139,92,246,.5)] transition-all hover:bg-violet-400"
            >
              Create my page — free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#playground"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 px-7 font-semibold text-zinc-200 transition-all hover:border-white/30 hover:bg-white/5"
            >
              Try Playground
            </a>
          </div>
          <p className="relative mt-5 text-xs text-zinc-500">
            No credit card · Cancel anytime (it&apos;s free — nothing to cancel)
          </p>
        </div>
      </Reveal>
    </section>
  );
}
