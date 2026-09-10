// 🛍️ Dashboard — Superprofile Monetization & Creator Store Studio
import { redirect } from "next/navigation";
import { SuperprofileStudio } from "@/components/superprofile-studio";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/login");
  if (!ctx.profile) redirect("/dashboard/settings");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Superprofile Monetization Studio</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Sell digital courses with chapter curriculums, paid 1:1 video consultations, digital downloads,
          aur 0% fee direct UPI support ko apne link-in-bio page se monetize karein.
        </p>
      </div>
      <SuperprofileStudio />
    </div>
  );
}
