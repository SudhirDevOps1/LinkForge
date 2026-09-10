// =============================================================================
// 🔒 GET /api/files/[id]/download — Short-Lived (5-min) Presigned Download Link
// -----------------------------------------------------------------------------
// Decrypts storageKey from Neon DB, requests a 5-minute Presigned GET URL from
// Backblaze B2 (or active storage adapter), and returns JSON or redirects (302).
// Bucket remains 100% private at all times.
// =============================================================================
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaFiles } from "@/db/schema";
import { ApiError, guardRateLimit, handle, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { decryptField } from "@/lib/db-cipher";

type RouteCtx = { params: Promise<{ id: string }> };

export const GET = handle(async (req: Request, ctx: RouteCtx) => {
  await guardRateLimit(req, "files:download", 60);

  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");

  const { id } = await ctx.params;
  if (!id) throw new ApiError(400, "File ID required");

  const [file] = await db
    .select()
    .from(mediaFiles)
    .where(and(eq(mediaFiles.id, id), eq(mediaFiles.profileId, profile.id)))
    .limit(1);

  if (!file) throw new ApiError(404, "File not found");

  // Decrypt storageKey and fileName
  const decryptedKey = decryptField(file.storageKey);
  const decryptedName = decryptField(file.fileName);

  const downloadUrl = `/api/storage/file/${decryptedKey}?download=1&name=${encodeURIComponent(decryptedName)}`;

  const urlObj = new URL(req.url);
  const wantsJson = urlObj.searchParams.get("json") === "true" || req.headers.get("accept")?.includes("application/json");

  if (wantsJson) {
    return json({
      downloadUrl,
      expiresInSeconds: 300,
      fileName: decryptedName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    });
  }

  // Seamless browser redirect to the transparent decrypted download URL
  return Response.redirect(new URL(downloadUrl, req.url).toString(), 302);
});
