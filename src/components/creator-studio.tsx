"use client";

import {
  BookOpen,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  GraduationCap,
  Layers,
  Loader2,
  Lock,
  Plus,
  QrCode,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Unlock,
  Video,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BrandIcon } from "./icons";
import { cn } from "./ui";

type MonetizeTab = "courses" | "sessions" | "products" | "tipping";

interface CourseChapter {
  id: string;
  title: string;
  duration: string;
  isFreePreview: boolean;
}

export function CreatorMonetizationStudio() {
  const [activeTab, setActiveTab] = useState<MonetizeTab>("courses");

  // 1. Course Builder State
  const [courseTitle, setCourseTitle] = useState("Complete Next.js 15 & DevOps Masterclass");
  const [coursePrice, setCoursePrice] = useState("₹1,499");
  const [courseOriginalPrice, setCourseOriginalPrice] = useState("₹4,999");
  const [courseDesc, setCourseDesc] = useState("Zero to production mastery: Docker, CI/CD, Kubernetes, and Cloud Deployment.");
  const [courseCheckoutUrl, setCourseCheckoutUrl] = useState("https://yourstore.com/checkout");
  const [courseLessons, setCourseLessons] = useState<CourseChapter[]>([
    { id: "1", title: "Module 1: Architecture & Project Setup", duration: "25m", isFreePreview: true },
    { id: "2", title: "Module 2: Serverless Database & Object Storage", duration: "40m", isFreePreview: false },
    { id: "3", title: "Module 3: CI/CD Pipelines & Production Hardening", duration: "55m", isFreePreview: false },
  ]);
  const [savingCourse, setSavingCourse] = useState(false);

  // 2. 1:1 Paid Session State
  const [sessionTitle, setSessionTitle] = useState("45-Min 1:1 Architecture & Career Mentorship");
  const [sessionPrice, setSessionPrice] = useState("₹999");
  const [sessionDuration, setSessionDuration] = useState("45 mins");
  const [sessionUrl, setSessionUrl] = useState("https://cal.com/your_handle");
  const [sessionDeliverables, setSessionDeliverables] = useState("Code Review, Resume Feedback, Roadmap Strategy");
  const [savingSession, setSavingSession] = useState(false);

  // 3. Digital Product State
  const [prodTitle, setProdTitle] = useState("Full SaaS Starter Boilerplate & Presets");
  const [prodPrice, setProdPrice] = useState("₹499");
  const [prodUrl, setProdUrl] = useState("https://yourstore.com/product");
  const [prodFormat, setProdFormat] = useState("ZIP Source Code + PDF");
  const [savingProd, setSavingProd] = useState(false);

  // 4. Tipping State
  const [upiId, setUpiId] = useState("user@upi");
  const [savingTip, setSavingTip] = useState(false);

  async function handleAddCourse() {
    if (!courseTitle.trim() || !courseCheckoutUrl.trim()) {
      toast.error("Course title and checkout URL are required");
      return;
    }
    setSavingCourse(true);
    try {
      const syllabusSummary = courseLessons.map((l, i) => `Ch${i + 1}: ${l.title} (${l.duration})`).join(" • ");
      const res = await fetch("/api/integrations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: [
            {
              title: `🎓 ${courseTitle} [${coursePrice}]`,
              url: courseCheckoutUrl.trim(),
              description: `${courseDesc} | ${courseLessons.length} Modules • ${syllabusSummary}`,
              icon: "graduation-cap",
              type: "course",
              size: "feature",
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add course");
      toast.success(`Course "${courseTitle}" added to bio!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingCourse(false);
    }
  }

  async function handleAddSession() {
    if (!sessionTitle.trim() || !sessionUrl.trim()) {
      toast.error("Session title and booking link are required");
      return;
    }
    setSavingSession(true);
    try {
      const res = await fetch("/api/integrations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: [
            {
              title: `🤝 ${sessionTitle} [${sessionPrice}]`,
              url: sessionUrl.trim(),
              description: `Duration: ${sessionDuration} • Includes: ${sessionDeliverables}`,
              icon: "calendar",
              type: "cal",
              size: "wide",
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add session");
      toast.success("1:1 Session card added to bio!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingSession(false);
    }
  }

  async function handleAddProduct() {
    if (!prodTitle.trim() || !prodUrl.trim()) {
      toast.error("Product title and URL are required");
      return;
    }
    setSavingProd(true);
    try {
      const res = await fetch("/api/integrations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: [
            {
              title: `📦 ${prodTitle} [${prodPrice}]`,
              url: prodUrl.trim(),
              description: `Instant Download • Format: ${prodFormat}`,
              icon: "shopping-bag",
              type: "product",
              size: "standard",
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add product");
      toast.success("Digital product added to bio!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingProd(false);
    }
  }

  async function handleAddUpi() {
    if (!upiId.trim()) {
      toast.error("Please enter a valid UPI ID");
      return;
    }
    setSavingTip(true);
    try {
      const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=Creator&cu=INR`;
      const res = await fetch("/api/integrations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: [
            {
              title: "Support Creator via UPI (GPay / PhonePe / Paytm)",
              url: upiUrl,
              description: `UPI ID: ${upiId.trim()} • Instant ₹0 fee support`,
              icon: "upi",
              type: "upi",
              size: "standard",
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add UPI payment link");
      toast.success("UPI payment card added to bio!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingTip(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
        <button
          type="button"
          onClick={() => setActiveTab("courses")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer",
            activeTab === "courses"
              ? "bg-violet-600 text-white shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Courses & Masterclasses</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sessions")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer",
            activeTab === "sessions"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
        >
          <Calendar className="h-4 w-4" />
          <span>1:1 Paid Mentorship</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer",
            activeTab === "products"
              ? "bg-fuchsia-600 text-white shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Digital Downloads & E-Books</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tipping")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer",
            activeTab === "tipping"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
        >
          <QrCode className="h-4 w-4" />
          <span>UPI & Direct Support</span>
        </button>
      </div>

      {/* 1. COURSES & MASTERCLASSES TAB */}
      {activeTab === "courses" && (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white">Course & Curriculum Masterclass Creator</h2>
                <p className="text-xs text-zinc-400">Professional course selling with multi-chapter syllabus & lock previews.</p>
              </div>
            </div>
            <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold text-violet-400 border border-violet-500/20">
              HIGH CONVERTING
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-zinc-400">Course Title</label>
              <input
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="Course title"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-violet-500/50 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[11px] font-medium text-zinc-400">Price</label>
                <input
                  value={coursePrice}
                  onChange={(e) => setCoursePrice(e.target.value)}
                  placeholder="₹1,499"
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-medium text-zinc-400">Original</label>
                <input
                  value={courseOriginalPrice}
                  onChange={(e) => setCourseOriginalPrice(e.target.value)}
                  placeholder="₹4,999"
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-zinc-400 focus:border-violet-500/50 focus:outline-none line-through"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-zinc-400">Checkout / Enrollment URL</label>
              <input
                value={courseCheckoutUrl}
                onChange={(e) => setCourseCheckoutUrl(e.target.value)}
                placeholder="https://yourstore.com/checkout or https://gumroad.com/l/..."
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-violet-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-400">Pitch / Overview</label>
              <input
                value={courseDesc}
                onChange={(e) => setCourseDesc(e.target.value)}
                placeholder="Includes full syllabus & certificates"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-violet-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Chapter / Syllabus Editor */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Curriculum Modules ({courseLessons.length} chapters)</span>
              <button
                type="button"
                onClick={() =>
                  setCourseLessons((prev) => [
                    ...prev,
                    {
                      id: String(Date.now()),
                      title: `Module ${prev.length + 1}: `,
                      duration: "30m",
                      isFreePreview: false,
                    },
                  ])
                }
                className="flex items-center gap-1 text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Chapter
              </button>
            </div>

            {courseLessons.map((lesson, idx) => (
              <div
                key={lesson.id}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2.5"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-xs font-bold text-violet-300">
                  {idx + 1}
                </span>
                <input
                  value={lesson.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCourseLessons((prev) => prev.map((l) => (l.id === lesson.id ? { ...l, title: val } : l)));
                  }}
                  className="h-8 flex-1 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white focus:outline-none"
                />
                <input
                  value={lesson.duration}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCourseLessons((prev) => prev.map((l) => (l.id === lesson.id ? { ...l, duration: val } : l)));
                  }}
                  className="h-8 w-16 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-center text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCourseLessons((prev) =>
                      prev.map((l) => (l.id === lesson.id ? { ...l, isFreePreview: !l.isFreePreview } : l)),
                    );
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition cursor-pointer",
                    lesson.isFreePreview
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-white/5 text-zinc-400 border border-white/10",
                  )}
                  title={lesson.isFreePreview ? "Free sample lesson" : "Locked for enrolled students"}
                >
                  {lesson.isFreePreview ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  <span>{lesson.isFreePreview ? "Free" : "Locked"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCourseLessons((prev) => prev.filter((l) => l.id !== lesson.id))}
                  disabled={courseLessons.length <= 1}
                  className="p-1 text-zinc-500 hover:text-red-400 disabled:opacity-20 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void handleAddCourse()}
            disabled={savingCourse || !courseTitle.trim() || !courseCheckoutUrl.trim()}
            className="w-full h-11 rounded-xl bg-violet-600 font-semibold text-sm text-white hover:bg-violet-500 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-violet-600/20"
          >
            {savingCourse ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Publish Course Card with Syllabus to Bio</span>
          </button>
        </div>
      )}

      {/* 2. 1:1 PAID SESSIONS TAB */}
      {activeTab === "sessions" && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
                <Calendar className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white">1:1 Paid Mentorship & Video Calls</h2>
                <p className="text-xs text-zinc-400">Offer consulting, portfolio reviews, and architecture sessions directly.</p>
              </div>
            </div>
            <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold text-sky-400 border border-sky-500/20">
              CALENDAR BOOKING
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-zinc-400">Session Name</label>
              <input
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g. 45 Min 1:1 Architecture Review"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-sky-500/50 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[11px] font-medium text-zinc-400">Rate</label>
                <input
                  value={sessionPrice}
                  onChange={(e) => setSessionPrice(e.target.value)}
                  placeholder="₹999"
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-sky-500/50 focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-medium text-zinc-400">Duration</label>
                <input
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(e.target.value)}
                  placeholder="45 mins"
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-sky-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400">Booking Link (Calendar / Video Call URL)</label>
            <input
              value={sessionUrl}
              onChange={(e) => setSessionUrl(e.target.value)}
              placeholder="https://cal.com/your_handle or https://calendly.com/..."
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-sky-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400">What attendees get (bullet summary)</label>
            <input
              value={sessionDeliverables}
              onChange={(e) => setSessionDeliverables(e.target.value)}
              placeholder="Live Debugging, Resume Audit, Roadmap Plan"
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-sky-500/50 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleAddSession()}
            disabled={savingSession || !sessionTitle.trim() || !sessionUrl.trim()}
            className="w-full h-11 rounded-xl bg-sky-600 font-semibold text-sm text-white hover:bg-sky-500 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-sky-600/20"
          >
            {savingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Add Paid 1:1 Session to Bio</span>
          </button>
        </div>
      )}

      {/* 3. DIGITAL PRODUCTS TAB */}
      {activeTab === "products" && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white">Digital Downloads & E-Book Store</h2>
                <p className="text-xs text-zinc-400">Sell code boilerplates, cheat sheets, presets, and guides with instant download triggers.</p>
              </div>
            </div>
            <span className="rounded-full bg-fuchsia-500/10 px-2.5 py-0.5 text-[10px] font-bold text-fuchsia-400 border border-fuchsia-500/20">
              DIGITAL GOODS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-zinc-400">Product Title</label>
              <input
                value={prodTitle}
                onChange={(e) => setProdTitle(e.target.value)}
                placeholder="Product title"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-fuchsia-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-400">Price</label>
              <input
                value={prodPrice}
                onChange={(e) => setProdPrice(e.target.value)}
                placeholder="₹499 or $19"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-fuchsia-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-zinc-400">Checkout / Download Link</label>
              <input
                value={prodUrl}
                onChange={(e) => setProdUrl(e.target.value)}
                placeholder="https://yourstore.com/download/... or https://payhip.com/..."
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-fuchsia-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-400">File Format</label>
              <input
                value={prodFormat}
                onChange={(e) => setProdFormat(e.target.value)}
                placeholder="ZIP Code + PDF"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-fuchsia-500/50 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleAddProduct()}
            disabled={savingProd || !prodTitle.trim() || !prodUrl.trim()}
            className="w-full h-11 rounded-xl bg-fuchsia-600 font-semibold text-sm text-white hover:bg-fuchsia-500 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-fuchsia-600/20"
          >
            {savingProd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Add Digital Download Card to Bio</span>
          </button>
        </div>
      )}

      {/* 4. UPI & DIRECT SUPPORT */}
      {activeTab === "tipping" && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <QrCode className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white">Direct UPI & Creator Support</h2>
                <p className="text-xs text-zinc-400">Accept 0% fee direct contributions via instant UPI payment apps.</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
              0% FEES
            </span>
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400">Your UPI ID (VPA)</label>
            <input
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. creator@okaxis, handle@paytm, name@okhdfcbank"
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none font-mono"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleAddUpi()}
            disabled={savingTip || !upiId.trim()}
            className="w-full h-11 rounded-xl bg-emerald-600 font-semibold text-sm text-white hover:bg-emerald-500 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            {savingTip ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Add UPI Pay Card to Bio</span>
          </button>
        </div>
      )}
    </div>
  );
}

export const SuperprofileStudio = CreatorMonetizationStudio;
