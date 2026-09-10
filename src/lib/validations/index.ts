// =============================================================================
// ✅ Zod Validation Schemas — har user input server-side validate hota hai
// =============================================================================
import { z } from "zod";

// ---- Shared primitives ------------------------------------------------------
export const slugSchema = z
  .string()
  .min(3, "Slug kam se kam 3 characters ka hona chahiye")
  .max(39, "Slug 39 characters se lamba nahi ho sakta")
  .regex(
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    "Sirf lowercase letters, numbers aur hyphens allowed",
  );

export const urlSchema = z
  .string()
  .max(2048)
  .refine((v) => {
    if (v.startsWith("mailto:")) return true;
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, "Valid http(s) URL chahiye");

export const LINK_TYPES = [
  "link",
  "file", // uploaded file (PDF, doc, media) — download/open card
  "youtube",
  "spotify",
  "x",
  "instagram",
  "tiktok",
  "github",
  "embed",
] as const;

export const LINK_SIZES = ["standard", "wide", "tall", "feature"] as const;

/** System routes jo user slugs ki tarah capture nahi hone chahiye */
export const RESERVED_SLUGS = new Set([
  "www", "api", "app", "dashboard", "login", "signup", "admin", "support",
  "help", "about", "blog", "pricing", "docs", "settings", "analytics",
  "links", "themes", "appearance", "forgot-password", "reset-password",
  "_domain", "r", "static", "assets", "linkforge", "root", "null", "undefined",
]);

// ---- Auth -------------------------------------------------------------------
export const signupSchema = z.object({
  name: z.string().trim().min(1, "Naam zaroori hai").max(80),
  email: z.string().trim().toLowerCase().email("Valid email daalein").max(254),
  password: z
    .string()
    .min(8, "Password kam se kam 8 characters ka ho")
    .max(128)
    .regex(/[a-zA-Z]/, "Password me ek letter hona chahiye")
    .regex(/[0-9]/, "Password me ek number hona chahiye"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

export const resetSchema = z.object({
  token: z.string().min(16).max(128),
  password: z.string().min(8).max(128),
});

// ---- Profile ----------------------------------------------------------------
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
        .regex(/^(?!-)[a-z0-9.-]+\.[a-z]{2,}$/, "Valid domain daalein (e.g. bio.example.com)"),
      z.literal(""),
    ])
    .optional(),
  seoTitle: z.string().trim().max(120).optional(),
  seoDescription: z.string().trim().max(300).optional(),
  ogImageUrl: z.union([urlSchema, z.literal("")]).optional(),
  analyticsEnabled: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

// ---- Links ------------------------------------------------------------------
export const linkCreateSchema = z.object({
  title: z.string().trim().min(1, "Title zaroori hai").max(120),
  url: urlSchema,
  description: z.string().trim().max(200).optional().default(""),
  icon: z.string().trim().max(40).optional().default("link"),
  type: z.enum(LINK_TYPES).optional().default("link"),
  size: z.enum(LINK_SIZES).optional().default("standard"),
  thumbnailUrl: z.union([urlSchema, z.literal(""), z.null()]).optional(),
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
    }, "Valid URL chahiye"),
  events: z
    .array(z.enum(["click", "view"]))
    .min(1)
    .optional()
    .default(["click"]),
  isActive: z.boolean().optional().default(true),
});

// ---- API Keys ---------------------------------------------------------------
export const apiKeySchema = z.object({
  name: z.string().trim().min(1, "Key ka naam zaroori hai").max(60),
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
  accent: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Accent #rrggbb hex me do")
    .optional(),
  radiusPx: z.number().int().min(0).max(24).optional(),
  fontScale: z.number().min(0.9).max(1.15).optional(),
  iconSize: z.number().int().min(16).max(32).optional(),
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
  fileName: z.string().trim().min(1, "File name zaroori hai").max(120),
});

// ---- Account Management (Update & Permanent Deletion) -----------------------
export const accountDeleteSchema = z.object({
  confirmText: z.literal("DELETE", {
    message: "Confirm karne ke liye DELETE type karein",
  }),
});

export const accountUpdateSchema = z.object({
  name: z.string().trim().min(1, "Naam zaroori hai").max(80).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z
    .string()
    .min(8, "Naya password kam se kam 8 characters ka ho")
    .max(128)
    .regex(/[a-zA-Z]/, "Password me ek letter hona chahiye")
    .regex(/[0-9]/, "Password me ek number hona chahiye")
    .optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type LinkCreateInput = z.infer<typeof linkCreateSchema>;
export type LinkUpdateInput = z.infer<typeof linkUpdateSchema>;
export type MediaFileUpdateInput = z.infer<typeof mediaFileUpdateSchema>;
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;
export type AccountDeleteInput = z.infer<typeof accountDeleteSchema>;
