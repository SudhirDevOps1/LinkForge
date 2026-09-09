// 📁 Dashboard — Media library page (server data → client manager)
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { MediaManager } from "@/components/media-manager";
import { storageProvider } from "@/config/storage.config";
import { db } from "@/db";
import { mediaFiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PROVIDER_LABELS: Record<string, string> = {
  local: "Local disk",
  b2: "Backblaze B2",
  r2: "Cloudflare R2",
  s3: "AWS S3",
  minio: "MinIO",
  "vercel-blob": "Vercel Blob",
};

export default async function MediaPage() {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/login");
  if (!ctx.profile) redirect("/dashboard/settings");

  const files = await db
    .select()
    .from(mediaFiles)
    .where(eq(mediaFiles.profileId, ctx.profile.id))
    .orderBy(desc(mediaFiles.createdAt))
    .limit(200);

  return (
    <MediaManager
      initialFiles={files.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() }))}
      providerLabel={PROVIDER_LABELS[storageProvider] ?? storageProvider}
    />
  );
}
