// 🔌 Dashboard — Integrations (GitHub import)
import { redirect } from "next/navigation";
import { GithubIntegration } from "@/components/github-integration";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/login");
  if (!ctx.profile) redirect("/dashboard/settings");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Integrations</h1>
        <p className="mt-1 text-sm text-zinc-500">
          GitHub repos ko preview karke links me import karo — merge hota hai, manual links safe
          rehte hain.
        </p>
      </div>
      <GithubIntegration defaultUsername="SudhirDevOps1" />
    </div>
  );
}
