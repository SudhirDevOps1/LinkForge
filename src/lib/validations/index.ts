// =============================================================================
// ✅ Zod Validation Schemas — every user input is validated server-side
// =============================================================================
import { z } from "zod";

// ---- Shared primitives ------------------------------------------------------
export const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters long")
  .max(39, "Slug cannot exceed 39 characters")
  .regex(
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    "Only lowercase letters, numbers, and hyphens are allowed",
  );

export const urlSchema = z
  .string()
  .max(2048)
  .refine((v) => {
    if (v.startsWith("mailto:")) return true;
    if (v.startsWith("tel:")) return true;   // 📞 Phone links
    if (v.startsWith("upi:")) return true;   // 💳 UPI payment links
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, "Please provide a valid http(s), mailto, tel, or upi URL");

export const LINK_TYPES = [
  "link",
  "file", // uploaded file (PDF, doc, media) — download/open card
  "video",
  "audio",
  "image",
  "pdf",
  "markdown",
  "youtube",
  "spotify",
  "course",    // Course playlist / curriculum
  "playlist",  // Video / audio playlist
  "product",   // Store / Digital product with price
  "cal",       // Calendly / Cal.com booking
  "substack",  // Substack / Medium newsletter article
  "discord",   // Discord community
  "telegram",  // Telegram channel
  "twitch",    // Twitch live stream
  "x",
  "instagram",
  "tiktok",
  "github",
  "embed",
  // 📱 India-first quick CTAs
  "whatsapp",  // wa.me/ link — green branded button
  "upi",       // upi:// or any UPI link — UPI icon button
  "phone",     // tel: — click-to-call
  "email",     // mailto: — click-to-copy email
] as const;

export const LINK_SIZES = ["standard", "wide", "tall", "feature"] as const;

/** System routes that should never be captured as user profile slugs */
export const RESERVED_SLUGS = new Set([
  "www", "api", "app", "dashboard", "login", "signup", "admin", "support",
  "help", "about", "blog", "pricing", "docs", "settings", "analytics",
  "links", "themes", "appearance", "forgot-password", "reset-password",
  "_domain", "r", "static", "assets", "linkforge", "root", "null", "undefined",
]);

// ---- Auth -------------------------------------------------------------------
export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128)
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  altcha: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(254),
  password: z.string().min(1, "Password is required").max(128),
  altcha: z.string().trim().optional(),
});

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(254),
  altcha: z.string().trim().optional(),
});

export const resetSchema = z.object({
  token: z.string().min(16, "Invalid reset token").max(128),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128)
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// ---- Profile ----------------------------------------------------------------
export const announcementSchema = z
  .object({
    text: z.string().trim().min(1).max(160),
    emoji: z.string().trim().max(8).optional(),
    url: z.union([urlSchema, z.literal("")]).optional(),
    expiresAt: z.string().optional(), // ISO date string
  })
  .nullable()
  .optional();

export const profileUpdateSchema = z.object({
  slug: slugSchema.optional(),
  displayName: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(300).optional(),
  avatarUrl: z.union([urlSchema, z.literal("")]).optional(),
  theme: z.string().max(40).optional(),
  layout: z.enum(["list", "bento"]).optional(),
  customDomain: z
    .union([
      z
        .string()
        .trim()
        .toLowerCase()
        .max(253)
        .regex(/^(?!-)[a-z0-9.-]+\.[a-z]{2,}$/, "Please enter a valid domain (e.g. bio.example.com)"),
      z.literal(""),
    ])
    .optional(),
  seoTitle: z.string().trim().max(120).optional(),
  seoDescription: z.string().trim().max(300).optional(),
  ogImageUrl: z.union([urlSchema, z.literal("")]).optional(),
  analyticsEnabled: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  // 🔒 Privacy fields
  profilePassword: z.union([z.string().min(4).max(128), z.literal("")]).optional(),
  noIndex: z.boolean().optional(),
  hidePublicStats: z.boolean().optional(),
  announcement: announcementSchema,
});

// ---- Links ------------------------------------------------------------------
export const linkCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  url: urlSchema,
  description: z.string().trim().max(200).optional().default(""),
  icon: z.string().trim().max(100).optional().default("link"),
  type: z.enum(LINK_TYPES).optional().default("link"),
  size: z.enum(LINK_SIZES).optional().default("standard"),
  thumbnailUrl: z.union([urlSchema, z.literal(""), z.null()]).optional(),
  // 📌 Pin / 🗓️ Schedule / ⏰ Expiry
  isPinned: z.boolean().optional().default(false),
  scheduledAt: z.string().nullable().optional(), // ISO date string
  expiresAt: z.string().nullable().optional(),   // ISO date string
});

export const linkUpdateSchema = linkCreateSchema.partial().extend({
  position: z.number().int().min(0).max(10000).optional(),
  isActive: z.boolean().optional(),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
});

// ---- Webhooks ---------------------------------------------------------------
export const webhookSchema = z.object({
  url: z
    .string()
    .max(2048)
    .refine((v) => {
      try {
        return new URL(v).protocol === "https:" || new URL(v).protocol === "http:";
      } catch {
        return false;
      }
    }, "Please provide a valid webhook URL"),
  events: z
    .array(z.enum(["click", "view"]))
    .min(1)
    .optional()
    .default(["click"]),
  isActive: z.boolean().optional().default(true),
});

// ---- API Keys ---------------------------------------------------------------
export const apiKeySchema = z.object({
  name: z.string().trim().min(1, "API key name is required").max(60),
});

// ---- Import/Export ----------------------------------------------------------
// `design` optional passthrough (forward-compat): theme/layout prefs ka
// explicit block. Purane exports (bina design) waise hi valid rehte hain.
export const designBlockSchema = z.object({
  theme: z.string().max(40).optional(),
  layout: z.enum(["list", "bento"]).optional(),
});

export const importSchema = z.object({
  version: z.literal(1),
  profile: profileUpdateSchema.extend({ displayName: z.string().trim().min(1).max(80) }),
  design: designBlockSchema.optional(),
  links: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        url: urlSchema,
        description: z.string().trim().max(200).optional().default(""),
        icon: z.string().trim().max(40).optional().default("link"),
        type: z.enum(LINK_TYPES).optional().default("link"),
        size: z.enum(LINK_SIZES).optional().default("standard"),
        position: z.number().int().min(0).optional(),
        isActive: z.boolean().optional().default(true),
        thumbnailUrl: z.union([urlSchema, z.literal(""), z.null()]).optional(),
      }),
    )
    .max(500),
});

// ---- Manual custom design (PATCH /api/design) -------------------------------
export const designPrefsSchema = z.object({
  accent: z.string().optional(),
  background: z.string().optional(),
  radiusPx: z.number().int().min(0).max(28).optional(),
  fontScale: z.number().min(0.85).max(1.25).optional(),
  iconSize: z.number().int().min(16).max(36).optional(),
  fontFamily: z.string().max(80).optional(),
  fontStyle: z.string().max(40).optional(),
  fontWeight: z.string().max(40).optional(),
  textShadow: z.string().max(40).optional(),
  cardStyle: z.string().max(40).optional(),
  buttonShape: z.string().max(40).optional(),
  borderWidth: z.number().int().min(0).max(3).optional(),
  blurStrength: z.string().max(40).optional(),
  shadowStrength: z.string().max(40).optional(),
  backgroundEffect: z.string().max(40).optional(),
  hoverEffect: z.string().max(40).optional(),
  entranceAnimation: z.string().max(40).optional(),
  attentionEffect: z.string().max(40).optional(),
  avatarShape: z.string().max(40).optional(),
  avatarRing: z.boolean().optional(),
  // Advanced typography
  customFontName: z.string().max(60).optional(),
  letterSpacing: z.number().min(-0.05).max(0.15).optional(),
  lineHeight: z.number().min(1.2).max(2.1).optional(),
  // Per-element colors
  nameColor: z.string().max(9).optional(),
  bioColor: z.string().max(9).optional(),
  linkTextColor: z.string().max(9).optional(),
  linkIconColor: z.string().max(9).optional(),
  linkBorderColor: z.string().max(9).optional(),
  cardTintColor: z.string().max(9).optional(),
  borderColor: z.string().max(9).optional(),
  // Advanced card controls
  cardOpacity: z.number().min(0.3).max(1.0).optional(),
  cardPadding: z.string().max(40).optional(),
  iconBgStyle: z.string().max(40).optional(),
  // Advanced motion controls
  transitionSpeed: z.string().max(40).optional(),
  hoverDuration: z.number().min(0).max(600).optional(),
  staggerDelay: z.number().min(0).max(150).optional(),
  hoverEasing: z.string().max(40).optional(),
  scrollReveal: z.boolean().optional(),
  // Advanced code injection
  customCss: z.string().max(4000).optional(),
  extraBodyClass: z.string().max(80).optional(),
});

// ---- Media ticket flow (presign → PUT → complete) ---------------------------
export const presignSchema = z.object({
  fileName: z.string().trim().min(1).max(100),
  mime: z.string().trim().min(3).max(120),
  size: z.number().int().min(1).max(100 * 1024 * 1024),
});

export const completeSchema = z.object({
  ticketId: z.string().uuid(),
});

// ---- Media File Rename -----------------------------------------------------
export const mediaFileUpdateSchema = z.object({
  fileName: z.string().trim().min(1, "File name is required").max(120),
});

// ---- Account Management (Update & Permanent Deletion) -----------------------
export const accountDeleteSchema = z.object({
  confirmText: z.literal("DELETE", {
    message: "Type DELETE to confirm",
  }),
});

export const accountUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long")
    .max(128)
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type LinkCreateInput = z.infer<typeof linkCreateSchema>;
export type LinkUpdateInput = z.infer<typeof linkUpdateSchema>;
export type MediaFileUpdateInput = z.infer<typeof mediaFileUpdateSchema>;
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;
export type AccountDeleteInput = z.infer<typeof accountDeleteSchema>;
