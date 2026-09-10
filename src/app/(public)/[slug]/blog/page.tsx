// 📰 Public Daily Blog & Journal Feed — B2 Object Storage Powered
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Clock, ExternalLink, Sparkles, Tag } from "lucide-react";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getBlogManifest } from "@/lib/blog";

export const dynamic = "force-dynamic";

export default async function PublicBlogFeedPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.slug, slug),
  });

  if (!profile) notFound();

  const manifest = await getBlogManifest(profile.id);
  const posts = manifest.posts || [];

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
        {/* Header / Nav */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link
            href={`/${slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition border border-white/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to @{slug} Bio</span>
          </Link>

          <span className="rounded-full bg-violet-500/10 px-3 py-1 text-[11px] font-bold text-violet-300 border border-violet-500/20 flex items-center gap-1.5">
            <BookOpen className="h-3 w-3" /> DAILY MICRO-JOURNAL
          </span>
        </div>

        {/* Profile Card Summary */}
        <div className="mt-8 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-violet-400 shrink-0 bg-violet-950 flex items-center justify-center text-xl font-bold text-violet-300">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" />
            ) : (
              profile.displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-white truncate">{profile.displayName}'s Blog</h1>
            <p className="text-xs text-zinc-400 line-clamp-1">{profile.bio || "Creator, builder, writer."}</p>
          </div>
        </div>

        {/* Posts List */}
        <div className="mt-10 space-y-4">
          <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
            Latest Daily Entries ({posts.length})
          </h2>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-zinc-500">
              Abhi tak koi blog entry publish nahi hui. Soon new stories will appear here!
            </div>
          ) : (
            posts.map((post) => (
              <Link
                key={post.slug}
                href={`/${slug}/blog/${post.slug}`}
                className="group block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-violet-500/40 hover:bg-white/[0.07] hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readingTime}
                      </span>
                      {post.tags.map((tag) => (
                        <span key={tag} className="rounded bg-white/5 px-2 py-0.5 text-zinc-400 border border-white/5">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-violet-600/20 px-3 py-1 text-xs font-semibold text-violet-300 border border-violet-500/30 group-hover:bg-violet-600 group-hover:text-white transition">
                    Read →
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
