// 📝 Dashboard — Daily Micro-Journal & Blog Studio (B2 Storage-Backed)
import { redirect } from "next/navigation";
import { BlogStudio } from "@/components/blog-studio";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/login");
  if (!ctx.profile) redirect("/dashboard/settings");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Daily Micro-Blog & Journal Studio</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Publish daily articles, changelogs, and updates. All posts are streamed directly to Backblaze B2 or Object Storage (.md, .txt, .html) — maintaining zero storage bloat in your relational database!
        </p>
      </div>
      <BlogStudio profileSlug={ctx.profile.slug} />
    </div>
  );
}
