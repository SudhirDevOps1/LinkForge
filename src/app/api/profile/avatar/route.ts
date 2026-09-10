// 🖼️ POST /api/profile/avatar — multipart upload → configured storage provider
// (local disk / B2 / R2 / S3 / MinIO / Vercel Blob — STORAGE_PROVIDER ke hisaab se)
import { eq } from "drizzle-orm";
import { ALLOWED_IMAGE_TYPES, MAX_AVATAR_BYTES } from "@/config/storage.config";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { encryptFilePayload } from "@/lib/file-cipher";
import { getStorage, newKey } from "@/lib/storage";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "avatar:upload", 20);
  const { user, profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "file field is required");

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new ApiError(400, "Only JPG, PNG, WebP, and GIF images are allowed");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new ApiError(400, "Avatar image must be smaller than 2 MB");
  }

  const ext = file.type.split("/")[1] ?? "bin";
  const storage = await getStorage();
  const rawData = Buffer.from(await file.arrayBuffer());
  const data = encryptFilePayload(rawData);
  const key = newKey(`avatars/${user.id}`, ext);
  await storage.upload(data, key, file.type);
  const url = `/api/storage/file/${key}`;

  const [updated] = await db
    .update(profiles)
    .set({ avatarUrl: url, updatedAt: new Date() })
    .where(eq(profiles.id, profile.id))
    .returning({ avatarUrl: profiles.avatarUrl });

  return json({ url, provider: storage.provider, profile: updated });
});
