// =============================================================================
// 🔌 API Key Authentication — public REST API v1 ke liye
// Authorization: Bearer lfk_... header verify karta hai (SHA-256 hash match).
// =============================================================================
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, profiles, users, type ApiKey, type Profile, type User } from "@/db/schema";
import { sha256Hex } from "@/lib/crypto";

export interface ApiKeyContext {
  user: User;
  profile: Profile;
  apiKey: ApiKey;
}

export async function authenticateApiKey(req: Request): Promise<ApiKeyContext | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(lfk_[a-f0-9]{48})$/i.exec(header.trim());
  if (!match) return null;
  const keyHash = sha256Hex(match[1]);
  const [key] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);
  if (!key || key.revokedAt) return null;
  const [user] = await db.select().from(users).where(eq(users.id, key.userId)).limit(1);
  if (!user) return null;
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);
  if (!profile) return null;

  // lastUsedAt touch (non-blocking best effort)
  void db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, key.id))
    .then(() => undefined)
    .catch(() => undefined);

  return { user, profile, apiKey: key };
}

/** CORS headers for the public v1 API (API_CORS_ORIGINS=domain1,domain2) */
export function v1CorsHeaders(extra?: Record<string, string>) {
  const origins = process.env.API_CORS_ORIGINS?.trim() || "*";
  return {
    "Access-Control-Allow-Origin": origins,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    ...extra,
  };
}

export function v1Options() {
  return new Response(null, { status: 204, headers: v1CorsHeaders() });
}
