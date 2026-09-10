"use client";

import { Zap, Globe, HardDrive, ShieldCheck, Activity, CheckCircle2, ArrowRight } from "lucide-react";
import { Reveal, CountUp } from "./anim";
import Link from "next/link";

const BENCHMARKS = [
  {
    icon: Zap,
    metric: "99",
    suffix: "/100",
    label: "Lighthouse Performance",
    subtext: "Sub-0.6s LCP on mobile 4G networks",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/20",
  },
  {
    icon: Globe,
    metric: "300",
    suffix: "+",
    label: "Global Edge POPs",
    subtext: "Anycast routing with <25ms TTFB globally",
    color: "text-cyan-400",
    borderColor: "border-cyan-500/20",
  },
  {
    icon: HardDrive,
    metric: "0",
    suffix: "₹",
    label: "Storage Egress Bandwidth",
    subtext: "1-year Vercel Edge caching prevents B2 bill shocks",
    color: "text-violet-400",
    borderColor: "border-violet-500/20",
  },
  {
    icon: ShieldCheck,
    metric: "256",
    suffix: "-bit",
    label: "AES-GCM Encryption",
    subtext: "Hardware-accelerated zero-knowledge cipher",
    color: "text-fuchsia-400",
    borderColor: "border-fuchsia-500/20",
  },
];

export function EdgePerformance() {
  return (
    <section id="performance" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-24">
      <Reveal className="mb-14 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-300">
          <Activity className="h-3.5 w-3.5" />
          Production Engineering Standards
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Engineered for <span className="text-gradient">Pure Speed & Zero Egress</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Heavy monolithic apps aur 15MB bloated tracking scripts ko bye-bye bolo. LinkForge Edge-first architecture par bana hai jo instant load hota hai.
        </p>
      </Reveal>

      {/* 4 Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BENCHMARKS.map((b, i) => {
          const Icon = b.icon;
          return (
            <Reveal key={b.label} delay={i * 100}>
              <div className={`glass flex h-full flex-col justify-between rounded-3xl p-6 transition-all hover:-translate-y-1 hover:border-violet-400/30 ${b.borderColor}`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white">
                      <Icon className={`h-5 w-5 ${b.color}`} />
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-extrabold text-white">
                      {b.metric === "99" ? <CountUp to={99} /> : b.metric === "300" ? <CountUp to={300} /> : b.metric}
                    </span>
                    <span className={`font-display text-2xl font-bold ${b.color}`}>{b.suffix}</span>
                  </div>

                  <h3 className="mt-2 font-display text-sm font-bold text-white">{b.label}</h3>
                  <p className="mt-1 text-xs text-zinc-400">{b.subtext}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* Technical Highlights Row */}
      <Reveal delay={200} className="mt-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
          <h4 className="font-display text-base font-bold text-white">
            Architecture Highlights at a Glance
          </h4>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 text-xs text-zinc-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span><strong>Edge Decryption Streaming:</strong> Binary chunks decrypt seamlessly without memory buffering.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span><strong>Automatic WebP & SVG:</strong> Built-in next/image optimization saves 80% mobile data.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span><strong>Zero Cold Starts:</strong> Serverless edge runtime handles traffic spikes effortlessly.</span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
