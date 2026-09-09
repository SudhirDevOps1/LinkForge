// =============================================================================
// 🗄️ SQLite Dialect Schema — Turso (libSQL) & Cloudflare D1 ke liye
// -----------------------------------------------------------------------------
// Yeh schema `src/db/schema.ts` (PostgreSQL) ka isomorphic mirror hai.
// App code hamesha pg schema types import karta hai; runtime par drizzle ka
// unified query API dono dialects par identical kaam karta hai.
//
// Migrations:
//   Turso → `npx drizzle-kit push --config drizzle.config.turso.ts`
//   D1    → `npx drizzle-kit push --config drizzle.config.d1.ts`
// =============================================================================
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const id = () => text("id").primaryKey().$defaultFn(newSqliteId);

/** Cross-dialect IDs: app-level UUID (pg `defaultRandom()` ka sqlite mirror).
 *  Node 19+ / browsers me `crypto.randomUUID`, warna safe fallback. */
function newSqliteId(): string {
  try {
    const c = globalThis.crypto as unknown as
      | { randomUUID?: () => string }
      | undefined;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
  } catch {
    /* fallback below */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}-${Math.random().toString(36).slice(2, 14)}`;
}
const ts = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());
const uuidCol = (name: string) => text(name);

export const users = sqliteTable(
  "users",
  {
    id: id(),
    email: text("email").notNull(),
    name: text("name").notNull().default(""),
    passwordHash: text("password_hash"),
    avatarUrl: text("avatar_url"),
    role: text("role").notNull().default("user"),
    createdAt: ts("created_at"),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuidCol("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: ts("created_at"),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const passwordResetTokens = sqliteTable(
  "password_reset_tokens",
  {
    id: id(),
    userId: uuidCol("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    createdAt: ts("created_at"),
  },
  (t) => [uniqueIndex("reset_token_hash_idx").on(t.tokenHash)],
);

export const profiles = sqliteTable(
  "profiles",
  {
    id: id(),
    userId: uuidCol("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    bio: text("bio").notNull().default(""),
    avatarUrl: text("avatar_url"),
    theme: text("theme").notNull().default("midnight"),
    layout: text("layout").notNull().default("list"),
    customDomain: text("custom_domain"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ogImageUrl: text("og_image_url"),
    analyticsEnabled: integer("analytics_enabled", { mode: "boolean" })
      .notNull()
      .default(true),
    isPublished: integer("is_published", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [
    uniqueIndex("profiles_slug_idx").on(t.slug),
    uniqueIndex("profiles_user_idx").on(t.userId),
    index("profiles_domain_idx").on(t.customDomain),
  ],
);

export const links = sqliteTable(
  "links",
  {
    id: id(),
    profileId: uuidCol("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    description: text("description").notNull().default(""),
    icon: text("icon").notNull().default("link"),
    type: text("type").notNull().default("link"),
    size: text("size").notNull().default("standard"),
    position: integer("position").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    thumbnailUrl: text("thumbnail_url"),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [index("links_profile_pos_idx").on(t.profileId, t.position)],
);

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    profileId: uuidCol("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    linkId: uuidCol("link_id").references(() => links.id, {
      onDelete: "cascade",
    }),
    type: text("type").notNull(),
    referrer: text("referrer").notNull().default(""),
    country: text("country").notNull().default(""),
    device: text("device").notNull().default(""),
    browser: text("browser").notNull().default(""),
    os: text("os").notNull().default(""),
    ipHash: text("ip_hash").notNull().default(""),
    createdAt: ts("created_at"),
  },
  (t) => [
    index("events_profile_time_idx").on(t.profileId, t.createdAt),
    index("events_link_idx").on(t.linkId),
    index("events_type_idx").on(t.type),
  ],
);

export const webhooks = sqliteTable(
  "webhooks",
  {
    id: id(),
    profileId: uuidCol("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    secret: text("secret").notNull(),
    events: text("events").notNull().default("click"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: ts("created_at"),
  },
  (t) => [index("webhooks_profile_idx").on(t.profileId)],
);

export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: id(),
    userId: uuidCol("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    prefix: text("prefix").notNull(),
    keyHash: text("key_hash").notNull(),
    lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    createdAt: ts("created_at"),
  },
  (t) => [
    uniqueIndex("api_keys_hash_idx").on(t.keyHash),
    index("api_keys_user_idx").on(t.userId),
  ],
);

export const teamMembers = sqliteTable(
  "team_members",
  {
    id: id(),
    profileId: uuidCol("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").notNull().default("editor"),
    invitedAt: ts("invited_at"),
    acceptedAt: integer("accepted_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("team_profile_idx").on(t.profileId)],
);

export const mailOutbox = sqliteTable("mail_outbox", {
  id: id(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  sentAt: integer("sent_at", { mode: "timestamp_ms" }),
  createdAt: ts("created_at"),
});

export const mediaFiles = sqliteTable(
  "media_files",
  {
    id: id(),
    profileId: uuidCol("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull().default(0),
    storageProvider: text("storage_provider").notNull().default("local"),
    storageKey: text("storage_key").notNull(),
    url: text("url").notNull(),
    createdAt: ts("created_at"),
  },
  (t) => [index("media_profile_idx").on(t.profileId)],
);

// 🎟️ Upload Tickets — presigned S3 uploads (pg schema.ts ka mirror).
// ids app-level `crypto.randomUUID()` se banti hain (cross-dialect identical).
export const uploadTickets = sqliteTable(
  "upload_tickets",
  {
    id: id(),
    profileId: uuidCol("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    storageKey: text("storage_key").notNull(),
    expectedMime: text("expected_mime").notNull(),
    expectedSize: integer("expected_size").notNull().default(0),
    fileName: text("file_name").notNull().default("file"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    createdAt: ts("created_at"),
  },
  (t) => [index("tickets_profile_idx").on(t.profileId)],
);
