"use client";

import { useState } from "react";
import { 
  FileText, 
  Music, 
  CreditCard, 
  QrCode, 
  Play, 
  ExternalLink, 
  Download, 
  IndianRupee, 
  Sparkles,
  Smartphone,
  Check
} from "lucide-react";
import { Reveal } from "./anim";

const TABS = [
  {
    id: "pdf",
    label: "In-App PDF Reader",
    icon: FileText,
    badge: "Built-in",
    title: "Read Resumes & Decks Without Leaving Your Page",
    desc: "Third-party redirects aur clunky downloads khatam. LinkForge me upload hui PDFs direct mobile modal reader me open hoti hain.",
    previewType: "pdf",
  },
  {
    id: "media",
    label: "Audio & Video Streamer",
    icon: Music,
    badge: "Native Playback",
    title: "Spotify, YouTube, Podcasts & Audio Tracks",
    desc: "Songs, audio snippets ya video links paste karein — followers aapke bio page par hi bina bounce hue stream kar sakte hain.",
    previewType: "media",
  },
  {
    id: "upi",
    label: "India UPI & Global Tips",
    icon: IndianRupee,
    badge: "0% Commission",
    title: "GPay, PhonePe, Paytm & Global Payments",
    desc: "UPI ID ya deep-link dalo — phone par ek tap se Google Pay ya PhonePe khulta hai. No middleman cut, direct paise aapke bank me.",
    previewType: "upi",
  },
  {
    id: "qr",
    label: "Vector QR Codes",
    icon: QrCode,
    badge: "Print Ready",
    title: "Instant QR Code For Business Cards & Flyers",
    desc: "Har creator ka high-resolution vector QR code built-in hai. Ek tap me PNG download karo aur physical events par share karo.",
    previewType: "qr",
  },
];

export function MediaEcosystem() {
  const [activeTab, setActiveTab] = useState(0);
  const cur = TABS[activeTab];

  return (
    <section id="media" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-24">
      <Reveal className="mb-14 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/25 bg-fuchsia-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-fuchsia-300">
          <Sparkles className="h-3.5 w-3.5" />
          Rich Media · Zero Redirects
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Supercharged Bio Cards <br className="hidden sm:inline" />
          <span className="text-gradient">Beyond Simple Blue Links</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          PDFs, videos, audio tracks, WhatsApp direct buttons aur UPI payments — sab kuch aapke clean bio profile ke andar smoothly chalta hai.
        </p>
      </Reveal>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {TABS.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = idx === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                isActive
                  ? "bg-violet-600 text-white shadow-[0_0_24px_rgba(139,92,246,0.4)]"
                  : "border border-white/5 bg-white/[0.03] text-zinc-400 hover:border-white/15 hover:text-zinc-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Box */}
      <Reveal delay={150} className="mt-8">
        <div className="glass overflow-hidden rounded-[2rem] border-white/10 p-6 sm:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            {/* Left Description */}
            <div className="space-y-4 lg:col-span-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold text-fuchsia-300">
                <cur.icon className="h-3.5 w-3.5" />
                {cur.badge}
              </span>

              <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
                {cur.title}
              </h3>

              <p className="text-sm leading-relaxed text-zinc-300">
                {cur.desc}
              </p>

              <div className="space-y-2.5 pt-2">
                {activeTab === 0 && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-400" /> Fullscreen mobile & desktop document viewer
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-400" /> Zero Google Drive popups or login walls
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-400" /> 100% AES-256 decrypted on-the-fly
                    </div>
                  </>
                )}
                {activeTab === 1 && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-400" /> YouTube, Spotify, Soundcloud iframe embeds
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-400" /> Native HTML5 audio stream player
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-400" /> Increases page engagement & retention by 3.4x
                    </div>
                  </>
                )}
                {activeTab === 2 && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-400" /> Instant deeplinking to Google Pay, PhonePe & Paytm
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-400" /> Zero transaction fees, 100% money goes directly to you
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-400" /> Optional BuyMeACoffee & PayPal integration
                    </div>
                  </>
                )}
                {activeTab === 3 && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-400" /> Sharp high-res vector output for offline flyers
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-400" /> 1-Click download PNG / SVG format
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-400" /> Dynamic link updates never break printed codes
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Interactive Mockup Visual */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-md rounded-3xl border border-white/10 bg-ink-900/90 p-5 shadow-2xl">
                {activeTab === 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-rose-400" />
                        <span className="text-xs font-semibold text-white">DevOps_Architect_Resume.pdf</span>
                      </div>
                      <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300">2.4 MB</span>
                    </div>
                    <div className="h-44 rounded-2xl border border-white/5 bg-ink-950 p-4 font-mono text-[11px] text-zinc-400">
                      <div className="flex items-center justify-between text-zinc-500">
                        <span>PAGE 1 OF 2</span>
                        <span>AES-256 DECRYPTED</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="h-3 w-2/3 rounded bg-zinc-700/50" />
                        <div className="h-2 w-full rounded bg-zinc-800" />
                        <div className="h-2 w-5/6 rounded bg-zinc-800" />
                        <div className="h-2 w-4/5 rounded bg-zinc-800" />
                        <div className="h-2 w-full rounded bg-zinc-800" />
                      </div>
                    </div>
                    <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white transition-all hover:bg-violet-500">
                      <ExternalLink className="h-3.5 w-3.5" /> Open Fullscreen Reader
                    </button>
                  </div>
                )}

                {activeTab === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg">
                        <Play className="h-5 w-5 fill-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">Building Modern Web Apps Ep. 42</p>
                        <p className="text-[11px] text-zinc-400">Audio Podcast · 24 min</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-2/3 rounded-full bg-violet-500" />
                      </div>
                      <div className="flex justify-between font-mono text-[10px] text-zinc-500">
                        <span>16:20</span>
                        <span>24:00</span>
                      </div>
                    </div>
                    <div className="flex justify-center gap-4 text-xs font-semibold text-zinc-300">
                      <button className="rounded-lg bg-white/5 px-3 py-1.5 hover:bg-white/10">⏮ 15s</button>
                      <button className="rounded-lg bg-violet-600 px-4 py-1.5 text-white shadow-md">Pause</button>
                      <button className="rounded-lg bg-white/5 px-3 py-1.5 hover:bg-white/10">15s ⏭</button>
                    </div>
                  </div>
                )}

                {activeTab === 2 && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-center">
                      <IndianRupee className="mx-auto h-7 w-7 text-emerald-400" />
                      <p className="mt-2 font-display text-base font-bold text-white">Support My Open Source Work</p>
                      <p className="font-mono text-xs text-emerald-300">sudhir@upi · 0% Fee</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {["₹100", "₹250", "₹500"].map((amt) => (
                        <button key={amt} className="rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-white hover:border-emerald-500/50">
                          {amt}
                        </button>
                      ))}
                    </div>
                    <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-emerald-500">
                      <Smartphone className="h-3.5 w-3.5" /> Pay with GPay / PhonePe
                    </button>
                  </div>
                )}

                {activeTab === 3 && (
                  <div className="flex flex-col items-center justify-center space-y-4 py-2 text-center">
                    <div className="rounded-2xl bg-white p-4 shadow-xl">
                      {/* Stylized QR representation */}
                      <div className="grid h-32 w-32 grid-cols-4 gap-1 p-1 bg-zinc-950 rounded-lg">
                        <div className="bg-white rounded-sm" />
                        <div className="bg-white rounded-sm" />
                        <div className="bg-zinc-950" />
                        <div className="bg-white rounded-sm" />
                        <div className="bg-white rounded-sm" />
                        <div className="bg-zinc-950" />
                        <div className="bg-white rounded-sm" />
                        <div className="bg-white rounded-sm" />
                        <div className="bg-zinc-950" />
                        <div className="bg-white rounded-sm" />
                        <div className="bg-white rounded-sm" />
                        <div className="bg-zinc-950" />
                        <div className="bg-white rounded-sm" />
                        <div className="bg-white rounded-sm" />
                        <div className="bg-zinc-950" />
                        <div className="bg-white rounded-sm" />
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-zinc-300">linkforge-demo.vercel.app/sudhir</p>
                    <button className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-500">
                      <Download className="h-3.5 w-3.5" /> Download High-Res QR
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
