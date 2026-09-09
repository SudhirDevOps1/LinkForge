// =============================================================================
// 🪝 Webhooks — click/view events par outbound signed HTTP callbacks
// Har request `X-LinkForge-Signature: <hmac-sha256-hex>` header ke saath jati
// hai — receiver apne secret se verify kar sakta hai.
// =============================================================================
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { webhooks } from "@/db/schema";
import { hmacSha256Hex } from "@/lib/crypto";
import { safeFetch } from "@/lib/outbound";

export interface WebhookPayload {
  event: "click" | "view" | "test";
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Single delivery attempt — SSRF-safe (https-only, no-redirect, DNS-pinned).
 * Returns true on 2xx, false otherwise (koi throw nahi — caller retries).
 */
async function attempt(url: string, secret: string, payload: WebhookPayload): Promise<boolean> {
  const body = JSON.stringify(payload);
  try {
    const res = await safeFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "LinkForge-Webhooks/1.0",
        "X-LinkForge-Event": payload.event,
        "X-LinkForge-Signature": hmacSha256Hex(secret, body),
      },
      body,
      timeoutMs: 5_000,
    });
    // Response body drain karo taaki socket reuse ho sake
    await res.arrayBuffer().catch(() => undefined);
    return res.ok;
  } catch (err) {
    console.warn(`[webhooks] attempt failed → ${url}:`, (err as Error).message);
    return false;
  }
}

const RETRY_DELAYS_MS = [500, 2_000]; // 1 initial + 2 retries = 3 attempts

async function deliver(url: string, secret: string, payload: WebhookPayload) {
  for (let i = 0; i <= RETRY_DELAYS_MS.length; i++) {
    if (await attempt(url, secret, payload)) return;
    if (i < RETRY_DELAYS_MS.length) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[i]));
    }
  }
  console.warn(`[webhooks] delivery failed after 3 attempts → ${url}`);
}

/** Profile ke saare active webhooks ko event bhejo (non-blocking). */
export async function triggerWebhooks(
  profileId: string,
  event: "click" | "view" | "test",
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const hooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.profileId, profileId));
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };
    const targets = hooks.filter(
      (h) => h.isActive && h.events.split(",").map((e) => e.trim()).includes(event),
    );
    await Promise.allSettled(targets.map((h) => deliver(h.url, h.secret, payload)));
  } catch (err) {
    console.warn("[webhooks] trigger error:", (err as Error).message);
  }
}

/** Settings UI ka "Send test" button isko call karta hai */
export async function sendTestWebhook(webhookId: string, profileId: string) {
  const rows = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.id, webhookId));
  const hook = rows.find((h) => h.profileId === profileId);
  if (!hook) return false;
  await deliver(hook.url, hook.secret, {
    event: "test",
    timestamp: new Date().toISOString(),
    data: { message: "LinkForge webhook test ✅".replace(" ✅", ""), webhookId },
  });
  return true;
}
