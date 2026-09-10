// =============================================================================
// 🚀 Auto-Migration / Schema Bootstrapper (Zero-Config Database Provisioning)
// -----------------------------------------------------------------------------
// Vercel / Cloud serverless environments par pehli request aate hi ya
// health-check / app boot par Neon, Supabase, Postgres ya SQLite tables
// automatically create ho jate hain (`CREATE TABLE IF NOT EXISTS ...`).
// No manual CLI commands required!
// =============================================================================
import { sql } from "drizzle-orm";
import { isSqliteProvider } from "@/config/db.config";
import { getDb } from "./index";

const PG_MIGRATIONS = [
  // Enable pgcrypto for gen_random_uuid() fallback on older Postgres
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,

  // 1. Users
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" text NOT NULL,
    "name" text NOT NULL DEFAULT '',
    "password_hash" text,
    "avatar_url" text,
    "role" text NOT NULL DEFAULT 'user',
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");`,

  // 2. Sessions
  `CREATE TABLE IF NOT EXISTS "sessions" (
    "id" text PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "user_agent" text,
    "ip_hash" text,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" ("user_id");`,

  // 3. Password Reset Tokens
  `CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token_hash" text NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "reset_token_hash_idx" ON "password_reset_tokens" ("token_hash");`,

  // 4. Profiles
  `CREATE TABLE IF NOT EXISTS "profiles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "slug" text NOT NULL,
    "display_name" text NOT NULL,
    "bio" text NOT NULL DEFAULT '',
    "avatar_url" text,
    "theme" text NOT NULL DEFAULT 'midnight',
    "layout" text NOT NULL DEFAULT 'list',
    "custom_domain" text,
    "seo_title" text,
    "seo_description" text,
    "og_image_url" text,
    "analytics_enabled" boolean NOT NULL DEFAULT true,
    "is_published" boolean NOT NULL DEFAULT true,
    "design" jsonb,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "profiles_slug_idx" ON "profiles" ("slug");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "profiles_user_idx" ON "profiles" ("user_id");`,
  `CREATE INDEX IF NOT EXISTS "profiles_domain_idx" ON "profiles" ("custom_domain");`,

  // 5. Links
  `CREATE TABLE IF NOT EXISTS "links" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "url" text NOT NULL,
    "description" text NOT NULL DEFAULT '',
    "icon" text NOT NULL DEFAULT 'link',
    "type" text NOT NULL DEFAULT 'link',
    "size" text NOT NULL DEFAULT 'standard',
    "position" integer NOT NULL DEFAULT 0,
    "is_active" boolean NOT NULL DEFAULT true,
    "thumbnail_url" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS "links_profile_pos_idx" ON "links" ("profile_id", "position");`,

  // 6. Events
  `CREATE TABLE IF NOT EXISTS "events" (
    "id" bigserial PRIMARY KEY,
    "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "link_id" uuid REFERENCES "links"("id") ON DELETE CASCADE,
    "type" text NOT NULL,
    "referrer" text NOT NULL DEFAULT '',
    "country" text NOT NULL DEFAULT '',
    "device" text NOT NULL DEFAULT '',
    "browser" text NOT NULL DEFAULT '',
    "os" text NOT NULL DEFAULT '',
    "ip_hash" text NOT NULL DEFAULT '',
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS "events_profile_time_idx" ON "events" ("profile_id", "created_at");`,
  `CREATE INDEX IF NOT EXISTS "events_link_idx" ON "events" ("link_id");`,
  `CREATE INDEX IF NOT EXISTS "events_type_idx" ON "events" ("type");`,

  // 7. Webhooks
  `CREATE TABLE IF NOT EXISTS "webhooks" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "url" text NOT NULL,
    "secret" text NOT NULL,
    "events" text NOT NULL DEFAULT 'click',
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS "webhooks_profile_idx" ON "webhooks" ("profile_id");`,

  // 8. API Keys
  `CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "prefix" text NOT NULL,
    "key_hash" text NOT NULL,
    "last_used_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_hash_idx" ON "api_keys" ("key_hash");`,
  `CREATE INDEX IF NOT EXISTS "api_keys_user_idx" ON "api_keys" ("user_id");`,

  // 9. Team Members
  `CREATE TABLE IF NOT EXISTS "team_members" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "email" text NOT NULL,
    "role" text NOT NULL DEFAULT 'editor',
    "invited_at" timestamp with time zone NOT NULL DEFAULT now(),
    "accepted_at" timestamp with time zone
  );`,
  `CREATE INDEX IF NOT EXISTS "team_profile_idx" ON "team_members" ("profile_id");`,

  // 10. Mail Outbox
  `CREATE TABLE IF NOT EXISTS "mail_outbox" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "to_email" text NOT NULL,
    "subject" text NOT NULL,
    "body" text NOT NULL,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,

  // 11. Media Files
  `CREATE TABLE IF NOT EXISTS "media_files" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "file_name" text NOT NULL,
    "mime_type" text NOT NULL,
    "size_bytes" integer NOT NULL DEFAULT 0,
    "storage_provider" text NOT NULL DEFAULT 'local',
    "storage_key" text NOT NULL,
    "url" text NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS "media_profile_idx" ON "media_files" ("profile_id");`,

  // 12. Upload Tickets
  `CREATE TABLE IF NOT EXISTS "upload_tickets" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "provider" text NOT NULL,
    "storage_key" text NOT NULL,
    "expected_mime" text NOT NULL,
    "expected_size" integer NOT NULL,
    "file_name" text NOT NULL DEFAULT 'file',
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS "tickets_profile_idx" ON "upload_tickets" ("profile_id");`,

  // 13. Analytics Rollups (Compact daily summaries: 98%+ DB storage reduction)
  `CREATE TABLE IF NOT EXISTS "analytics_rollups" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "link_id" uuid REFERENCES "links"("id") ON DELETE CASCADE,
    "date" text NOT NULL,
    "device" text NOT NULL DEFAULT 'Desktop',
    "country" text NOT NULL DEFAULT 'Unknown',
    "views" integer NOT NULL DEFAULT 0,
    "clicks" integer NOT NULL DEFAULT 0,
    "unique_visitors" integer NOT NULL DEFAULT 0,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "rollups_unique_bucket_idx" ON "analytics_rollups" ("profile_id", "date", "link_id", "device", "country");`,
  `CREATE INDEX IF NOT EXISTS "rollups_profile_date_idx" ON "analytics_rollups" ("profile_id", "date");`,

  // Safe non-destructive column sync (in case tables existed previously from older schema)
  `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "design" jsonb;`,
  `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "og_image_url" text;`,
  `ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "thumbnail_url" text;`,
  `ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "size" text NOT NULL DEFAULT 'standard';`,
  `ALTER TABLE "media_files" ADD COLUMN IF NOT EXISTS "storage_provider" text NOT NULL DEFAULT 'local';`,
  `ALTER TABLE "media_files" ADD COLUMN IF NOT EXISTS "size_bytes" integer NOT NULL DEFAULT 0;`,
];

const SQLITE_MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" text PRIMARY KEY NOT NULL,
    "email" text NOT NULL,
    "name" text NOT NULL DEFAULT '',
    "password_hash" text,
    "avatar_url" text,
    "role" text NOT NULL DEFAULT 'user',
    "created_at" integer NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");`,

  `CREATE TABLE IF NOT EXISTS "sessions" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "user_agent" text,
    "ip_hash" text,
    "expires_at" integer NOT NULL,
    "created_at" integer NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" ("user_id");`,

  `CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token_hash" text NOT NULL,
    "expires_at" integer NOT NULL,
    "used_at" integer,
    "created_at" integer NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "reset_token_hash_idx" ON "password_reset_tokens" ("token_hash");`,

  `CREATE TABLE IF NOT EXISTS "profiles" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "slug" text NOT NULL,
    "display_name" text NOT NULL,
    "bio" text NOT NULL DEFAULT '',
    "avatar_url" text,
    "theme" text NOT NULL DEFAULT 'midnight',
    "layout" text NOT NULL DEFAULT 'list',
    "custom_domain" text,
    "seo_title" text,
    "seo_description" text,
    "og_image_url" text,
    "analytics_enabled" integer NOT NULL DEFAULT 1,
    "is_published" integer NOT NULL DEFAULT 1,
    "design" text,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "profiles_slug_idx" ON "profiles" ("slug");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "profiles_user_idx" ON "profiles" ("user_id");`,
  `CREATE INDEX IF NOT EXISTS "profiles_domain_idx" ON "profiles" ("custom_domain");`,

  `CREATE TABLE IF NOT EXISTS "links" (
    "id" text PRIMARY KEY NOT NULL,
    "profile_id" text NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "url" text NOT NULL,
    "description" text NOT NULL DEFAULT '',
    "icon" text NOT NULL DEFAULT 'link',
    "type" text NOT NULL DEFAULT 'link',
    "size" text NOT NULL DEFAULT 'standard',
    "position" integer NOT NULL DEFAULT 0,
    "is_active" integer NOT NULL DEFAULT 1,
    "thumbnail_url" text,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS "links_profile_pos_idx" ON "links" ("profile_id", "position");`,

  `CREATE TABLE IF NOT EXISTS "events" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "profile_id" text NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "link_id" text REFERENCES "links"("id") ON DELETE CASCADE,
    "type" text NOT NULL,
    "referrer" text NOT NULL DEFAULT '',
    "country" text NOT NULL DEFAULT '',
    "device" text NOT NULL DEFAULT '',
    "browser" text NOT NULL DEFAULT '',
    "os" text NOT NULL DEFAULT '',
    "ip_hash" text NOT NULL DEFAULT '',
    "created_at" integer NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS "events_profile_time_idx" ON "events" ("profile_id", "created_at");`,
  `CREATE INDEX IF NOT EXISTS "events_link_idx" ON "events" ("link_id");`,
  `CREATE INDEX IF NOT EXISTS "events_type_idx" ON "events" ("type");`,

  `CREATE TABLE IF NOT EXISTS "webhooks" (
    "id" text PRIMARY KEY NOT NULL,
    "profile_id" text NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "url" text NOT NULL,
    "secret" text NOT NULL,
    "events" text NOT NULL DEFAULT 'click',
    "is_active" integer NOT NULL DEFAULT 1,
    "created_at" integer NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS "webhooks_profile_idx" ON "webhooks" ("profile_id");`,

  `CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "prefix" text NOT NULL,
    "key_hash" text NOT NULL,
    "last_used_at" integer,
    "revoked_at" integer,
    "created_at" integer NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_hash_idx" ON "api_keys" ("key_hash");`,
  `CREATE INDEX IF NOT EXISTS "api_keys_user_idx" ON "api_keys" ("user_id");`,

  `CREATE TABLE IF NOT EXISTS "team_members" (
    "id" text PRIMARY KEY NOT NULL,
    "profile_id" text NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "email" text NOT NULL,
    "role" text NOT NULL DEFAULT 'editor',
    "invited_at" integer NOT NULL,
    "accepted_at" integer
  );`,
  `CREATE INDEX IF NOT EXISTS "team_profile_idx" ON "team_members" ("profile_id");`,

  `CREATE TABLE IF NOT EXISTS "mail_outbox" (
    "id" text PRIMARY KEY NOT NULL,
    "to_email" text NOT NULL,
    "subject" text NOT NULL,
    "body" text NOT NULL,
    "sent_at" integer,
    "created_at" integer NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "media_files" (
    "id" text PRIMARY KEY NOT NULL,
    "profile_id" text NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "file_name" text NOT NULL,
    "mime_type" text NOT NULL,
    "size_bytes" integer NOT NULL DEFAULT 0,
    "storage_provider" text NOT NULL DEFAULT 'local',
    "storage_key" text NOT NULL,
    "url" text NOT NULL,
    "created_at" integer NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS "media_profile_idx" ON "media_files" ("profile_id");`,

  `CREATE TABLE IF NOT EXISTS "upload_tickets" (
    "id" text PRIMARY KEY NOT NULL,
    "profile_id" text NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "provider" text NOT NULL,
    "storage_key" text NOT NULL,
    "expected_mime" text NOT NULL,
    "expected_size" integer NOT NULL,
    "file_name" text NOT NULL DEFAULT 'file',
    "expires_at" integer NOT NULL,
    "used_at" integer,
    "created_at" integer NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS "tickets_profile_idx" ON "upload_tickets" ("profile_id");`,

  // 13. Analytics Rollups (SQLite)
  `CREATE TABLE IF NOT EXISTS "analytics_rollups" (
    "id" text PRIMARY KEY NOT NULL,
    "profile_id" text NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "link_id" text REFERENCES "links"("id") ON DELETE CASCADE,
    "date" text NOT NULL,
    "device" text NOT NULL DEFAULT 'Desktop',
    "country" text NOT NULL DEFAULT 'Unknown',
    "views" integer NOT NULL DEFAULT 0,
    "clicks" integer NOT NULL DEFAULT 0,
    "unique_visitors" integer NOT NULL DEFAULT 0,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "rollups_unique_bucket_idx" ON "analytics_rollups" ("profile_id", "date", "link_id", "device", "country");`,
  `CREATE INDEX IF NOT EXISTS "rollups_profile_date_idx" ON "analytics_rollups" ("profile_id", "date");`,
];

// Runtime caching: Ek serverless cold start mein sirf ek baar execute ho
let migrationPromise: Promise<{ ok: boolean; count: number }> | null = null;

export async function autoMigrate(force = false): Promise<{ ok: boolean; count: number }> {
  if (migrationPromise && !force) {
    return migrationPromise;
  }

  migrationPromise = (async () => {
    const db = getDb();
    const stmts = isSqliteProvider ? SQLITE_MIGRATIONS : PG_MIGRATIONS;
    let count = 0;

    for (const statement of stmts) {
      try {
        await db.execute(sql.raw(statement));
        count++;
      } catch (err) {
        // Ignorable non-fatal errors (e.g. extension already exists or permission limits)
        const msg = (err as Error).message.toLowerCase();
        if (
          msg.includes("already exists") ||
          msg.includes("duplicate") ||
          msg.includes("permission denied to create extension")
        ) {
          continue;
        }
        console.warn("[auto-migrate] statement warning:", (err as Error).message);
      }
    }

    return { ok: true, count };
  })();

  return migrationPromise;
}
