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

export const GET = handle(async () => {
  const origins = getCorsAllowedOrigins();
  const rawRules = JSON.parse(getB2CorsRulesJson(origins)) as unknown;

  return json({
    driver: storageDriver,
    allowedOrigins: origins,
    corsRules: rawRules,
    instructions: {
      step1: "Go to Backblaze B2 Console -> Buckets",
      step2: "Click 'Bucket Settings' next to your private bucket",
      step3: "Under 'CORS Rules', select 'Custom' and paste the corsRules JSON",
      step4: "Save changes. Direct browser-to-B2 uploads will now work without CORS blocking.",
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
