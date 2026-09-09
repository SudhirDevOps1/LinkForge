// =============================================================================
// 🗄️ LinkForge — Primary Database Schema (PostgreSQL dialect)
// -----------------------------------------------------------------------------
// Compatible with: Local Postgres, Neon, Supabase (Postgres-compatible providers)
// SQLite dialect (Turso / Cloudflare D1) ke liye: `src/db/schema.sqlite.ts`
// Dono schemas isomorphic hain — app code dialect-agnostic rehta hai.
// =============================================================================
import {
  bigserial,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// 👤 Users — cross-provider user model (email / password / name / avatar)
// Har auth provider (Neon Auth, Supabase, Clerk, NextAuth, built-in) isi
// schema par map hota hai — auth abstraction layer isko normalize karta hai.
// ---------------------------------------------------------------------------
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull().default(""),
    passwordHash: text("password_hash"), // null when OAuth-only user
    avatarUrl: text("avatar_url"),
    role: text("role").notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

// ---------------------------------------------------------------------------
// 🔑 Sessions — built-in (Lucia-style) session store
// ---------------------------------------------------------------------------
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // opaque random token
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"), // privacy-first: raw IP kabhi store nahi hota
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("reset_token_hash_idx").on(t.tokenHash)],
);

// ---------------------------------------------------------------------------
// 🪪 Profiles — ek user ka public bio page
// ---------------------------------------------------------------------------
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(), // /[slug] public URL
    displayName: text("display_name").notNull(),
    bio: text("bio").notNull().default(""),
    avatarUrl: text("avatar_url"),
    theme: text("theme").notNull().default("midnight"), // see lib/themes.ts
    layout: text("layout").notNull().default("list"), // list | bento
    customDomain: text("custom_domain"), // e.g. bio.example.com
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ogImageUrl: text("og_image_url"),
    analyticsEnabled: boolean("analytics_enabled").notNull().default(true),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("profiles_slug_idx").on(t.slug),
    uniqueIndex("profiles_user_idx").on(t.userId),
    index("profiles_domain_idx").on(t.customDomain),
  ],
);

// ---------------------------------------------------------------------------
// 🔗 Links — profile ke andar ke cards (draggable, bento-aware, embed-aware)
// ---------------------------------------------------------------------------
export const links = pgTable(
  "links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    description: text("description").notNull().default(""),
    icon: text("icon").notNull().default("link"), // lucide icon name
    // link | youtube | spotify | x | instagram | tiktok | github | embed
    type: text("type").notNull().default("link"),
    // standard | wide | tall | feature (bento grid spans)
    size: text("size").notNull().default("standard"),
    position: integer("position").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    thumbnailUrl: text("thumbnail_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("links_profile_pos_idx").on(t.profileId, t.position)],
);

// ---------------------------------------------------------------------------
// 📊 Events — privacy-first analytics (views + clicks)
// Raw IP kabhi store nahi hota — sirf salted SHA-256 hash.
// ---------------------------------------------------------------------------
export const events = pgTable(
  "events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    linkId: uuid("link_id").references(() => links.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // view | click
    referrer: text("referrer").notNull().default(""),
    country: text("country").notNull().default(""),
    device: text("device").notNull().default(""), // mobile | tablet | desktop
    browser: text("browser").notNull().default(""),
    os: text("os").notNull().default(""),
    ipHash: text("ip_hash").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("events_profile_time_idx").on(t.profileId, t.createdAt),
    index("events_link_idx").on(t.linkId),
    index("events_type_idx").on(t.type),
  ],
);

// ---------------------------------------------------------------------------
// 🪝 Webhooks — link click / page view par outbound HTTP callbacks
// ---------------------------------------------------------------------------
export const webhooks = pgTable(
  "webhooks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    secret: text("secret").notNull(), // HMAC signing secret
    events: text("events").notNull().default("click"), // comma-separated
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("webhooks_profile_idx").on(t.profileId)],
);

// ---------------------------------------------------------------------------
// 🔌 API Keys — third-party REST API access (Authorization: Bearer lfk_...)
// Sirf SHA-256 hash store hota hai — raw key sirf ek baar dikhti hai.
// ---------------------------------------------------------------------------
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    prefix: text("prefix").notNull(), // display: lfk_ab12cd...
    keyHash: text("key_hash").notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("api_keys_hash_idx").on(t.keyHash),
    index("api_keys_user_idx").on(t.userId),
  ],
);

// ---------------------------------------------------------------------------
// 👥 Team Members — multi-user collaboration (invite → accept flow)
// ---------------------------------------------------------------------------
export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").notNull().default("editor"), // owner | editor | viewer
    invitedAt: timestamp("invited_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  },
  (t) => [index("team_profile_idx").on(t.profileId)],
);

// ---------------------------------------------------------------------------
// ✉️ Mail Outbox — self-hosted friendly dev mailer
// SMTP configured nahi hai to password-reset emails yahan queue hote hain.
// ---------------------------------------------------------------------------
export const mailOutbox = pgTable("mail_outbox", {
  id: uuid("id").defaultRandom().primaryKey(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// 📁 Media Files — drag-and-drop uploads (PDF, images, audio, video, docs)
// Files configured storage provider (local / B2 / R2 / S3 / MinIO / Blob) par
// jati hain; yahan sirf metadata + public URL rehta hai.
// ---------------------------------------------------------------------------
export const mediaFiles = pgTable(
  "media_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull().default(0),
    storageProvider: text("storage_provider").notNull().default("local"),
    storageKey: text("storage_key").notNull(),
    url: text("url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("media_profile_idx").on(t.profileId)],
);

// ---------------------------------------------------------------------------
// 🎟️ Upload Tickets — presigned S3 uploads (PUT → complete)
// Browser seedha storage par PUT karta hai; `complete` owner/expiry/size/
// signature verify karke `media_files` row banata hai. Single-use (`usedAt`).
// Purana multipart `POST /api/media` path waise hi chalta hai (fallback).
// ---------------------------------------------------------------------------
export const uploadTickets = pgTable(
  "upload_tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    storageKey: text("storage_key").notNull(),
    expectedMime: text("expected_mime").notNull(),
    expectedSize: integer("expected_size").notNull(),
    fileName: text("file_name").notNull().default("file"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("tickets_profile_idx").on(t.profileId)],
);

// ---- Inferred types --------------------------------------------------------
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Link = typeof links.$inferSelect;
export type AnalyticsEvent = typeof events.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type MediaFile = typeof mediaFiles.$inferSelect;
export type UploadTicket = typeof uploadTickets.$inferSelect;
