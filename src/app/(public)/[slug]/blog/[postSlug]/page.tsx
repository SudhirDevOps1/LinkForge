// 📖 Single Blog Post Reader View — B2 Object Storage Powered
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Clock, Share2 } from "lucide-react";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getBlogPost } from "@/lib/blog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BlogPostReaderPage(props: {
  params: Promise<{ slug: string; postSlug: string }>;
}) {
  const { slug, postSlug } = await props.params;
  const cleanSlug = (slug || "").toLowerCase().trim();

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.slug, cleanSlug),
  });

  if (!profile) notFound();

  let post = await getBlogPost(profile.id, postSlug);
  if (!post) {
    post = await getBlogPost(cleanSlug, postSlug);
  }
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-ink-950 text-white selection:bg-violet-500/30">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-96 w-[700px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Navigation Strip */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-2">
            <Link
              href={`/${slug}/blog`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition border border-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All Entries
            </Link>
            <Link
              href={`/${slug}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition border border-white/10"
            >
              @{slug}
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readingTime}</span>
          </div>
        </div>

        {/* Article Header */}
        <article className="mt-10">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl leading-tight">
            {post.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-400 border-b border-white/10 pb-6">
            <span className="flex items-center gap-1 text-zinc-300 font-medium">
              By {profile.displayName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span>•</span>
            <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-mono uppercase text-violet-300 border border-violet-500/20">
              {post.format}
            </span>
          </div>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 max-h-96">
              <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Body Content */}
          <div className="mt-8">
            {post.format === "html" ? (
              <div
                className="prose prose-invert max-w-none text-zinc-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            ) : (
              <div className="prose prose-invert max-w-none text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap">
                {post.content}
              </div>
            )}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-white/10 pt-6">
              {post.tags.map((t) => (
                <span key={t} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-zinc-400 border border-white/10">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Author Footer Card */}
          <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-violet-400 shrink-0 bg-violet-950 flex items-center justify-center font-bold text-violet-300">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" />
                ) : (
                  profile.displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{profile.displayName}</h4>
                <p className="text-xs text-zinc-400 line-clamp-1">{profile.bio || "Explore more links & content"}</p>
              </div>
            </div>
            <Link
              href={`/${slug}`}
              className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition shrink-0"
            >
              View Full Bio Profile →
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
