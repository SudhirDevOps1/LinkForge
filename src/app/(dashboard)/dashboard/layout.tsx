// 🧭 Dashboard layout — server-side auth guard + shell
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/login?next=/dashboard");
  return (
    <DashboardShell slug={ctx.profile?.slug ?? null}>{children}</DashboardShell>
  );
}
