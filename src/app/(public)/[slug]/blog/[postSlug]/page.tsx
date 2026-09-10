// 📖 Single Blog Post Reader View — Object Storage Powered
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getBlogPost } from "@/lib/blog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Lightweight server-side markdown → HTML (no external deps) */
function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, (_m, code) =>
    `<pre class="my-4 overflow-x-auto rounded-xl bg-zinc-900 border border-white/10 p-4 text-sm font-mono text-emerald-300 leading-relaxed"><code>${code.trimEnd()}</code></pre>`
  );
  html = html.replace(/`([^`\n]+)`/g, (_m, c) =>
    `<code class="rounded bg-white/10 px-1.5 py-0.5 text-sm font-mono text-violet-300">${c}</code>`
  );
  html = html.replace(/^#### (.+)$/gm, (_m, t) => `<h4 class="mt-5 text-base font-bold text-white">${t}</h4>`);
  html = html.replace(/^### (.+)$/gm, (_m, t) => `<h3 class="mt-6 text-lg font-bold text-white">${t}</h3>`);
  html = html.replace(/^## (.+)$/gm, (_m, t) => `<h2 class="mt-7 text-xl font-bold text-white">${t}</h2>`);
  html = html.replace(/^# (.+)$/gm, (_m, t) => `<h1 class="mt-8 text-2xl font-black text-white">${t}</h1>`);
  html = html.replace(/^&gt; (.+)$/gm, (_m, t) =>
    `<blockquote class="my-4 border-l-4 border-violet-500 pl-5 text-zinc-400 italic">${t}</blockquote>`
  );
  html = html.replace(/^---+$/gm, `<hr class="my-8 border-white/10" />`);
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, `<strong><em>$1</em></strong>`);
  html = html.replace(/\*\*(.+?)\*\*/g, `<strong class="font-semibold text-white">$1</strong>`);
  html = html.replace(/\*([^*\n]+?)\*/g, `<em class="italic text-zinc-300">$1</em>`);
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    `<a href="$2" target="_blank" rel="noopener noreferrer" class="text-violet-400 underline underline-offset-2 hover:text-violet-300">$1</a>`
  );
  html = html.replace(/^[-*] (.+)$/gm, (_m, t) => `<li class="ml-5 list-disc text-zinc-300">${t}</li>`);
  html = html.replace(/^\d+\. (.+)$/gm, (_m, t) => `<li class="ml-5 list-decimal text-zinc-300">${t}</li>`);
  html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, (block) => `<ul class="my-4 space-y-1.5">${block}</ul>`);
  html = html.split(/\n\n+/).map((block) => {
    const t = block.trim();
    if (!t) return "";
    if (/^<(h[1-6]|ul|ol|blockquote|pre|hr)/.test(t)) return t;
    return `<p class="mt-4 leading-7 text-zinc-300">${t.replace(/\n/g, " ")}</p>`;
  }).join("\n");
  return html;
}

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
  if (!post) post = await getBlogPost(cleanSlug, postSlug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-ink-950 text-white selection:bg-violet-500/30">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-[700px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[120px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-2">
            <Link href={`/${slug}/blog`} className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition border border-white/10">
              <ArrowLeft className="h-3.5 w-3.5" /> All Entries
            </Link>
            <Link href={`/${slug}`} className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition border border-white/10">
              @{slug}
            </Link>
          </div>
          <span className="flex items-center gap-1 text-xs text-zinc-400"><Clock className="h-3 w-3" /> {post.readingTime}</span>
        </div>

        <article className="mt-10">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl leading-tight">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-400 border-b border-white/10 pb-6">
            <span className="text-zinc-300 font-medium">By {profile.displayName}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span>•</span>
            <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-mono uppercase text-violet-300 border border-violet-500/20">{post.format}</span>
          </div>

          {post.coverImage && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 max-h-96">
              <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="mt-8">
            {post.format === "html" ? (
              <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
            ) : post.format === "txt" ? (
              <pre className="whitespace-pre-wrap font-sans text-base leading-7 text-zinc-300">{post.content}</pre>
            ) : (
              <div className="max-w-none text-base" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
            )}
          </div>

          {post.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-white/10 pt-6">
              {post.tags.map((t) => (
                <span key={t} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-zinc-400 border border-white/10">#{t}</span>
              ))}
            </div>
          )}

          <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-violet-400 shrink-0 bg-violet-950 flex items-center justify-center font-bold text-violet-300">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" />
                ) : profile.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{profile.displayName}</h4>
                <p className="text-xs text-zinc-400 line-clamp-1">{profile.bio || "Explore more links and content"}</p>
              </div>
            </div>
            <Link href={`/${slug}`} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition shrink-0">
              View Full Profile →
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}