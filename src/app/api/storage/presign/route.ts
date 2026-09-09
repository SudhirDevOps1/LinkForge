// 🔏 POST /api/storage/presign — direct browser→storage uploads (S3-family only)
// B2 / R2 / S3 / MinIO par browser seedha storage par upload kar sakta hai —
// server bandwidth zero. Local/Vercel-Blob providers par 501.
import { z } from "zod";
import { isS3Compatible } from "@/config/storage.config";
import { ALLOWED_IMAGE_TYPES } from "@/config/storage.config";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getStorage, newKey } from "@/lib/storage";

const schema = z.object({
  contentType: z.enum(ALLOWED_IMAGE_TYPES),
  folder: z.enum(["avatars", "thumbs"]).optional().default("avatars"),
});

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "storage:presign", 20);
  await requireUser();
  if (!isS3Compatible) {
    throw new ApiError(
      501,
      "Presigned uploads sirf S3-compatible providers (b2/r2/s3/minio) par available hain",
    );
  }
  const { contentType, folder } = parseOrThrow(schema, await req.json().catch(() => ({})));
  const storage = await getStorage();
  if (!storage.getPresignedUploadUrl) throw new ApiError(501, "Provider presign support nahi karta");
  const result = await storage.getPresignedUploadUrl(
    newKey(folder, contentType.split("/")[1] ?? "bin"),
    contentType,
  );
  return json(result); // { url (PUT), key, publicUrl }
});
