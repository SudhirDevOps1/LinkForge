"use client";

import { useState } from "react";
import { Calculator, Check, Sparkles, TrendingUp, IndianRupee, ArrowRight } from "lucide-react";
import { Reveal } from "./anim";
import Link from "next/link";

export function CostCalculator() {
  const [traffic, setTraffic] = useState(25000);

  // Approximate pricing tiers
  // Proprietary Link-in-Bio Tool: ₹499/mo to ₹1,999/mo based on features
  const proprietaryToolCost = traffic > 100000 ? 1999 : traffic > 25000 ? 999 : 499;
  // Newsletter service: ₹1,500 to ₹4,500/mo based on subscribers (~2.5% of traffic)
  const subscribersEstimate = Math.round(traffic * 0.025);
  const newsletterCost = subscribersEstimate > 5000 ? 4200 : subscribersEstimate > 1000 ? 2200 : 1200;
  // Storage & CDN egress: ₹350 to ₹1,500/mo
  const storageCost = traffic > 100000 ? 1500 : traffic > 25000 ? 800 : 350;

  const monthlyOtherTotal = proprietaryToolCost + newsletterCost + storageCost;
  const annualSavings = monthlyOtherTotal * 12;

  return (
    <section id="calculator" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-24">
      <Reveal className="mb-14 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-300">
          <Calculator className="h-3.5 w-3.5" />
          Interactive ROI Calculator
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
          How much will you save <span className="text-gradient">with LinkForge?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Compare your monthly expenses with proprietary link-in-bio services and third-party newsletter widgets. LinkForge provides all of this 100% free and open-source.
        </p>
      </Reveal>

      <Reveal delay={150}>
        <div className="glass mx-auto max-w-4xl rounded-[2.5rem] border-white/10 p-6 sm:p-10">
          {/* Traffic Slider */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="traffic-slider" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Your Monthly Profile Visitors:
              </label>
              <span className="font-display text-2xl font-bold text-violet-300">
                {traffic.toLocaleString("en-IN")} <span className="text-xs font-normal text-zinc-500">views/month</span>
              </span>
            </div>

            <input
              id="traffic-slider"
              type="range"
              min={5000}
              max={250000}
              step={5000}
              value={traffic}
              onChange={(e) => setTraffic(Number(e.target.value))}
              className="mt-4 h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-violet-500"
            />

            <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
              <span>5,000 / mo</span>
              <span>100,000 / mo</span>
              <span>250,000+ / mo</span>
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {/* Traditional Paid Tools */}
            <div className="rounded-3xl border border-rose-500/20 bg-rose-950/10 p-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                Traditional Paid Stack
              </span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold text-white">
                  ₹{monthlyOtherTotal.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-zinc-400">/ month</span>
              </div>

              <div className="mt-6 space-y-3 text-xs text-zinc-300">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Standard Link-in-Bio (Analytics, Bento)</span>
                  <span className="font-mono text-zinc-400">₹{proprietaryToolCost}/mo</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Newsletter Widget (~{subscribersEstimate} subs)</span>
                  <span className="font-mono text-zinc-400">₹{newsletterCost}/mo</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Storage & Egress Bandwidth</span>
                  <span className="font-mono text-zinc-400">₹{storageCost}/mo</span>
                </div>
                <div className="flex justify-between pt-1 font-semibold text-rose-300">
                  <span>Yearly Expense</span>
                  <span className="font-mono">₹{(monthlyOtherTotal * 12).toLocaleString("en-IN")}/yr</span>
                </div>
              </div>
            </div>

            {/* LinkForge Stack */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-emerald-950/15 p-6 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  LinkForge Stack
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  100% FREE FOREVER
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-4xl font-extrabold text-white">
                  ₹0
                </span>
                <span className="text-xs text-emerald-300">/ month</span>
              </div>

              <div className="mt-6 space-y-3 text-xs text-zinc-300">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Free Neon / Turso Postgres (0.5 – 5 GB)</span>
                </div>
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Built-in DNS MX Verified Newsletter</span>
                </div>
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Backblaze B2 (10 GB free) + Vercel Edge Cache</span>
                </div>
                <div className="flex items-center gap-2 pt-1 font-semibold text-emerald-300">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Total Annual Savings: ₹{annualSavings.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Banner */}
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-ink-950/60 p-4 sm:flex-row sm:px-6">
            <div>
              <p className="text-xs font-bold text-white sm:text-sm">
                You save approximately <span className="text-emerald-400">₹{annualSavings.toLocaleString("en-IN")}</span> every single year.
              </p>
              <p className="text-[11px] text-zinc-400">
                Your data belongs to you — zero monthly SaaS tax, 100% open source.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-5 text-xs font-bold text-white shadow-lg transition-all hover:bg-violet-500"
            >
              <span>Save Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
