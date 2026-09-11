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
  jsonb,
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
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    passwordHash: text("password_hash"), // null when OAuth-only user
    avatarUrl: text("avatar_url"),
    role: text("role").notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

// ---------------------------------------------------------------------------
// 🔑 Sessions — built-in and Better Auth session store
// ---------------------------------------------------------------------------
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // opaque random token or session ID
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().default(""),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"), // privacy-first: raw IP kabhi store nahi hota
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("sessions_user_idx").on(t.userId),
    index("sessions_token_idx").on(t.token),
  ],
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
    // 🔒 Privacy & access control
    profilePassword: text("profile_password"), // bcrypt hash; NULL = no password
    noIndex: boolean("no_index").notNull().default(false), // hide from search engines
    hidePublicStats: boolean("hide_public_stats").notNull().default(false), // hide view count on public page
    // 📢 Announcement banner (optional top-of-page message)
    announcement: jsonb("announcement").$type<{
      text: string;
      emoji?: string;
      url?: string;
      expiresAt?: string; // ISO date string
    } | null>(),
    // Manual custom design (accent/radius/font/icon-size) — nullable JSON,
    // theme/layout ke upar override layer. NULL = theme defaults.
    design: jsonb("design").$type<{
      accent?: string;
      radiusPx?: number;
      fontScale?: number;
      iconSize?: number;
    }>(),
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
    // 📌 Pin / 🗓️ Scheduling / ⏰ Expiry
    isPinned: boolean("is_pinned").notNull().default(false), // pinned links render first
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }), // show only AFTER this date
    expiresAt: timestamp("expires_at", { withTimezone: true }),      // hide AFTER this date
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

// ---------------------------------------------------------------------------
// 📦 Analytics Rollups — Compact daily aggregates (Kam jagah me 98%+ DB savings)
// Thousands of raw events compress into single rows: (profile, date, link, dev, country)
// ---------------------------------------------------------------------------
export const analyticsRollups = pgTable(
  "analytics_rollups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    linkId: uuid("link_id").references(() => links.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    device: text("device").notNull().default("Desktop"),
    country: text("country").notNull().default("Unknown"),
    views: integer("views").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    uniqueVisitors: integer("unique_visitors").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("rollups_unique_bucket_idx").on(
      t.profileId,
      t.date,
      t.linkId,
      t.device,
      t.country,
    ),
    index("rollups_profile_date_idx").on(t.profileId, t.date),
  ],
);

// ---------------------------------------------------------------------------
// 📬 Subscribers — newsletter / email updates subscribers from public bio page
// ---------------------------------------------------------------------------
export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    status: text("status").notNull().default("active"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("subscribers_profile_email_idx").on(t.profileId, t.email),
    index("subscribers_profile_idx").on(t.profileId),
  ],
);

// ---------------------------------------------------------------------------
// 🛡️ Accounts — Better Auth OAuth / Credential accounts
// ---------------------------------------------------------------------------
export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("accounts_user_idx").on(t.userId),
    uniqueIndex("accounts_provider_account_idx").on(t.providerId, t.accountId),
  ],
);

// ---------------------------------------------------------------------------
// 🛡️ Verifications — Better Auth email/phone verification tokens
// ---------------------------------------------------------------------------
export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("verifications_identifier_idx").on(t.identifier),
  ],
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
export type AnalyticsRollup = typeof analyticsRollups.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Verification = typeof verifications.$inferSelect;

