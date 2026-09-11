-- =============================================================================
-- 🔄 LinkForge — Neon Database Fresh Reset & Bootstrap Script (neon-reset.sql)
-- =============================================================================
-- KAISE RUN KAREIN (HOW TO USE IN NEON CONSOLE):
-- 1. Open Neon Console: https://console.neon.tech/
-- 2. Apna project select karein (e.g. linkforge-prod).
-- 3. Left sidebar me "SQL Editor" par click karein.
-- 4. Yeh poori script copy karke editor me paste karein.
-- 5. "Run" (green button) par click karein.
-- Result: Database clean ho jayega aur saare 14 tables + indexes ready ho jayenge!
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: PURANE TABLES KO SAFELY DROP KAREIN (CASCADE CLEANUP)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS "subscribers" CASCADE;
DROP TABLE IF EXISTS "analytics_rollups" CASCADE;
DROP TABLE IF EXISTS "upload_tickets" CASCADE;
DROP TABLE IF EXISTS "media_files" CASCADE;
DROP TABLE IF EXISTS "mail_outbox" CASCADE;
DROP TABLE IF EXISTS "team_members" CASCADE;
DROP TABLE IF EXISTS "api_keys" CASCADE;
DROP TABLE IF EXISTS "webhooks" CASCADE;
DROP TABLE IF EXISTS "events" CASCADE;
DROP TABLE IF EXISTS "links" CASCADE;
DROP TABLE IF EXISTS "profiles" CASCADE;
DROP TABLE IF EXISTS "password_reset_tokens" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- -----------------------------------------------------------------------------
-- STEP 2: PGCRYPTO EXTENSION (UUID GENERATION)
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- STEP 3: SARE 14 TABLES + INDEXES CREATE KAREIN
-- -----------------------------------------------------------------------------

-- 1. Users
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL,
  "name" text NOT NULL DEFAULT '',
  "password_hash" text,
  "avatar_url" text,
  "role" text NOT NULL DEFAULT 'user',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");

-- 2. Sessions (Lucia-style token store)
CREATE TABLE "sessions" (
  "id" text PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "user_agent" text,
  "ip_hash" text,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "sessions_user_idx" ON "sessions" ("user_id");

-- 3. Password Reset Tokens
CREATE TABLE "password_reset_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "reset_token_hash_idx" ON "password_reset_tokens" ("token_hash");

-- 4. Profiles (Public Bio Pages)
CREATE TABLE "profiles" (
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
);
CREATE UNIQUE INDEX "profiles_slug_idx" ON "profiles" ("slug");
CREATE UNIQUE INDEX "profiles_user_idx" ON "profiles" ("user_id");
CREATE INDEX "profiles_domain_idx" ON "profiles" ("custom_domain");

-- 5. Links (Bio Cards & Embeds)
CREATE TABLE "links" (
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
);
CREATE INDEX "links_profile_pos_idx" ON "links" ("profile_id", "position");

-- 6. Events (Privacy-preserving Views & Clicks)
CREATE TABLE "events" (
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
);
CREATE INDEX "events_profile_time_idx" ON "events" ("profile_id", "created_at");
CREATE INDEX "events_link_idx" ON "events" ("link_id");
CREATE INDEX "events_type_idx" ON "events" ("type");

-- 7. Webhooks
CREATE TABLE "webhooks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "url" text NOT NULL,
  "secret" text NOT NULL,
  "events" text NOT NULL DEFAULT 'click',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "webhooks_profile_idx" ON "webhooks" ("profile_id");

-- 8. API Keys (Developer REST Access)
CREATE TABLE "api_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "prefix" text NOT NULL,
  "key_hash" text NOT NULL,
  "last_used_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "api_keys_hash_idx" ON "api_keys" ("key_hash");
CREATE INDEX "api_keys_user_idx" ON "api_keys" ("user_id");

-- 9. Team Members (Collaboration)
CREATE TABLE "team_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "role" text NOT NULL DEFAULT 'editor',
  "invited_at" timestamp with time zone NOT NULL DEFAULT now(),
  "accepted_at" timestamp with time zone
);
CREATE INDEX "team_profile_idx" ON "team_members" ("profile_id");

-- 10. Mail Outbox (Self-hosted Dev Mailer)
CREATE TABLE "mail_outbox" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "to_email" text NOT NULL,
  "subject" text NOT NULL,
  "body" text NOT NULL,
  "sent_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- 11. Media Files (Documents, PDF, Images, Video)
CREATE TABLE "media_files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "file_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" integer NOT NULL DEFAULT 0,
  "storage_provider" text NOT NULL DEFAULT 'local',
  "storage_key" text NOT NULL,
  "url" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "media_profile_idx" ON "media_files" ("profile_id");

-- 12. Upload Tickets (Presigned S3/B2 Uploads)
CREATE TABLE "upload_tickets" (
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
);
CREATE INDEX "tickets_profile_idx" ON "upload_tickets" ("profile_id");

-- 13. Analytics Rollups (Compact Daily Summaries: 98%+ Storage Savings)
CREATE TABLE "analytics_rollups" (
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
);
CREATE UNIQUE INDEX "rollups_unique_bucket_idx" ON "analytics_rollups" ("profile_id", "date", "link_id", "device", "country");
CREATE INDEX "rollups_profile_date_idx" ON "analytics_rollups" ("profile_id", "date");

-- 14. Subscribers (Newsletter / Email Updates from Bio Page)
CREATE TABLE "subscribers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "ip_hash" text,
  "user_agent" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "subscribers_profile_email_idx" ON "subscribers" ("profile_id", "email");
CREATE INDEX "subscribers_profile_idx" ON "subscribers" ("profile_id");

-- -----------------------------------------------------------------------------
-- STEP 4: VERIFICATION QUERY
-- -----------------------------------------------------------------------------
SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name=t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
ORDER BY table_name;
