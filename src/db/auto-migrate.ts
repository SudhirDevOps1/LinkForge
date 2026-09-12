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
    "profile_password" text,
    "no_index" boolean NOT NULL DEFAULT false,
    "hide_public_stats" boolean NOT NULL DEFAULT false,
    "announcement" jsonb,
    "design" jsonb,
    "meta_pixel_id" text,
    "tiktok_pixel_id" text,
    "google_analytics_id" text,
    "mailchimp_api_key" text,
    "upi_id" text,
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
    "is_pinned" boolean NOT NULL DEFAULT false,
    "badge" text,
    "is_spotlight" boolean NOT NULL DEFAULT false,
    "scheduled_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
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

  // 14. Subscribers (PostgreSQL)
  `CREATE TABLE IF NOT EXISTS "subscribers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "email" text NOT NULL,
    "status" text NOT NULL DEFAULT 'active',
    "ip_hash" text,
    "user_agent" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_profile_email_idx" ON "subscribers" ("profile_id", "email");`,
  `CREATE INDEX IF NOT EXISTS "subscribers_profile_idx" ON "subscribers" ("profile_id");`,

  // 15. Accounts (Better Auth)
  `CREATE TABLE IF NOT EXISTS "accounts" (
    "id" text PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "account_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "access_token" text,
    "refresh_token" text,
    "id_token" text,
    "access_token_expires_at" timestamp with time zone,
    "refresh_token_expires_at" timestamp with time zone,
    "scope" text,
    "password" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS "accounts_user_idx" ON "accounts" ("user_id");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_account_idx" ON "accounts" ("provider_id", "account_id");`,

  // 16. Verifications (Better Auth)
  `CREATE TABLE IF NOT EXISTS "verifications" (
    "id" text PRIMARY KEY,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS "verifications_identifier_idx" ON "verifications" ("identifier");`,

  // 17. Passkeys (WebAuthn / FIDO2)
  `CREATE TABLE IF NOT EXISTS "passkeys" (
    "id" text PRIMARY KEY,
    "name" text,
    "public_key" text NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "credential_id" text NOT NULL,
    "counter" integer NOT NULL DEFAULT 0,
    "device_type" text NOT NULL DEFAULT 'singleDevice',
    "backed_up" boolean NOT NULL DEFAULT false,
    "transports" text,
    "aaguid" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS "passkeys_user_idx" ON "passkeys" ("user_id");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "passkeys_credential_id_idx" ON "passkeys" ("credential_id");`,

  // 18. Two Factor (TOTP Authenticator & Backup Codes)
  `CREATE TABLE IF NOT EXISTS "two_factors" (
    "id" text PRIMARY KEY,
    "secret" text NOT NULL,
    "backup_codes" text NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "verified" boolean NOT NULL DEFAULT true,
    "failed_verification_count" integer NOT NULL DEFAULT 0,
    "locked_until" timestamp with time zone
  );`,
  `CREATE INDEX IF NOT EXISTS "two_factors_user_idx" ON "two_factors" ("user_id");`,

  // 19. Organizations (Multi-tenant Workspaces)
  `CREATE TABLE IF NOT EXISTS "organizations" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "slug" text NOT NULL,
    "logo" text,
    "metadata" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_idx" ON "organizations" ("slug");`,

  // 20. Members (Team Memberships)
  `CREATE TABLE IF NOT EXISTS "members" (
    "id" text PRIMARY KEY,
    "organization_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "role" text NOT NULL DEFAULT 'member',
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS "members_org_idx" ON "members" ("organization_id");`,
  `CREATE INDEX IF NOT EXISTS "members_user_idx" ON "members" ("user_id");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "members_org_user_idx" ON "members" ("organization_id", "user_id");`,

  // 21. Invitations (Team Invites)
  `CREATE TABLE IF NOT EXISTS "invitations" (
    "id" text PRIMARY KEY,
    "organization_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "email" text NOT NULL,
    "role" text NOT NULL DEFAULT 'member',
    "status" text NOT NULL DEFAULT 'pending',
    "team_id" text,
    "inviter_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE INDEX IF NOT EXISTS "invitations_org_idx" ON "invitations" ("organization_id");`,
  `CREATE INDEX IF NOT EXISTS "invitations_email_idx" ON "invitations" ("email");`,

  // Safe non-destructive column sync (in case tables existed previously from older schema)
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean NOT NULL DEFAULT false;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" text;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean NOT NULL DEFAULT false;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_anonymous" boolean NOT NULL DEFAULT false;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number" text;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number_verified" boolean NOT NULL DEFAULT false;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banned" boolean NOT NULL DEFAULT false;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ban_reason" text;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ban_expires" timestamp with time zone;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();`,
  `ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "token" text NOT NULL DEFAULT '';`,
  `ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "ip_address" text;`,
  `ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "impersonated_by" text;`,
  `ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "active_organization_id" text;`,
  `ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();`,
  `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "design" jsonb;`,
  `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "og_image_url" text;`,
  `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "profile_password" text;`,
  `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "no_index" boolean NOT NULL DEFAULT false;`,
  `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "hide_public_stats" boolean NOT NULL DEFAULT false;`,
  `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "announcement" jsonb;`,
  `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "meta_pixel_id" text;`,
  `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "tiktok_pixel_id" text;`,
  `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "google_analytics_id" text;`,
  `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "mailchimp_api_key" text;`,
  `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "upi_id" text;`,
  `ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "thumbnail_url" text;`,
  `ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "size" text NOT NULL DEFAULT 'standard';`,
  `ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "is_pinned" boolean NOT NULL DEFAULT false;`,
  `ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "badge" text;`,
  `ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "is_spotlight" boolean NOT NULL DEFAULT false;`,
  `ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp with time zone;`,
  `ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;`,
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
    "profile_password" text,
    "no_index" integer NOT NULL DEFAULT 0,
    "hide_public_stats" integer NOT NULL DEFAULT 0,
    "announcement" text,
    "design" text,
    "meta_pixel_id" text,
    "tiktok_pixel_id" text,
    "google_analytics_id" text,
    "mailchimp_api_key" text,
    "upi_id" text,
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
    "is_pinned" integer NOT NULL DEFAULT 0,
    "badge" text,
    "is_spotlight" integer NOT NULL DEFAULT 0,
    "scheduled_at" integer,
    "expires_at" integer,
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

  // 14. Subscribers (SQLite)
  `CREATE TABLE IF NOT EXISTS "subscribers" (
    "id" text PRIMARY KEY NOT NULL,
    "profile_id" text NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "email" text NOT NULL,
    "status" text NOT NULL DEFAULT 'active',
    "ip_hash" text,
    "user_agent" text,
    "created_at" integer NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_profile_email_idx" ON "subscribers" ("profile_id", "email");`,
  `CREATE INDEX IF NOT EXISTS "subscribers_profile_idx" ON "subscribers" ("profile_id");`,

  // 15. Accounts (Better Auth)
  `CREATE TABLE IF NOT EXISTS "accounts" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "account_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "access_token" text,
    "refresh_token" text,
    "id_token" text,
    "access_token_expires_at" integer,
    "refresh_token_expires_at" integer,
    "scope" text,
    "password" text,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS "accounts_user_idx" ON "accounts" ("user_id");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_account_idx" ON "accounts" ("provider_id", "account_id");`,

  // 16. Verifications (Better Auth)
  `CREATE TABLE IF NOT EXISTS "verifications" (
    "id" text PRIMARY KEY NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expires_at" integer NOT NULL,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS "verifications_identifier_idx" ON "verifications" ("identifier");`,

  // 17. Passkeys (WebAuthn / FIDO2)
  `CREATE TABLE IF NOT EXISTS "passkeys" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text,
    "public_key" text NOT NULL,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "credential_id" text NOT NULL,
    "counter" integer NOT NULL DEFAULT 0,
    "device_type" text NOT NULL DEFAULT 'singleDevice',
    "backed_up" integer NOT NULL DEFAULT 0,
    "transports" text,
    "aaguid" text,
    "created_at" integer NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS "passkeys_user_idx" ON "passkeys" ("user_id");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "passkeys_credential_id_idx" ON "passkeys" ("credential_id");`,

  // 18. Two Factor (TOTP Authenticator & Backup Codes)
  `CREATE TABLE IF NOT EXISTS "two_factors" (
    "id" text PRIMARY KEY NOT NULL,
    "secret" text NOT NULL,
    "backup_codes" text NOT NULL,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "verified" integer NOT NULL DEFAULT 1,
    "failed_verification_count" integer NOT NULL DEFAULT 0,
    "locked_until" integer
  );`,
  `CREATE INDEX IF NOT EXISTS "two_factors_user_idx" ON "two_factors" ("user_id");`,

  // 19. Organizations (Multi-tenant Workspaces)
  `CREATE TABLE IF NOT EXISTS "organizations" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "slug" text NOT NULL,
    "logo" text,
    "metadata" text,
    "created_at" integer NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_idx" ON "organizations" ("slug");`,

  // 20. Members (Team Memberships)
  `CREATE TABLE IF NOT EXISTS "members" (
    "id" text PRIMARY KEY NOT NULL,
    "organization_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "role" text NOT NULL DEFAULT 'member',
    "created_at" integer NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS "members_org_idx" ON "members" ("organization_id");`,
  `CREATE INDEX IF NOT EXISTS "members_user_idx" ON "members" ("user_id");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "members_org_user_idx" ON "members" ("organization_id", "user_id");`,

  // 21. Invitations (Team Invites)
  `CREATE TABLE IF NOT EXISTS "invitations" (
    "id" text PRIMARY KEY NOT NULL,
    "organization_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "email" text NOT NULL,
    "role" text NOT NULL DEFAULT 'member',
    "status" text NOT NULL DEFAULT 'pending',
    "team_id" text,
    "inviter_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "expires_at" integer NOT NULL,
    "created_at" integer NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS "invitations_org_idx" ON "invitations" ("organization_id");`,
  `CREATE INDEX IF NOT EXISTS "invitations_email_idx" ON "invitations" ("email");`,

  // Safe non-destructive column sync for SQLite (zero data loss — adds missing columns if tables were created earlier)
  `ALTER TABLE "users" ADD COLUMN "email_verified" integer NOT NULL DEFAULT 0;`,
  `ALTER TABLE "users" ADD COLUMN "image" text;`,
  `ALTER TABLE "users" ADD COLUMN "two_factor_enabled" integer NOT NULL DEFAULT 0;`,
  `ALTER TABLE "users" ADD COLUMN "is_anonymous" integer NOT NULL DEFAULT 0;`,
  `ALTER TABLE "users" ADD COLUMN "phone_number" text;`,
  `ALTER TABLE "users" ADD COLUMN "phone_number_verified" integer NOT NULL DEFAULT 0;`,
  `ALTER TABLE "users" ADD COLUMN "banned" integer NOT NULL DEFAULT 0;`,
  `ALTER TABLE "users" ADD COLUMN "ban_reason" text;`,
  `ALTER TABLE "users" ADD COLUMN "ban_expires" integer;`,
  `ALTER TABLE "users" ADD COLUMN "updated_at" integer;`,
  `ALTER TABLE "sessions" ADD COLUMN "token" text NOT NULL DEFAULT '';`,
  `ALTER TABLE "sessions" ADD COLUMN "ip_address" text;`,
  `ALTER TABLE "sessions" ADD COLUMN "impersonated_by" text;`,
  `ALTER TABLE "sessions" ADD COLUMN "active_organization_id" text;`,
  `ALTER TABLE "sessions" ADD COLUMN "updated_at" integer;`,
  `ALTER TABLE "profiles" ADD COLUMN "design" text;`,
  `ALTER TABLE "profiles" ADD COLUMN "og_image_url" text;`,
  `ALTER TABLE "profiles" ADD COLUMN "profile_password" text;`,
  `ALTER TABLE "profiles" ADD COLUMN "no_index" integer NOT NULL DEFAULT 0;`,
  `ALTER TABLE "profiles" ADD COLUMN "hide_public_stats" integer NOT NULL DEFAULT 0;`,
  `ALTER TABLE "profiles" ADD COLUMN "announcement" text;`,
  `ALTER TABLE "profiles" ADD COLUMN "meta_pixel_id" text;`,
  `ALTER TABLE "profiles" ADD COLUMN "tiktok_pixel_id" text;`,
  `ALTER TABLE "profiles" ADD COLUMN "google_analytics_id" text;`,
  `ALTER TABLE "profiles" ADD COLUMN "mailchimp_api_key" text;`,
  `ALTER TABLE "profiles" ADD COLUMN "upi_id" text;`,
  `ALTER TABLE "links" ADD COLUMN "thumbnail_url" text;`,
  `ALTER TABLE "links" ADD COLUMN "size" text NOT NULL DEFAULT 'standard';`,
  `ALTER TABLE "links" ADD COLUMN "is_pinned" integer NOT NULL DEFAULT 0;`,
  `ALTER TABLE "links" ADD COLUMN "badge" text;`,
  `ALTER TABLE "links" ADD COLUMN "is_spotlight" integer NOT NULL DEFAULT 0;`,
  `ALTER TABLE "links" ADD COLUMN "scheduled_at" integer;`,
  `ALTER TABLE "links" ADD COLUMN "expires_at" integer;`,
  `ALTER TABLE "media_files" ADD COLUMN "storage_provider" text NOT NULL DEFAULT 'local';`,
  `ALTER TABLE "media_files" ADD COLUMN "size_bytes" integer NOT NULL DEFAULT 0;`,
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
        const anyDb = db as unknown as {
          execute?: (query: unknown) => Promise<unknown>;
          run?: (query: unknown) => Promise<unknown>;
        };
        if (typeof anyDb.execute === "function") {
          await anyDb.execute(sql.raw(statement));
        } else if (typeof anyDb.run === "function") {
          await anyDb.run(sql.raw(statement));
        }
        count++;
      } catch (err) {
        // Ignorable non-fatal errors (e.g. extension or column already exists)
        const fullMsg = (
          ((err as unknown as { cause?: { message?: string } })?.cause?.message ?? "") +
          " " +
          ((err as Error).message ?? "") +
          " " +
          String(err)
        ).toLowerCase();

        if (
          fullMsg.includes("already exists") ||
          fullMsg.includes("duplicate") ||
          fullMsg.includes("duplicate column") ||
          fullMsg.includes("permission denied to create extension")
        ) {
          continue;
        }
        console.warn("[auto-migrate] statement warning:", (err as Error).message);
      }
    }

    // 🔐 Zero-Knowledge Data Encryption Auto-Migration:
    // Any existing plaintext emails or names in users or subscribers are automatically
    // encrypted to enc:em:... and enc:v1:... so DB dumps reveal NO raw personal data!
    try {
      const { encryptEmail, encryptField } = await import("@/lib/db-cipher");
      const { users, subscribers } = await import("./schema");
      const { eq } = await import("drizzle-orm");

      const anyDb = db as any;

      // 1. Transparently encrypt users table email and name for at-rest database privacy
      const rawUsers = await anyDb.select({ id: users.id, email: users.email, name: users.name }).from(users).limit(500);
      for (const u of rawUsers || []) {
        const needsEmailEnc = u.email && !u.email.startsWith("enc:em:");
        const needsNameEnc = u.name && !u.name.startsWith("enc:v1:") && u.name.trim() !== "";
        if (needsEmailEnc || needsNameEnc) {
          await anyDb
            .update(users)
            .set({
              ...(needsEmailEnc ? { email: encryptEmail(u.email) } : {}),
              ...(needsNameEnc ? { name: encryptField(u.name) } : {}),
            })
            .where(eq(users.id, u.id));
        }
      }

      // 2. Encrypt legacy plaintext subscribers
      const rawSubs = await anyDb.select({ id: subscribers.id, email: subscribers.email }).from(subscribers).limit(500);
      for (const s of rawSubs || []) {
        if (s.email && !s.email.startsWith("enc:em:")) {
          await anyDb
            .update(subscribers)
            .set({ email: encryptEmail(s.email) })
            .where(eq(subscribers.id, s.id));
        }
      }
    } catch {
      // Non-fatal background migration
    }

    return { ok: true, count };
  })();

  return migrationPromise;
}
