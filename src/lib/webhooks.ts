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
  event: "click" | "view" | "test" | "inquiry";
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Format payload according to target platform (Discord, Slack, Google Apps Script, Stoat/Custom)
 */
/**
 * Auto-normalizes URLs for known platforms (e.g. Stoat / Revolt web frontend -> backend API)
 */
export function normalizeWebhookUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  // Stoat / Revolt: Web frontend is hosted at stoat.chat/webhooks/..., but backend API is at api.stoat.chat/webhooks/...
  if (url.startsWith("https://stoat.chat/webhooks/") || url.startsWith("http://stoat.chat/webhooks/")) {
    url = url.replace(/https?:\/\/stoat\.chat\/webhooks\//, "https://api.stoat.chat/webhooks/");
  } else if (url.startsWith("https://revolt.chat/webhooks/") || url.startsWith("http://revolt.chat/webhooks/")) {
    url = url.replace(/https?:\/\/revolt\.chat\/webhooks\//, "https://api.revolt.chat/webhooks/");
  }
  return url;
}

/**
 * Platform ke mutabiq payload format karo:
 * - Discord: Rich embed JSON
 * - Slack: Block text JSON
 * - Google Apps Script: Flat JSON (taaki Google Sheets direct appendRow kar sake)
 * - Stoat / Revolt: Channel markdown message content
 * - Generic: Full JSON payload + HMAC header
 */
function formatPayloadForUrl(
  rawUrl: string,
  payload: WebhookPayload
): { targetUrl: string; body: string; headers: Record<string, string>; followSafeRedirects?: boolean } {
  const targetUrl = normalizeWebhookUrl(rawUrl);
  const isDiscord = targetUrl.includes("discord.com/api/webhooks") || targetUrl.includes("discordapp.com/api/webhooks");
  const isSlack = targetUrl.includes("hooks.slack.com");
  const isGoogleAppsScript = targetUrl.includes("script.google.com");
  const isStoat = targetUrl.includes("stoat.chat") || targetUrl.includes("revolt.chat");

  if (isDiscord) {
    const discordBody = JSON.stringify({
      username: "LinkForge Alerts",
      avatar_url: "https://linkforge.dev/icon.svg",
      embeds: [
        {
          title: `🔔 Event: ${payload.event.toUpperCase()}`,
          description:
            payload.event === "click"
              ? `A visitor clicked a link on your profile.`
              : payload.event === "view"
                ? `New visitor view recorded on your LinkForge profile!`
                : payload.event === "inquiry"
                  ? `New brand sponsorship proposal received via your Media Kit!`
                  : `LinkForge Webhook Test Dispatched Successfully!`,
          color: 9133302, // #8b5cf6 (LinkForge Violet)
          timestamp: payload.timestamp,
          fields: Object.entries(payload.data).slice(0, 8).map(([key, val]) => ({
            name: key.replace(/([A-Z])/g, " $1").toUpperCase(),
            value: String(val || "N/A"),
            inline: true,
          })),
          footer: { text: "LinkForge Webhooks" },
        },
      ],
    });
    return {
      targetUrl,
      body: discordBody,
      headers: { "Content-Type": "application/json" },
    };
  }

  if (isSlack) {
    const slackBody = JSON.stringify({
      text: `🔔 *LinkForge Event: ${payload.event.toUpperCase()}*\n${Object.entries(payload.data)
        .map(([k, v]) => `• *${k}*: ${v}`)
        .join("\n")}`,
    });
    return {
      targetUrl,
      body: slackBody,
      headers: { "Content-Type": "application/json" },
    };
  }

  if (isGoogleAppsScript) {
    // Google Apps Script expects flat JSON for easy Sheets logging + follows 302 redirect
    const gasBody = JSON.stringify({
      event: payload.event,
      timestamp: payload.timestamp,
      ...payload.data,
    });
    return {
      targetUrl,
      body: gasBody,
      headers: { "Content-Type": "application/json" },
      followSafeRedirects: true,
    };
  }

  if (isStoat) {
    // Stoat / Revolt expects a channel message payload with "content"
    const lines = [
      `🔔 **LinkForge Event: ${payload.event.toUpperCase()}**`,
      ...Object.entries(payload.data).map(([k, v]) => `• **${k}**: ${v}`),
      `🕒 *${payload.timestamp}*`
    ];
    const stoatBody = JSON.stringify({
      content: lines.join("\n"),
    });
    return {
      targetUrl,
      body: stoatBody,
      headers: { "Content-Type": "application/json" },
    };
  }

  // Default LinkForge signed payload (Custom endpoints)
  const defaultBody = JSON.stringify(payload);
  return {
    targetUrl,
    body: defaultBody,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "LinkForge-Webhooks/1.0",
      "X-LinkForge-Event": payload.event,
    },
  };
}

/**
 * Single delivery attempt — SSRF-safe (https-only, DNS-pinned, platform-aware).
 * Returns true on 2xx, false otherwise.
 */
async function attempt(url: string, secret: string, payload: WebhookPayload): Promise<boolean> {
  const { targetUrl, body, headers, followSafeRedirects } = formatPayloadForUrl(url, payload);
  const finalHeaders: Record<string, string> = {
    ...headers,
    "X-LinkForge-Signature": hmacSha256Hex(secret, body),
  };

  try {
    const res = await safeFetch(targetUrl, {
      method: "POST",
      headers: finalHeaders,
      body,
      timeoutMs: 6_000,
      followSafeRedirects,
    });
    // Response body drain karo taaki socket reuse ho sake
    await res.arrayBuffer().catch(() => undefined);
    return res.ok;
  } catch (err) {
    console.warn(`[webhooks] attempt failed → ${targetUrl}:`, (err as Error).message);
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
  event: "click" | "view" | "test" | "inquiry",
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

export interface WebhookTestResult {
  found: boolean;
  success: boolean;
  statusCode?: number;
  statusText?: string;
  latencyMs: number;
  error?: string;
}

/** Settings UI ka "Send test" button isko call karta hai aur live HTTP response return karta hai */
export async function sendTestWebhook(webhookId: string, profileId: string): Promise<WebhookTestResult> {
  const rows = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.id, webhookId));
  const hook = rows.find((h) => h.profileId === profileId);
  if (!hook) {
    return { found: false, success: false, latencyMs: 0, error: "Webhook not found" };
  }

  const start = Date.now();
  const payload: WebhookPayload = {
    event: "test",
    timestamp: new Date().toISOString(),
    data: { message: "LinkForge webhook test event", webhookId },
  };

  const { targetUrl, body, headers, followSafeRedirects } = formatPayloadForUrl(hook.url, payload);
  const finalHeaders: Record<string, string> = {
    ...headers,
    "X-LinkForge-Signature": hmacSha256Hex(hook.secret, body),
  };

  try {
    const res = await safeFetch(targetUrl, {
      method: "POST",
      headers: finalHeaders,
      body,
      timeoutMs: 6_000,
      followSafeRedirects,
    });
    await res.arrayBuffer().catch(() => undefined);
    const latencyMs = Date.now() - start;
    return {
      found: true,
      success: res.ok,
      statusCode: res.status,
      statusText: res.statusText,
      latencyMs,
      error: res.ok ? undefined : `Receiver returned HTTP ${res.status} ${res.statusText || ""}`.trim(),
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    return {
      found: true,
      success: false,
      latencyMs,
      error: (err as Error).message || "Connection failed",
    };
  }
}
