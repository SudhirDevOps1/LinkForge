// =============================================================================
// 🌐 /api/storage/cors — Backblaze B2 CORS Rules Config & Automation
// GET: Returns the exact JSON snippet to paste into Backblaze B2 Dashboard.
// POST: Automatically syncs CORS rules directly to Backblaze B2 via S3 API.
// =============================================================================
import {
  getB2CorsRulesJson,
  getCorsAllowedOrigins,
  storageDriver,
} from "@/config/storage.config";
import { assertSameOrigin, handle, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getStorageAdapter } from "@/lib/storage";
import { B2StorageAdapter } from "@/lib/storage/b2-adapter";

export const GET = handle(async (req: Request) => {
  const url = new URL(req.url);
  const shouldSync = url.searchParams.get("sync") === "1" || url.searchParams.get("sync") === "true";

  const origins = getCorsAllowedOrigins();
  let syncResult: { success: boolean; message?: string } | null = null;

  if (shouldSync) {
    const adapter = await getStorageAdapter();
    if (adapter instanceof B2StorageAdapter) {
      syncResult = await adapter.ensureCorsRules(origins);
    }
  }

  const rawRules = JSON.parse(getB2CorsRulesJson(origins)) as unknown;

  return json({
    driver: storageDriver,
    allowedOrigins: origins,
    syncResult,
    corsRules: rawRules,
    instructions: {
      step1: "Go to Backblaze B2 Console -> Buckets",
      step2: "Click 'Bucket Settings' next to your bucket",
      step3: "Under 'CORS Rules', select: 'Share everything in this bucket with this one origin:'",
      step4: "Enter: https://linkforge-demo.vercel.app and select 'Both'",
      step5: "Click 'Update CORS Rules'. Direct browser-to-B2 uploads will now work.",
    },
  });
});

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await requireUser();

  const body = (await req.json().catch(() => ({}))) as {
    origins?: string[];
  };

  const adapter = await getStorageAdapter();

  if (adapter instanceof B2StorageAdapter) {
    const res = await adapter.ensureCorsRules(body.origins);
    return json({
      driver: "b2",
      success: res.success,
      origins: res.origins,
      message: res.success
        ? "CORS rules automatically applied to Backblaze B2 bucket!"
        : `Could not automatically apply to B2: ${res.message}. Please paste corsRules from GET /api/storage/cors in the B2 console.`,
      corsRules: JSON.parse(getB2CorsRulesJson(res.origins)),
    });
  }

  return json({
    driver: adapter.driver,
    success: true,
    origins: getCorsAllowedOrigins(),
    message: "Local storage active; no remote B2 CORS required.",
  });
});
