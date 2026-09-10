"use client";

import {
  BookOpen,
  Calendar,
  Check,
  Code,
  ExternalLink,
  Eye,
  FileCode,
  FileText,
  Heading,
  Layers,
  Link2,
  List,
  Loader2,
  Plus,
  Quote,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { BlogFormat, BlogPostHeader } from "@/lib/blog";
import { cn } from "./ui";

export function BlogStudio({ profileSlug }: { profileSlug: string }) {
  const [activeTab, setActiveTab] = useState<"editor" | "posts">("editor");
  const [posts, setPosts] = useState<BlogPostHeader[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Editor State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState(
    "# Welcome to My Daily Micro-Journal\n\nToday I want to share key lessons on architecture, DevOps, and shipping clean software...\n\n- **Focus**: Ship production features daily\n- **Storage**: Backblaze B2 object storage for zero DB bloat\n- **Design**: Fast typography with markdown\n\n```bash\n# Build LinkForge\nnpm run build\n```\n\nMore updates coming tomorrow!",
  );
  const [format, setFormat] = useState<BlogFormat>("markdown");
  const [excerpt, setExcerpt] = useState("");
  const [tagsInput, setTagsInput] = useState("tech, devops, links");
  const [coverImage, setCoverImage] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  async function loadPosts() {
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/blog");
      const data = await res.json();
      if (res.ok && data.manifest?.posts) {
        setPosts(data.manifest.posts);
      }
    } catch {
      // silent
    } finally {
      setLoadingPosts(false);
    }
  }

  useEffect(() => {
    void loadPosts();
  }, []);

  // Auto-slugify
  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slug || slug.startsWith("post-")) {
      const auto = val
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .slice(0, 50);
      setSlug(auto);
    }
  }

  function insertFormatting(prefix: string, suffix = "") {
    setContent((prev) => prev + "\n" + prefix + "text" + suffix + "\n");
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.ceil(wordCount / 200));

  async function publishPost() {
    if (!title.trim()) {
      toast.error("Blog title likhein");
      return;
    }
    if (!content.trim()) {
      toast.error("Blog content likhein");
      return;
    }

    setIsPublishing(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
          content: content.trim(),
          format,
          excerpt: excerpt.trim() || undefined,
          tags,
          coverImage: coverImage.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish fail ho gaya");

      toast.success(`Post "${data.post.title}" B2 Object Storage me publish ho gayi!`);
      void loadPosts();
      setActiveTab("posts");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleDelete(postSlug: string) {
    if (!confirm("Kya aap is blog post ko B2 storage se delete karna chahte hain?")) return;
    try {
      const res = await fetch(`/api/blog?slug=${encodeURIComponent(postSlug)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete fail ho gaya");
      toast.success("Post delete ho gayi");
      setPosts((prev) => prev.filter((p) => p.slug !== postSlug));
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function editPost(header: BlogPostHeader) {
    try {
      const res = await fetch(`/api/blog/${header.slug}`);
      const data = await res.json();
      if (res.ok && data.post) {
        setTitle(data.post.title);
        setSlug(data.post.slug);
        setContent(data.post.content || "");
        setFormat(data.post.format || "markdown");
        setExcerpt(data.post.excerpt || "");
        setTagsInput((data.post.tags || []).join(", "));
        setCoverImage(data.post.coverImage || "");
        setActiveTab("editor");
        toast.info("Post editor me load ho gayi");
      }
    } catch {
      toast.error("Post fetch nahi ho saki");
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Live Link */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 rounded-xl bg-white/5 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
              activeTab === "editor" ? "bg-violet-600 text-white shadow-sm" : "text-zinc-400 hover:text-white",
            )}
          >
            <Plus className="h-3.5 w-3.5" /> Write / Edit Daily Post
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
              activeTab === "posts" ? "bg-violet-600 text-white shadow-sm" : "text-zinc-400 hover:text-white",
            )}
          >
            <BookOpen className="h-3.5 w-3.5" /> Published Posts ({posts.length})
          </button>
        </div>

        {profileSlug && (
          <a
            href={`/${profileSlug}/blog`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300"
          >
            <span>View Public Blog Feed</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* 1. EDITOR TAB */}
      {activeTab === "editor" && (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                <FileText className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-white">Daily Micro-Journal & Blog Writer</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-400 border border-emerald-500/20">
                B2 OBJECT STORAGE
              </span>
              <span>• Zero DB bloat</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-zinc-400">Post Title</label>
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Day 42: Production Deployment Lessons"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-400">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as BlogFormat)}
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white focus:border-violet-500/50 focus:outline-none"
              >
                <option value="markdown">Markdown (.md)</option>
                <option value="html">HTML (.html)</option>
                <option value="txt">Plain Text (.txt)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-400">URL Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. day-42-deployment-lessons"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-400">Tags (comma separated)</label>
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="tech, devops, nextjs"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-400">Cover Image URL (optional)</label>
              <input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400">Short Excerpt (Summary for bio card)</label>
            <input
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="1-2 sentences summarizing today's entry..."
              className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
            />
          </div>

          {/* Quick Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-y border-white/10 py-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => insertFormatting("## ")}
                className="rounded px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/5"
                title="Add Heading"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("**", "**")}
                className="rounded px-2 py-1 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5"
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("*", "*")}
                className="rounded px-2 py-1 text-xs italic text-zinc-400 hover:text-white hover:bg-white/5"
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("> ")}
                className="rounded px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/5"
                title="Quote"
              >
                <Quote className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("- ")}
                className="rounded px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/5"
                title="List item"
              >
                <List className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("```ts\n", "\n```")}
                className="rounded px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/5"
                title="Code block"
              >
                <Code className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("[link title](", ")")}
                className="rounded px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/5"
                title="Hyperlink"
              >
                <Link2 className="h-3 w-3" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span>{wordCount} words • {readMins} min read</span>
              <button
                type="button"
                onClick={() => setShowPreview((p) => !p)}
                className="flex items-center gap-1 text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
              >
                <Eye className="h-3 w-3" /> {showPreview ? "Editor" : "Live Preview"}
              </button>
            </div>
          </div>

          {/* Editor or Preview */}
          {!showPreview ? (
            <textarea
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your daily blog entry here in Markdown or HTML..."
              className="w-full rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
            />
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/60 p-5 text-zinc-200 min-h-[300px]">
              <h1 className="text-xl font-bold text-white mb-2">{title || "Untitled Post"}</h1>
              <p className="text-xs text-zinc-400 mb-4">{readMins} min read • {new Date().toLocaleDateString()}</p>
              <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => void publishPost()}
              disabled={isPublishing || !title.trim() || !content.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50 cursor-pointer shadow-lg shadow-violet-600/20"
            >
              {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>Publish to B2 Storage</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. PUBLISHED POSTS LIST */}
      {activeTab === "posts" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">All Published Daily Blogs</h3>
            <span className="text-xs text-zinc-400">{posts.length} entries</span>
          </div>

          {loadingPosts ? (
            <div className="flex items-center justify-center py-12 text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-xs text-zinc-500">
              Abhi tak koi daily blog post publish nahi hui. "Write / Edit Daily Post" par click karein.
            </div>
          ) : (
            <div className="space-y-2.5">
              {posts.map((p) => (
                <div
                  key={p.slug}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 p-4 transition hover:border-white/20"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-white truncate">{p.title}</h4>
                      <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-mono uppercase text-zinc-300">
                        {p.format}
                      </span>
                      <span className="text-[11px] text-zinc-500">• {p.readingTime}</span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-1 mt-1">{p.excerpt}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-zinc-500">
                        {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {p.tags.map((t) => (
                        <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-400">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {profileSlug && (
                      <a
                        href={`/${profileSlug}/blog/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-white/5 p-2 text-zinc-400 hover:text-white border border-white/10 transition"
                        title="View Public Post"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => void editPost(p)}
                      className="rounded-lg bg-violet-600/20 px-3 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-600/30 border border-violet-500/30 transition cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(p.slug)}
                      className="rounded-lg bg-white/5 p-2 text-zinc-400 hover:text-red-400 border border-white/10 transition cursor-pointer"
                      title="Delete from B2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
