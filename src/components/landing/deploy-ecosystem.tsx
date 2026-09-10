"use client";

import { useState } from "react";
import { 
  Cloud, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  Boxes, 
  Server, 
  Sparkles,
  GitBranch
} from "lucide-react";
import { Reveal } from "./anim";

const DEPLOY_OPTIONS = [
  {
    id: "vercel",
    name: "Vercel 1-Click",
    icon: Cloud,
    badge: "Recommended",
    desc: "Serverless edge functions + 300+ Edge CDN POPs worldwide. 1-click deploy from GitHub.",
    actionUrl: "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSudhirDevOps1%2FLinkForge",
    actionLabel: "Deploy to Vercel",
    command: null,
  },
  {
    id: "docker",
    name: "Docker Container",
    icon: Boxes,
    badge: "Portable",
    desc: "Prebuilt container image ready for any VPS, Coolify, Portainer or Kubernetes cluster.",
    actionUrl: null,
    actionLabel: null,
    command: "docker run -d -p 3000:3000 --name linkforge --env-file .env ghcr.io/sudhirdevops1/linkforge:latest",
  },
  {
    id: "vps",
    name: "Self-Host VPS",
    icon: Terminal,
    badge: "Full Control",
    desc: "Clone the repo on Ubuntu/Debian, install dependencies, build and run behind Nginx or Caddy.",
    actionUrl: null,
    actionLabel: null,
    command: "git clone https://github.com/SudhirDevOps1/LinkForge.git && cd LinkForge && npm install && npm run build && npm start",
  },
  {
    id: "railway",
    name: "Railway / Render",
    icon: Server,
    badge: "PaaS Ready",
    desc: "Instant Nixpacks / Dockerfile detection with automated PostgreSQL provisioning.",
    actionUrl: "https://railway.app/template",
    actionLabel: "Deploy on Railway",
    command: null,
  },
];

export function DeployEcosystem() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const cur = DEPLOY_OPTIONS[activeTab];

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section id="deploy" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-24">
      <Reveal className="mb-14 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-300">
          <Sparkles className="h-3.5 w-3.5" />
          Zero Lock-In · Self-Host Anywhere
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Deploy in 60 Seconds — <span className="text-gradient">Your Server, Your Rules</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Vercel, Railway, Docker, or your personal VPS — standard Next.js + Drizzle architecture runs effortlessly in any environment without hassle.
        </p>
      </Reveal>

      <Reveal delay={150}>
        <div className="glass mx-auto max-w-4xl rounded-[2.5rem] border-white/10 p-6 sm:p-10">
          {/* Tab Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {DEPLOY_OPTIONS.map((opt, i) => {
              const Icon = opt.icon;
              const isSelected = i === activeTab;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setActiveTab(i);
                    setCopied(false);
                  }}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                    isSelected
                      ? "bg-violet-600 text-white shadow-[0_0_24px_rgba(139,92,246,0.4)]"
                      : "border border-white/5 bg-white/[0.03] text-zinc-400 hover:border-white/15 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{opt.name}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Box */}
          <div className="mt-8 rounded-3xl border border-white/10 bg-ink-950/70 p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-0.5 text-xs font-semibold text-violet-300">
                  <cur.icon className="h-3.5 w-3.5" />
                  {cur.badge}
                </span>
                <h3 className="mt-2 font-display text-xl font-bold text-white">
                  {cur.name} Deployment
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  {cur.desc}
                </p>
              </div>

              {cur.actionUrl && (
                <a
                  href={cur.actionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 text-xs font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  <span>{cur.actionLabel}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            {/* CLI Command if applicable */}
            {cur.command && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/60 p-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[11px] text-zinc-500">
                  <span>TERMINAL COMMAND</span>
                  <button
                    onClick={() => handleCopy(cur.command!)}
                    className="flex items-center gap-1.5 text-violet-300 hover:text-white"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied" : "Copy Command"}</span>
                  </button>
                </div>
                <p className="mt-3 select-all overflow-x-auto text-violet-200">
                  {cur.command}
                </p>
              </div>
            )}

            {/* Quick Environment Variables Check */}
            <div className="mt-6 border-t border-white/5 pt-4 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">Supported Databases:</span> Neon, Turso, Supabase, Cloudflare D1, PostgreSQL · <span className="font-semibold text-zinc-300">Storage:</span> Backblaze B2, S3, R2, MinIO, Local Disk.
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
