"use client";

import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ExternalLink,
  Flame,
  Globe,
  Headphones,
  Layers,
  Loader2,
  MessageCircle,
  Music,
  Plus,
  Radio,
  Rss,
  ShoppingBag,
  Sparkles,
  Trash2,
  Tv,
  Video,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BrandIcon } from "./icons";
import { GithubIntegration } from "./github-integration";
import { cn } from "./ui";

type TabId = "youtube" | "spotify" | "newsletter" | "store" | "booking" | "community" | "github";

interface LessonItem {
  id: string;
  title: string;
  url: string;
  duration?: string;
}

export function IntegrationsHub({ defaultGithubUser = "SudhirDevOps1" }: { defaultGithubUser?: string }) {
  const [activeTab, setActiveTab] = useState<TabId>("youtube");

  // YouTube / Video State
  const [ytUrl, setYtUrl] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const [ytPreview, setYtPreview] = useState<{
    title: string;
    author?: string;
    thumbnailUrl?: string;
    url: string;
  } | null>(null);

  // Course / Curriculum Playlist Builder State
  const [courseTitle, setCourseTitle] = useState("");
  const [courseCategory, setCourseCategory] = useState("Full Course");
  const [lessons, setLessons] = useState<LessonItem[]>([
    { id: "1", title: "Lesson 1: Getting Started & Setup", url: "https://youtube.com", duration: "12m" },
    { id: "2", title: "Lesson 2: Core Architecture & Components", url: "https://youtube.com", duration: "25m" },
  ]);
  const [isImportingCourse, setIsImportingCourse] = useState(false);

  // Spotify State
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyPreview, setSpotifyPreview] = useState<{
    title: string;
    thumbnailUrl?: string;
    url: string;
  } | null>(null);

  // Newsletter (Substack / Medium / RSS) State
  const [feedUrl, setFeedUrl] = useState("");
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedArticles, setFeedArticles] = useState<
    Array<{ title: string; url: string; description: string; pubDate?: string }>
  >([]);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [isImportingFeed, setIsImportingFeed] = useState(false);

  // Digital Store / Product Builder State
  const [prodTitle, setProdTitle] = useState("");
  const [prodPrice, setProdPrice] = useState("$29");
  const [prodUrl, setProdUrl] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPlatform, setProdPlatform] = useState("Gumroad");
  const [isImportingProd, setIsImportingProd] = useState(false);

  // Calendly / Booking State
  const [bookingTitle, setBookingTitle] = useState("1:1 Mentorship & Code Review");
  const [bookingUrl, setBookingUrl] = useState("");
  const [bookingDuration, setBookingDuration] = useState("30 mins • Free");
  const [isImportingBooking, setIsImportingBooking] = useState(false);

  // Community State
  const [commType, setCommType] = useState<"discord" | "telegram" | "twitch">("discord");
  const [commTitle, setCommTitle] = useState("Join Our Discord Community");
  const [commUrl, setCommUrl] = useState("");
  const [commBadge, setCommBadge] = useState("5,000+ Members");
  const [isImportingComm, setIsImportingComm] = useState(false);

  // 1. YouTube Live Preview
  async function fetchYoutube() {
    if (!ytUrl.trim()) return;
    setYtLoading(true);
    try {
      const res = await fetch(`/api/integrations/feed?type=youtube&url=${encodeURIComponent(ytUrl.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.title) throw new Error(data.error || "Could not verify YouTube video");
      setYtPreview({
        title: data.title,
        author: data.author,
        thumbnailUrl: data.thumbnailUrl,
        url: data.url,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch YouTube info");
    } finally {
      setYtLoading(false);
    }
  }

  // 2. Import Single YouTube Link
  async function importYoutubeLink() {
    if (!ytPreview) return;
    setYtLoading(true);
    try {
      const res = await fetch("/api/integrations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: [
            {
              title: ytPreview.title,
              url: ytPreview.url,
              description: ytPreview.author ? `by ${ytPreview.author}` : "YouTube Video",
              icon: "youtube",
              type: "youtube",
              size: "wide",
              thumbnailUrl: ytPreview.thumbnailUrl || null,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      toast.success(`"${ytPreview.title}" added to bio!`);
      setYtPreview(null);
      setYtUrl("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setYtLoading(false);
    }
  }

  // 3. Import Course / Curriculum Playlist
  async function importCoursePlaylist() {
    if (!courseTitle.trim()) {
      toast.error("Please enter a course or playlist title");
      return;
    }
    const validLessons = lessons.filter((l) => l.title.trim() && l.url.trim());
    if (validLessons.length === 0) {
      toast.error("Please add at least 1 valid lesson URL");
      return;
    }

    setIsImportingCourse(true);
    try {
      const payloadLinks = validLessons.map((l, i) => ({
        title: `[${courseTitle}] ${l.title}`,
        url: l.url.trim(),
        description: `${courseCategory} • Chapter ${i + 1}${l.duration ? ` • ${l.duration}` : ""}`,
        icon: "play",
        type: "course" as const,
        size: "standard" as const,
      }));

      const res = await fetch("/api/integrations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: payloadLinks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import course lessons");
      toast.success(`${data.importedCount ?? validLessons.length} course lessons imported! (${data.skippedCount ?? 0} skipped)`);
      setCourseTitle("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsImportingCourse(false);
    }
  }

  // 4. Spotify Live Preview
  async function fetchSpotify() {
    if (!spotifyUrl.trim()) return;
    setSpotifyLoading(true);
    try {
      const res = await fetch(`/api/integrations/feed?type=spotify&url=${encodeURIComponent(spotifyUrl.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.title) throw new Error(data.error || "Could not verify Spotify track");
      setSpotifyPreview({
        title: data.title,
        thumbnailUrl: data.thumbnailUrl,
        url: data.url,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch Spotify info");
    } finally {
      setSpotifyLoading(false);
    }
  }

  // 5. Import Spotify Embed
  async function importSpotifyLink() {
    if (!spotifyPreview) return;
    setSpotifyLoading(true);
    try {
      const res = await fetch("/api/integrations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: [
            {
              title: spotifyPreview.title,
              url: spotifyPreview.url,
              description: "Listen on Spotify",
              icon: "spotify",
              type: "spotify",
              size: "wide",
              thumbnailUrl: spotifyPreview.thumbnailUrl || null,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      toast.success("Spotify player added to bio!");
      setSpotifyPreview(null);
      setSpotifyUrl("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSpotifyLoading(false);
    }
  }

  // 6. Fetch RSS / Substack / Medium Articles
  async function fetchFeed() {
    if (!feedUrl.trim()) return;
    setFeedLoading(true);
    try {
      const res = await fetch(`/api/integrations/feed?type=rss&url=${encodeURIComponent(feedUrl.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.items || data.items.length === 0) {
        throw new Error(data.error || "No articles or RSS feed found. Please check the URL.");
      }
      setFeedArticles(data.items);
      setSelectedArticles(new Set(data.items.slice(0, 5).map((a: any) => a.url)));
      toast.success(`${data.items.length} articles loaded!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch feed");
    } finally {
      setFeedLoading(false);
    }
  }

  // 7. Batch Import Feed Articles
  async function importSelectedArticles() {
    if (selectedArticles.size === 0) {
      toast.error("Please select at least one article");
      return;
    }
    setIsImportingFeed(true);
    try {
      const toImport = feedArticles.filter((a) => selectedArticles.has(a.url));
      const res = await fetch("/api/integrations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: toImport.map((item) => ({
            title: item.title,
            url: item.url,
            description: item.description || "Read on Newsletter",
            icon: "substack",
            type: "substack" as const,
            size: "standard" as const,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import articles");
      toast.success(`${data.importedCount ?? toImport.length} articles imported to bio! (${data.skippedCount ?? 0} duplicates skipped)`);
      setFeedArticles([]);
      setSelectedArticles(new Set());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsImportingFeed(false);
    }
  }

  // 8. Import Digital Product Card
  async function importProduct() {
    if (!prodTitle.trim() || !prodUrl.trim()) {
      toast.error("Product title and URL are both required");
      return;
    }
    setIsImportingProd(true);
    try {
      const res = await fetch("/api/integrations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: [
            {
              title: `${prodTitle} [${prodPrice}]`,
              url: prodUrl.trim(),
              description: prodDesc.trim() || `Available on ${prodPlatform}`,
              icon: "shopping-bag",
              type: "product" as const,
              size: "standard" as const,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add product card");
      toast.success(`Product card "${prodTitle}" added to bio!`);
      setProdTitle("");
      setProdUrl("");
      setProdDesc("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsImportingProd(false);
    }
  }

  // 9. Import Calendly / Booking Card
  async function importBooking() {
    if (!bookingTitle.trim() || !bookingUrl.trim()) {
      toast.error("Booking title and URL are required");
      return;
    }
    setIsImportingBooking(true);
    try {
      const res = await fetch("/api/integrations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: [
            {
              title: bookingTitle.trim(),
              url: bookingUrl.trim(),
              description: `Book appointment • ${bookingDuration}`,
              icon: "calendar",
              type: "cal" as const,
              size: "standard" as const,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add booking card");
      toast.success(`Booking card "${bookingTitle}" added to bio!`);
      setBookingUrl("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsImportingBooking(false);
    }
  }

  // 10. Import Community Card
  async function importCommunity() {
    if (!commTitle.trim() || !commUrl.trim()) {
      toast.error("Community title and URL are both required");
      return;
    }
    setIsImportingComm(true);
    try {
      const res = await fetch("/api/integrations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: [
            {
              title: commTitle.trim(),
              url: commUrl.trim(),
              description: commBadge.trim() || "Official Community Group",
              icon: commType,
              type: commType,
              size: "standard" as const,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add community card");
      toast.success(`Community card "${commTitle}" added to bio!`);
      setCommUrl("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsImportingComm(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation Pill Strip */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
        <button
          type="button"
          onClick={() => setActiveTab("youtube")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
            activeTab === "youtube"
              ? "bg-red-500/20 text-red-300 border border-red-500/30 shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
        >
          <BrandIcon id="youtube" className="h-4 w-4 text-red-500" />
          <span>YouTube & Courses</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("spotify")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
            activeTab === "spotify"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
        >
          <BrandIcon id="spotify" className="h-4 w-4 text-emerald-400" />
          <span>Spotify Music</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("newsletter")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
            activeTab === "newsletter"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
        >
          <Rss className="h-4 w-4 text-amber-400" />
          <span>Substack / Medium</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("store")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
            activeTab === "store"
              ? "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
        >
          <ShoppingBag className="h-4 w-4 text-fuchsia-400" />
          <span>Digital Store</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("booking")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
            activeTab === "booking"
              ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
        >
          <Calendar className="h-4 w-4 text-sky-400" />
          <span>Calendly / Booking</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("community")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
            activeTab === "community"
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
        >
          <MessageCircle className="h-4 w-4 text-indigo-400" />
          <span>Communities</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("github")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
            activeTab === "github"
              ? "bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
        >
          <BrandIcon id="github" className="h-4 w-4 text-white" />
          <span>GitHub Repos</span>
        </button>
      </div>

      {/* 1. YOUTUBE & COURSE PLAYLIST BUILDER */}
      {activeTab === "youtube" && (
        <div className="space-y-6">
          {/* Quick Video Importer */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <BrandIcon id="youtube" className="h-5 w-5 text-red-500" />
                <span>Quick YouTube Embed</span>
              </div>
              <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/20">
                1-CLICK EMBED
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Enter any YouTube video URL — automatically detects the title and HD thumbnail to create an interactive embedded video card on your public bio.
            </p>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <input
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void fetchYoutube();
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-11 flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 text-sm text-white placeholder:text-zinc-600 focus:border-red-500/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void fetchYoutube()}
                disabled={ytLoading || !ytUrl.trim()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50 cursor-pointer"
              >
                {ytLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>Fetch Video</span>
              </button>
            </div>

            {/* Video Preview Card */}
            {ytPreview && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-black/60 p-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {ytPreview.thumbnailUrl && (
                    <img
                      src={ytPreview.thumbnailUrl}
                      alt={ytPreview.title}
                      className="h-16 w-28 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{ytPreview.title}</p>
                    {ytPreview.author && <p className="text-xs text-zinc-400 mt-0.5">{ytPreview.author}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void importYoutubeLink()}
                  disabled={ytLoading}
                  className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition shrink-0 cursor-pointer"
                >
                  Add to Bio
                </button>
              </div>
            )}
          </div>

          {/* Full Multi-Lesson Course / Curriculum Playlist Builder */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-white">Course & Curriculum Playlist Builder</h3>
              <p className="text-xs text-zinc-400">
                Create your complete course, tutorial playlist, or video curriculum in one place. Each lesson is added as a structured chapter card to your bio links.
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-zinc-400">Course / Playlist Name</label>
                  <input
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g. Next.js 15 & DevOps Mastery Course"
                    className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-zinc-400">Badge / Tag</label>
                  <input
                    value={courseCategory}
                    onChange={(e) => setCourseCategory(e.target.value)}
                    placeholder="e.g. Free 6-Part Course"
                    className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Lesson Items */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Curriculum Chapters ({lessons.length} lessons)</span>
                  <button
                    type="button"
                    onClick={() =>
                      setLessons((prev) => [
                        ...prev,
                        {
                          id: String(Date.now()),
                          title: `Lesson ${prev.length + 1}: `,
                          url: "",
                          duration: "15m",
                        },
                      ])
                    }
                    className="flex items-center gap-1 text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Lesson
                  </button>
                </div>

                {lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    className="flex flex-col sm:flex-row gap-2 items-center rounded-xl border border-white/10 bg-black/30 p-2.5"
                  >
                    <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/20 text-xs font-bold text-violet-300 border border-violet-500/30">
                      {idx + 1}
                    </span>
                    <input
                      value={lesson.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLessons((prev) => prev.map((l) => (l.id === lesson.id ? { ...l, title: val } : l)));
                      }}
                      placeholder="Lesson title (e.g. Lesson 1: Introduction)"
                      className="h-9 flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none"
                    />
                    <input
                      value={lesson.url}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLessons((prev) => prev.map((l) => (l.id === lesson.id ? { ...l, url: val } : l)));
                      }}
                      placeholder="https://youtu.be/... (video link)"
                      className="h-9 flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none"
                    />
                    <input
                      value={lesson.duration}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLessons((prev) => prev.map((l) => (l.id === lesson.id ? { ...l, duration: val } : l)));
                      }}
                      placeholder="15m"
                      className="h-9 w-20 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-center text-white placeholder:text-zinc-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setLessons((prev) => prev.filter((l) => l.id !== lesson.id))}
                      disabled={lessons.length <= 1}
                      className="p-1.5 text-zinc-500 hover:text-red-400 disabled:opacity-20 cursor-pointer"
                      title="Remove lesson"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => void importCoursePlaylist()}
                  disabled={isImportingCourse || !courseTitle.trim()}
                  className="w-full h-11 rounded-xl bg-violet-600 font-semibold text-sm text-white hover:bg-violet-500 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isImportingCourse ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>Publish All {lessons.length} Lessons to Bio Links</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 2. SPOTIFY & AUDIO MUSIC IMPORTER */}
      {activeTab === "spotify" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <BrandIcon id="spotify" className="h-5 w-5 text-emerald-400" />
              <span>Spotify Track / Album / Playlist Player</span>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
              AUDIO EMBED
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Embed Spotify Player</h3>
            <p className="text-xs text-zinc-400">
              Paste a Spotify track, album, or podcast URL. An interactive audio player will embed directly on your profile so visitors can listen in one tap.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <input
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void fetchSpotify();
              }}
              placeholder="https://open.spotify.com/track/... or playlist/..."
              className="h-11 flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void fetchSpotify()}
              disabled={spotifyLoading || !spotifyUrl.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
            >
              {spotifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>Inspect Track</span>
            </button>
          </div>

          {spotifyPreview && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-black/60 p-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {spotifyPreview.thumbnailUrl && (
                  <img
                    src={spotifyPreview.thumbnailUrl}
                    alt={spotifyPreview.title}
                    className="h-16 w-16 rounded-lg object-cover border border-white/10 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{spotifyPreview.title}</p>
                  <p className="text-xs text-emerald-400 mt-0.5">Ready to embed as playable widget</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void importSpotifyLink()}
                disabled={spotifyLoading}
                className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition shrink-0 cursor-pointer"
              >
                Add Player to Bio
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. NEWSLETTER (SUBSTACK / MEDIUM / RSS) */}
      {activeTab === "newsletter" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Rss className="h-5 w-5 text-amber-500" />
              <span>Newsletter & Blog RSS Auto-Importer</span>
            </div>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
              SUBSTACK / MEDIUM
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Enter your Substack URL (e.g. <code>https://username.substack.com</code>) or Medium handle to automatically discover and link your latest published posts.
          </p>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <input
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void fetchFeed();
              }}
              placeholder="https://newsletter.substack.com or medium.com/@user"
              className="h-11 flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void fetchFeed()}
              disabled={feedLoading || !feedUrl.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50 cursor-pointer"
            >
              {feedLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rss className="h-4 w-4" />}
              <span>Sync Articles</span>
            </button>
          </div>

          {feedArticles.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/10 pb-2">
                <span>Select articles to import ({selectedArticles.size} selected)</span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedArticles.size === feedArticles.length) {
                      setSelectedArticles(new Set());
                    } else {
                      setSelectedArticles(new Set(feedArticles.map((a) => a.url)));
                    }
                  }}
                  className="text-amber-400 hover:underline cursor-pointer"
                >
                  {selectedArticles.size === feedArticles.length ? "Deselect all" : "Select all"}
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {feedArticles.map((art) => {
                  const isChecked = selectedArticles.has(art.url);
                  return (
                    <div
                      key={art.url}
                      onClick={() => {
                        setSelectedArticles((prev) => {
                          const next = new Set(prev);
                          if (next.has(art.url)) next.delete(art.url);
                          else next.add(art.url);
                          return next;
                        });
                      }}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition",
                        isChecked
                          ? "border-amber-500/40 bg-amber-500/10"
                          : "border-white/10 bg-black/30 hover:border-white/20",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 rounded border-white/20 text-amber-500 focus:ring-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{art.title}</p>
                        {art.description && (
                          <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{art.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => void importSelectedArticles()}
                disabled={isImportingFeed || selectedArticles.size === 0}
                className="w-full h-11 rounded-xl bg-amber-600 font-semibold text-sm text-white hover:bg-amber-500 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isImportingFeed ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>Import {selectedArticles.size} Articles as Newsletter Cards</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. DIGITAL STORE & CREATOR PRODUCTS */}
      {activeTab === "store" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShoppingBag className="h-5 w-5 text-fuchsia-400" />
              <span>Digital Products & Creator Store Showcase</span>
            </div>
            <span className="rounded-full bg-fuchsia-500/10 px-2.5 py-0.5 text-[10px] font-bold text-fuchsia-400 border border-fuchsia-500/20">
              E-COMMERCE
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Add a digital product link from your storefront. Displays with clear pricing, format badge, and direct purchase call-to-action.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-zinc-400">Product / E-Book / Template Title</label>
              <input
                value={prodTitle}
                onChange={(e) => setProdTitle(e.target.value)}
                placeholder="e.g. Complete SaaS Starter Boilerplate"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-zinc-600 focus:border-fuchsia-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-400">Price Badge</label>
              <input
                value={prodPrice}
                onChange={(e) => setProdPrice(e.target.value)}
                placeholder="$29 or ₹1,499"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-zinc-600 focus:border-fuchsia-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-zinc-400">Checkout / Product URL</label>
              <input
                value={prodUrl}
                onChange={(e) => setProdUrl(e.target.value)}
                placeholder="https://gumroad.com/l/... or lemonsqueezy.com/..."
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-zinc-600 focus:border-fuchsia-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-400">Platform</label>
              <select
                value={prodPlatform}
                onChange={(e) => setProdPlatform(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-fuchsia-500/50 focus:outline-none"
              >
                <option value="Gumroad">Gumroad</option>
                <option value="LemonSqueezy">LemonSqueezy</option>
                <option value="Payhip">Payhip</option>
                <option value="BuyMeACoffee">Buy Me a Coffee</option>
                <option value="Shopify">Shopify</option>
                <option value="Custom Store">Custom Store</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400">Short Pitch / Description</label>
            <input
              value={prodDesc}
              onChange={(e) => setProdDesc(e.target.value)}
              placeholder="e.g. Production-ready code with authentication & billing included."
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-zinc-600 focus:border-fuchsia-500/50 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => void importProduct()}
            disabled={isImportingProd || !prodTitle.trim() || !prodUrl.trim()}
            className="w-full h-11 rounded-xl bg-fuchsia-600 font-semibold text-sm text-white hover:bg-fuchsia-500 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isImportingProd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Add Product Card to Bio</span>
          </button>
        </div>
      )}

      {/* 5. CALENDLY / BOOKINGS */}
      {activeTab === "booking" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Calendar className="h-5 w-5 text-sky-400" />
              <span>Calendly & Cal.com Scheduling</span>
            </div>
            <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold text-sky-400 border border-sky-500/20">
              MEETINGS
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Schedule 1-on-1 mentorship calls, client consultations, or discovery sessions with a direct booking card.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-zinc-400">Meeting / Session Title</label>
              <input
                value={bookingTitle}
                onChange={(e) => setBookingTitle(e.target.value)}
                placeholder="e.g. 30 Min 1:1 Architecture Consultation"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-zinc-600 focus:border-sky-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-400">Duration / Rate</label>
              <input
                value={bookingDuration}
                onChange={(e) => setBookingDuration(e.target.value)}
                placeholder="30 mins • Free"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-zinc-600 focus:border-sky-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400">Calendly / Cal.com Link</label>
            <input
              value={bookingUrl}
              onChange={(e) => setBookingUrl(e.target.value)}
              placeholder="https://calendly.com/your-handle/30min or https://cal.com/..."
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-zinc-600 focus:border-sky-500/50 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => void importBooking()}
            disabled={isImportingBooking || !bookingTitle.trim() || !bookingUrl.trim()}
            className="w-full h-11 rounded-xl bg-sky-600 font-semibold text-sm text-white hover:bg-sky-500 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isImportingBooking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Add Booking Card to Bio</span>
          </button>
        </div>
      )}

      {/* 6. COMMUNITIES & SOCIALS */}
      {activeTab === "community" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <MessageCircle className="h-5 w-5 text-indigo-400" />
              <span>Discord, Telegram & Twitch Hub</span>
            </div>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
              COMMUNITY
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Add customized community access cards for your Discord server, Telegram channel, or live stream.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-400">Platform</label>
              <select
                value={commType}
                onChange={(e) => setCommType(e.target.value as any)}
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-indigo-500/50 focus:outline-none"
              >
                <option value="discord">Discord Community</option>
                <option value="telegram">Telegram Channel</option>
                <option value="twitch">Twitch Stream</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-zinc-400">Community Title</label>
              <input
                value={commTitle}
                onChange={(e) => setCommTitle(e.target.value)}
                placeholder="e.g. Join the LinkForge Devs Discord"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-zinc-400">Invite / Channel Link</label>
              <input
                value={commUrl}
                onChange={(e) => setCommUrl(e.target.value)}
                placeholder="https://discord.gg/... or https://t.me/..."
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-400">Tag / Members</label>
              <input
                value={commBadge}
                onChange={(e) => setCommBadge(e.target.value)}
                placeholder="e.g. 5,000+ Members"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void importCommunity()}
            disabled={isImportingComm || !commTitle.trim() || !commUrl.trim()}
            className="w-full h-11 rounded-xl bg-indigo-600 font-semibold text-sm text-white hover:bg-indigo-500 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isImportingComm ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Add Community Card to Bio</span>
          </button>
        </div>
      )}

      {/* 7. GITHUB REPOSITORIES (PRESERVED) */}
      {activeTab === "github" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <BrandIcon id="github" className="h-5 w-5 text-white" />
              <span>GitHub Repositories Importer</span>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-zinc-300 border border-white/20">
              OPEN SOURCE
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Preview live public repositories with star counts and batch import them in one click. Existing links remain completely safe.
          </p>

          <GithubIntegration defaultUsername={defaultGithubUser} />
        </div>
      )}
    </div>
  );
}
