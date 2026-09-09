// 🧪 POST /api/webhooks/test — "Send test event" button (settings UI)
import { z } from "zod";
import { ApiError, assertSameOrigin, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { sendTestWebhook } from "@/lib/webhooks";

const bodySchema = z.object({ id: z.string().uuid() });

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "webhooks:test", 10);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile nahi mili");
  const { id } = parseOrThrow(bodySchema, await req.json().catch(() => ({})));
  const ok = await sendTestWebhook(id, profile.id);
  if (!ok) throw new ApiError(404, "Webhook nahi mila");
  return json({ ok: true });
});
