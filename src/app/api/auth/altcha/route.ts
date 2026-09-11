// =============================================================================
// 🛡️ GET /api/auth/altcha — Issue fresh Proof-of-Work Challenge
// =============================================================================
import { guardRateLimit, handle, json } from "@/lib/api";
import { createAltchaChallenge } from "@/lib/altcha";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = handle(async (req: Request) => {
  // Protect challenge endpoint from bot flooding (max 60 challenges/min per IP)
  await guardRateLimit(req, "auth:altcha", 60);

  const challenge = createAltchaChallenge();

  return json(challenge, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
});
