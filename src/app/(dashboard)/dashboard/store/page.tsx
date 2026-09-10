// 🛍️ Dashboard — Creator Monetization Studio
import { redirect } from "next/navigation";
import { CreatorMonetizationStudio } from "@/components/creator-studio";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/login");
  if (!ctx.profile) redirect("/dashboard/settings");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Creator Monetization Studio</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Sell digital courses with multi-chapter curriculums, offer paid 1:1 video sessions, distribute digital downloads,
          and collect 0% fee direct payments seamlessly from your link-in-bio profile.
        </p>
      </div>
      <CreatorMonetizationStudio />
    </div>
  );
}

