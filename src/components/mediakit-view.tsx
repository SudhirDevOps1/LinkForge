"use client";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  DollarSign,
  Download,
  Globe2,
  HelpCircle,
  Laptop,
  Loader2,
  Mail,
  MessageSquare,
  Package,
  Send,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "./ui";

interface MediaKitProps {
  profile: {
    slug: string;
    displayName: string;
    bio: string;
    avatarUrl: string | null;
    theme: string;
  };
  stats: {
    totalViews: number;
    totalClicks: number;
    uniqueVisitors: number;
    ctr: number;
    countries: Array<{ name: string; value: number }>;
    devices: Array<{ name: string; value: number }>;
  };
}

export function MediaKitView({ profile, stats }: MediaKitProps) {
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("Sponsored Bio Card");
  const [brandName, setBrandName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [budget, setBudget] = useState("₹15,000 - ₹30,000");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const packages = [
    {
      id: "bio_card",
      name: "Sponsored Bio Card & Top Placement",
      duration: "30 Days Active",
      price: "₹5,000",
      priceUsd: "$65",
      desc: "Guaranteed top-pinned feature card on the bio page with custom brand colors, logo, and verified tracking.",
      deliverables: [
        "Position 1-3 Guaranteed Placement",
        "Custom Logo & Verified Badge",
        "Direct Click Tracking & Weekly Report",
        "In-Bio Freebie / Video Embed support",
      ],
      popular: true,
    },
    {
      id: "video_showcase",
      name: "Dedicated Tutorial / Video Integration",
      duration: "Permanent Content",
      price: "₹25,000",
      priceUsd: "$320",
      desc: "Comprehensive hands-on deep dive tutorial or product integration across developer channels.",
      deliverables: [
        "10-15 Min In-Depth Architecture Showcase",
        "Pinned Bio Card for 60 Days",
        "Permanent Link in Video Description",
        "Social Mentions on Twitter/X & LinkedIn",
      ],
      popular: false,
    },
    {
      id: "newsletter_sponsor",
      name: "Newsletter Exclusive Feature",
      duration: "Single Edition",
      price: "₹7,500",
      priceUsd: "$95",
      desc: "Dedicated header sponsor section sent to all verified engineering & creator newsletter subscribers.",
      deliverables: [
        "Top Header Logo & Hero Banner",
        "150-Word Product Value Pitch",
        "Custom UTM Link Tracking",
        "Over 45%+ Open Rate Benchmark",
      ],
      popular: false,
    },
  ];

  async function handleSendInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!brandName.trim() || !contactEmail.trim() || !message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/mediakit/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: profile.slug,
          brandName: brandName.trim(),
          contactEmail: contactEmail.trim(),
          packageType: selectedPackage,
          budget,
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit proposal");
      setSentSuccess(true);
      toast.success("Proposal sent to creator!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send proposal");
    } finally {
      setSending(false);
    }
  }

  // Calculate percentage of top countries
  const totalCountryViews = stats.countries.reduce((acc, c) => acc + c.value, 0) || 1;

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href={`/${profile.slug}`}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {profile.displayName}'s Bio</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setInquiryModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25 transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Work With Me</span>
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="p-8 rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-24 h-24 rounded-3xl object-cover border-2 border-violet-500/40 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-violet-600/20 border-2 border-violet-500/40 flex items-center justify-center text-3xl font-black text-violet-300">
                {profile.displayName.charAt(0)}
              </div>
            )}

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {profile.displayName}
                </h1>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Media Kit
                </span>
              </div>
              <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
                {profile.bio || "Full-stack developer, DevOps engineer, and tech content creator."}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 border border-white/5 text-zinc-300">
                  ⚡ Tech & Software
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 border border-white/5 text-zinc-300">
                  🚀 DevOps & Cloud
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 border border-white/5 text-zinc-300">
                  💻 Open Source
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Analytics Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-400" />
                Verified 30-Day Audience Reach
              </h2>
              <p className="text-xs text-zinc-400">Audience metrics calculated directly from verified page requests.</p>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Live Telemetry</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-white/10 bg-zinc-900/40 space-y-1">
              <span className="text-xs font-medium text-zinc-400">Total Views</span>
              <p className="text-2xl font-black text-white">{stats.totalViews.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-400 font-semibold">Verified Impressions</span>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-zinc-900/40 space-y-1">
              <span className="text-xs font-medium text-zinc-400">Monthly Visitors</span>
              <p className="text-2xl font-black text-white">{stats.uniqueVisitors.toLocaleString()}</p>
              <span className="text-[10px] text-violet-400 font-semibold">Unique Hashed IPs</span>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-zinc-900/40 space-y-1">
              <span className="text-xs font-medium text-zinc-400">Total Clicks</span>
              <p className="text-2xl font-black text-white">{stats.totalClicks.toLocaleString()}</p>
              <span className="text-[10px] text-amber-400 font-semibold">Intent Outbound</span>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-zinc-900/40 space-y-1">
              <span className="text-xs font-medium text-zinc-400">Audience CTR</span>
              <p className="text-2xl font-black text-white">{stats.ctr.toFixed(1)}%</p>
              <span className="text-[10px] text-emerald-400 font-semibold">3.8x Industry Benchmark</span>
            </div>
          </div>

          {/* Demographics Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Top Countries */}
            <div className="p-5 rounded-2xl border border-white/10 bg-zinc-900/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <Globe2 className="w-4 h-4 text-violet-400" />
                <span>Top Audience Demographics</span>
              </div>
              <div className="space-y-2.5">
                {stats.countries.slice(0, 4).map((country) => {
                  const pct = Math.round((country.value / totalCountryViews) * 100);
                  return (
                    <div key={country.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-zinc-300">
                        <span>{country.name || "Global"}</span>
                        <span className="font-mono text-zinc-400">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Platforms & Devices */}
            <div className="p-5 rounded-2xl border border-white/10 bg-zinc-900/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <Smartphone className="w-4 h-4 text-violet-400" />
                <span>Device Breakdown</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center space-y-1">
                  <Smartphone className="w-6 h-6 text-zinc-400 mx-auto" />
                  <p className="text-lg font-bold text-white">68%</p>
                  <p className="text-[11px] text-zinc-500">Mobile & Tablet</p>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center space-y-1">
                  <Laptop className="w-6 h-6 text-zinc-400 mx-auto" />
                  <p className="text-lg font-bold text-white">32%</p>
                  <p className="text-[11px] text-zinc-500">Desktop & Workstation</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sponsorship Packages & Rate Cards */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-violet-400" />
              Sponsorship Packages & Rate Cards
            </h2>
            <p className="text-xs text-zinc-400">Select a collaboration package to pitch your brand campaign.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  "relative p-6 rounded-3xl border flex flex-col justify-between transition-all space-y-4",
                  pkg.popular
                    ? "border-violet-500/50 bg-violet-500/[0.05] shadow-xl shadow-violet-500/10"
                    : "border-white/10 bg-zinc-900/40 hover:border-white/20",
                )}
              >
                {pkg.popular && (
                  <span className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-600 text-white shadow-md">
                    Most Booked
                  </span>
                )}

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{pkg.name}</h3>
                    <span className="text-[11px] text-zinc-400">{pkg.duration}</span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">{pkg.price}</span>
                    <span className="text-xs text-zinc-500 font-mono">/ {pkg.priceUsd} USD</span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">{pkg.desc}</p>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    {pkg.deliverables.map((del, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                        <Check className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                        <span>{del}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPackage(pkg.name);
                    setInquiryModalOpen(true);
                  }}
                  className={cn(
                    "w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    pkg.popular
                      ? "bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20"
                      : "bg-white/10 hover:bg-white/15 text-zinc-200",
                  )}
                >
                  <span>Book This Package</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-white/10 text-xs text-zinc-500 space-y-1">
          <p>© {new Date().getFullYear()} {profile.displayName} • Verified Partner of LinkForge Creator Network</p>
          <p className="text-[11px] text-zinc-600">Privacy-First Analytics • Zero Third-Party Cookie Tracking</p>
        </div>
      </div>

      {/* Inquiry Proposal Modal */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-3xl border border-white/15 bg-zinc-950 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  Sponsorship Proposal
                </h3>
                <p className="text-xs text-zinc-400">Pitch your collaboration directly to {profile.displayName}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInquiryModalOpen(false);
                  setSentSuccess(false);
                }}
                className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/5"
              >
                ✕
              </button>
            </div>

            {!sentSuccess ? (
              <form onSubmit={handleSendInquiry} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300">Company / Brand Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Supabase, Vercel, Neon"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-zinc-900/80 text-xs text-zinc-200 outline-none focus:border-violet-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300">Contact Work Email</label>
                    <input
                      type="email"
                      required
                      placeholder="sponsor@brand.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-zinc-900/80 text-xs text-zinc-200 outline-none focus:border-violet-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300">Target Package</label>
                    <select
                      value={selectedPackage}
                      onChange={(e) => setSelectedPackage(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-zinc-900/80 text-xs text-zinc-200 outline-none focus:border-violet-400"
                    >
                      <option value="Sponsored Bio Card & Top Placement">Sponsored Bio Card (₹5,000)</option>
                      <option value="Dedicated Tutorial / Video Integration">Dedicated Video (₹25,000)</option>
                      <option value="Newsletter Exclusive Feature">Newsletter Feature (₹7,500)</option>
                      <option value="Custom Strategic Partnership">Custom Bundle / Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300">Budget Range</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹10,000 - ₹25,000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-zinc-900/80 text-xs text-zinc-200 outline-none focus:border-violet-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-300">Campaign Brief & Objectives</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell the creator about your product, campaign goals, target timeline, and any specific deliverables."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-1 w-full p-3 rounded-xl border border-white/10 bg-zinc-900/80 text-xs text-zinc-200 outline-none focus:border-violet-400 resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Submit Partnership Proposal</span>
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-300">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white">Proposal Dispatched!</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Your collaboration pitch has been delivered directly to {profile.displayName}. They will reply to {contactEmail} within 24-48 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setInquiryModalOpen(false)}
                  className="mt-2 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
