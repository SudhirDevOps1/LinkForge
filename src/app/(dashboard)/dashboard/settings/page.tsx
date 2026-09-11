// ⚙️ Dashboard — Settings page (server data → client tabs)
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings-client";
import { db } from "@/db";
import { apiKeys, webhooks } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/login");
  const { user, profile } = ctx;
  if (!profile) {
    return (
      <div className="rounded-2xl border border-white/10 bg-ink-900/50 p-8 text-center">
        <h2 className="text-lg font-semibold text-white">Setting up your profile</h2>
        <p className="mt-1 text-sm text-zinc-400">Please refresh the page in a moment.</p>
      </div>
    );
  }

  const [hooks, keys] = await Promise.all([
    db.select().from(webhooks).where(eq(webhooks.profileId, profile.id)).orderBy(desc(webhooks.createdAt)),
    db.select().from(apiKeys).where(eq(apiKeys.userId, user.id)).orderBy(desc(apiKeys.createdAt)),
  ]);

  return (
    <SettingsClient
      userEmail={user.email}
      twoFactorEnabled={Boolean(user.twoFactorEnabled)}
      profile={{
        slug: profile.slug,
        displayName: profile.displayName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        customDomain: profile.customDomain,
        seoTitle: profile.seoTitle,
        seoDescription: profile.seoDescription,
        ogImageUrl: profile.ogImageUrl,
        analyticsEnabled: profile.analyticsEnabled,
        isPublished: profile.isPublished,
        // 🔒 Privacy — never send hash, only boolean
        hasPassword: Boolean(profile.profilePassword),
        noIndex: profile.noIndex ?? false,
        hidePublicStats: profile.hidePublicStats ?? false,
        announcement: (profile.announcement as { text: string; emoji?: string; url?: string; expiresAt?: string } | null) ?? null,
        metaPixelId: profile.metaPixelId ?? null,
        tiktokPixelId: profile.tiktokPixelId ?? null,
        googleAnalyticsId: profile.googleAnalyticsId ?? null,
        mailchimpApiKey: profile.mailchimpApiKey ?? null,
        upiId: profile.upiId ?? null,
      }}
      webhooks={hooks.map((w) => ({
        id: w.id,
        url: w.url,
        events: w.events.split(",").map((e) => e.trim()),
        isActive: w.isActive,
        secretPreview: `${w.secret.slice(0, 6)}…`,
        createdAt: w.createdAt.toISOString(),
      }))}
      apiKeys={keys.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        revoked: Boolean(k.revokedAt),
        createdAt: k.createdAt.toISOString(),
      }))}
    />
  );
}
