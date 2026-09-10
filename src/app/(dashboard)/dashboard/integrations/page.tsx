// 🔌 Dashboard — Integrations & Content Importer Studio
import { redirect } from "next/navigation";
import { IntegrationsHub } from "@/components/integrations-hub";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/login");
  if (!ctx.profile) redirect("/dashboard/settings");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Integrations & Content Hub</h1>
        <p className="mt-1 text-sm text-zinc-400">
          YouTube playlists, multi-lesson course curriculums, Spotify players, Substack newsletters,
          Gumroad stores, Calendly bookings aur GitHub repos ko 1-click me preview aur bio me import karein.
        </p>
      </div>
      <IntegrationsHub defaultGithubUser="SudhirDevOps1" />
    </div>
  );
}
