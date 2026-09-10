"use client";

import { useState } from "react";
import { 
  Terminal, 
  Palette, 
  Video, 
  Briefcase, 
  Sparkles, 
  ArrowUpRight, 
  Check, 
  ExternalLink,
  MessageCircle,
  FileText
} from "lucide-react";
import { Reveal } from "./anim";

const ARCHETYPES = [
  {
    id: "developers",
    title: "Developers & Engineers",
    icon: Terminal,
    tagline: "Terminal aesthetics, GitHub sync & zero fluff",
    accent: "from-cyan-500 to-blue-600",
    glowColor: "rgba(6,182,212,0.2)",
    features: [
      "Live GitHub stars & pinned repositories",
      "Tech stack badge cards (React, Go, Docker)",
      "Bcrypt / AES-256 encrypted file drops",
      "Cyber Neon & Terminal dark themes"
    ],
    mockup: {
      name: "Sudhir DevOps",
      handle: "@sudhir",
      bio: "Cloud & Distributed Systems Architect. Building open-source infra tools.",
      badges: ["Docker", "Kubernetes", "Next.js", "PostgreSQL"],
      primaryLink: "⭐ SudhirDevOps1/LinkForge (GitHub)",
      secondaryLink: "📄 Read Architecture Whitepaper (PDF)"
    }
  },
  {
    id: "creators",
    title: "Content Creators & Streamers",
    icon: Video,
    tagline: "YouTube embeds, Spotify playlists & fan newsletter",
    accent: "from-rose-500 to-amber-500",
    glowColor: "rgba(244,63,94,0.2)",
    features: [
      "Auto-embedding latest YouTube & Vimeo videos",
      "MX-verified fan email newsletter box",
      "Social follower aggregator (X, Insta, TikTok)",
      "Zero commission tipping via UPI & Stripe"
    ],
    mockup: {
      name: "Aanya Sharma",
      handle: "@aanyacreates",
      bio: "Tech reviews, desk setups & developer productivity vlogs. 180k+ fam.",
      badges: ["YouTube", "Spotify", "Instagram", "Discord"],
      primaryLink: "▶️ Watch Latest Video: My 2026 Minimal Setup",
      secondaryLink: "💌 Join 12,000+ Weekly Newsletter Readers"
    }
  },
  {
    id: "designers",
    title: "Designers & Photographers",
    icon: Palette,
    tagline: "Visual bento grids, full-bleed imagery & UI kits",
    accent: "from-fuchsia-500 to-violet-600",
    glowColor: "rgba(192,38,211,0.2)",
    features: [
      "Visual 2x2 and 3x3 Bento grid layouts",
      "Full-screen high-res portfolio document reader",
      "Dribbble, Behance & Figma community links",
      "Custom CSS accent palettes & curved corners"
    ],
    mockup: {
      name: "Rohan Varma",
      handle: "@rohan.ui",
      bio: "Product Designer @ FinTech. Crafting design systems and accessible micro-interactions.",
      badges: ["Figma", "Design Systems", "iOS", "3D Art"],
      primaryLink: "🎨 View 2026 Design Portfolio (Bento)",
      secondaryLink: "📦 Download Free Mobile UI Kit (Figma)"
    }
  },
  {
    id: "freelancers",
    title: "Freelancers & Consultants",
    icon: Briefcase,
    tagline: "Instant booking, WhatsApp chat & direct UPI payments",
    accent: "from-emerald-500 to-teal-600",
    glowColor: "rgba(16,185,129,0.2)",
    features: [
      "Calendly & Cal.com 1-click consultation booking",
      "Direct WhatsApp chat CTA (wa.me/)",
      "Direct client payments via GPay, PhonePe, UPI",
      "Verified client testimonials showcase"
    ],
    mockup: {
      name: "Sneha Kulkarni",
      handle: "@sneha.consulting",
      bio: "Independent Growth Marketer & Fractional CMO. Helping startups scale from 0 to 1.",
      badges: ["Fractional CMO", "SEO", "B2B SaaS", "Ad Strategy"],
      primaryLink: "📅 Book a 30-Min Strategy Call (Calendly)",
      secondaryLink: "💬 Chat Directly on WhatsApp (Fast Reply)"
    }
  }
];

export function CreatorArchetypes() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = ARCHETYPES[activeIdx];

  return (
    <section id="creators" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-24">
      <Reveal className="mb-14 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300">
          <Sparkles className="h-3.5 w-3.5" />
          Made For Every Workflow
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Designed for Your Style — <span className="text-gradient">Every Creator Vibe</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Whether you are a software developer, video creator, designer, or independent consultant — LinkForge adapts seamlessly to your workflow.
        </p>
      </Reveal>

      {/* Switcher Buttons */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ARCHETYPES.map((arc, i) => {
          const Icon = arc.icon;
          const isSelected = i === activeIdx;
          return (
            <button
              key={arc.id}
              onClick={() => setActiveIdx(i)}
              className={`flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all ${
                isSelected
                  ? "border border-white/20 bg-white/10 text-white shadow-[0_0_30px_rgba(255,255,255,0.1)] backdrop-blur-md"
                  : "border border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:text-zinc-200"
              }`}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${arc.accent} text-white`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-display text-xs font-bold sm:text-sm">{arc.title}</span>
            </button>
          );
        })}
      </div>

      {/* Detailed Card Presentation */}
      <Reveal delay={150} className="mt-8">
        <div 
          className="glass relative overflow-hidden rounded-[2rem] border-white/10 p-6 sm:p-10 transition-all duration-500"
          style={{ boxShadow: `0 0 80px ${active.glowColor}` }}
        >
          <div className="grid items-center gap-8 lg:grid-cols-12">
            {/* Features Breakdown */}
            <div className="space-y-4 lg:col-span-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                Tailored Feature Suite
              </span>
              <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
                {active.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-300">
                {active.tagline}
              </p>

              <div className="space-y-3 pt-3">
                {active.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-2.5 text-xs text-zinc-300 sm:text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Live Card Mockup */}
            <div className="lg:col-span-6">
              <div className="mx-auto max-w-sm rounded-3xl border border-white/15 bg-ink-950/90 p-5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${active.accent} font-display text-lg font-bold text-white shadow-lg`}>
                    {active.mockup.name[0]}
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold text-white">{active.mockup.name}</h4>
                    <p className="font-mono text-xs text-violet-300">{active.mockup.handle}</p>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-zinc-300">
                  {active.mockup.bio}
                </p>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {active.mockup.badges.map((b) => (
                    <span key={b} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                      {b}
                    </span>
                  ))}
                </div>

                {/* Sample Links */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between rounded-xl border border-violet-500/30 bg-violet-600/10 p-3 text-xs font-semibold text-violet-200">
                    <span className="truncate">{active.mockup.primaryLink}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-semibold text-zinc-300">
                    <span className="truncate">{active.mockup.secondaryLink}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
