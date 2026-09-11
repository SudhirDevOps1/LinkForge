"use client";

// =============================================================================
// 🪪 BioRenderer — public bio page renderer
// Themes + layouts (list / bento) + platform embeds (YouTube, Spotify, X, ...)
// Server-component safe (koi hook nahi) — public page, custom domain page aur
// dashboard live preview sab isi ko use karte hain.
// =============================================================================
import type { Link } from "@/db/schema";
import { getTheme } from "@/lib/themes";
import type { DesignPrefs } from "@/lib/design";
import { BrandIcon, BRAND_IDS, LUCIDE_ICONS, parseIcon } from "./icons";
import {
  AtSign,
  BookOpen,
  Calendar,
  Camera,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileCode,
  FileText,
  Film,
  Globe,
  Heart,
  Image as ImageIcon,
  Link2,
  Mail,
  Maximize2,
  MessageCircle,
  Music,
  Play,
  QrCode,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  UserPlus,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CountdownCard } from "./countdown-card";
import { DigitalCheckoutDrawer, type DigitalItem } from "./digital-checkout-drawer";

export function linkIcon(
  link: Pick<Link, "icon" | "type">,
  className?: string,
  sizePx?: number,
) {
  const { id, color } = parseIcon(link.icon);
  const baseStyle: React.CSSProperties =
    sizePx && Number.isFinite(sizePx) ? { width: sizePx, height: sizePx } : {};
  const style: React.CSSProperties = color ? { ...baseStyle, color } : baseStyle;
  const cls = sizePx ? undefined : (className ?? "h-5 w-5");

  // 1. Explicit brand or Indian platform icon id
  if (id && BRAND_IDS.includes(id)) {
    return <BrandIcon id={id} className={cls} style={style} />;
  }
  // 2. Type-based brand fallback (youtube/spotify/github/...)
  if (link.type && BRAND_IDS.includes(link.type)) {
    return <BrandIcon id={link.type} className={cls} style={style} />;
  }
  // 3. Lucide icons registry
  if (id && id !== "link" && LUCIDE_ICONS[id]) {
    const Icon = LUCIDE_ICONS[id];
    return <Icon className={cls} style={style} />;
  }
  const Icon = LUCIDE_ICONS[id ?? "link"] ?? Link2;
  return <Icon className={cls} style={style} />;
}

// ---- Embed helpers --------------------------------------------------------------
function youtubeId(url: string): string | null {
  const m =
    /(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.exec(url);
  return m?.[1] ?? null;
}

function spotifyEmbedUrl(url: string): string | null {
  const m = /open\.spotify\.com\/(track|album|playlist|episode|show|artist)\/([a-zA-Z0-9]+)/.exec(url);
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0` : null;
}

export type MediaType =
  | "youtube"
  | "spotify"
  | "video"
  | "audio"
  | "image"
  | "pdf"
  | "markdown"
  | "doc"
  | "link";

export function detectMediaType(link: Pick<Link, "url" | "type" | "icon">): MediaType {
  const rawUrl = link.url || "";
  if (link.type === "youtube" || youtubeId(rawUrl)) return "youtube";
  if (link.type === "spotify" || spotifyEmbedUrl(rawUrl)) return "spotify";

  const cleanUrl = rawUrl.split("?")[0].split("#")[0].toLowerCase();
  const iconId = parseIcon(link.icon).id;

  // Video check
  if (
    link.type === "video" ||
    iconId === "video" ||
    /\.(mp4|webm|mov|mkv|avi|m4v|ogv)$/i.test(cleanUrl)
  ) {
    return "video";
  }

  // Audio check
  if (
    link.type === "audio" ||
    iconId === "music" ||
    /\.(mp3|m4a|wav|ogg|aac|flac|wma)$/i.test(cleanUrl)
  ) {
    return "audio";
  }

  // Image check
  if (
    link.type === "image" ||
    iconId === "camera" ||
    /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(cleanUrl)
  ) {
    return "image";
  }

  // PDF check
  if (link.type === "pdf" || /\.pdf$/i.test(cleanUrl)) {
    return "pdf";
  }

  // Markdown check
  if (
    link.type === "markdown" ||
    link.type === "md" ||
    /\.(md|markdown)$/i.test(cleanUrl)
  ) {
    return "markdown";
  }

  // Generic document check
  if (/\.(txt|docx|doc|xlsx|csv|pptx|json)$/i.test(cleanUrl)) {
    return "doc";
  }

  return "link";
}

function Embed({ link }: { link: Link }) {
  if (link.type === "youtube") {
    const id = youtubeId(link.url);
    if (!id) return null;
    return (
      <div className="mt-2 overflow-hidden rounded-xl" style={{ aspectRatio: "16/9" }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={link.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    );
  }
  if (link.type === "spotify") {
    const src = spotifyEmbedUrl(link.url);
    if (!src) return null;
    return (
      <iframe
        src={src}
        title={link.title}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="mt-2 h-[152px] w-full rounded-xl border-0"
      />
    );
  }
  return null;
}

/** Markdown In-App Reader with clean typography and code styling */
function MarkdownReader({ content }: { content: string }) {
  const lines = content.split("\n");
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  const elements: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${idx}`}
            className="my-3 overflow-x-auto rounded-xl bg-black/70 p-3.5 font-mono text-xs text-violet-200 border border-white/10"
          >
            <code>{codeBlockContent.join("\n")}</code>
          </pre>,
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`sp-${idx}`} className="h-2" />);
      return;
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${idx}`} className="mt-4 mb-2 text-xl font-bold text-white border-b border-white/10 pb-1">
          {trimmed.slice(2)}
        </h1>,
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${idx}`} className="mt-3 mb-1.5 text-lg font-semibold text-white/95">
          {trimmed.slice(3)}
        </h2>,
      );
    } else if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${idx}`} className="mt-2.5 mb-1 text-base font-semibold text-white/90">
          {trimmed.slice(4)}
        </h3>,
      );
    } else if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`bq-${idx}`}
          className="my-2 border-l-2 border-violet-400/60 pl-3 italic text-sm text-zinc-300"
        >
          {trimmed.slice(2)}
        </blockquote>,
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <li key={`li-${idx}`} className="ml-4 list-disc text-sm text-zinc-300">
          {trimmed.slice(2)}
        </li>,
      );
    } else {
      elements.push(
        <p key={`p-${idx}`} className="my-1.5 text-sm leading-relaxed text-zinc-300">
          {trimmed}
        </p>,
      );
    }
  });

  return <div className="space-y-1">{elements}</div>;
}

// ---- Renderer ---------------------------------------------------------------------
export interface BioProfileShape {
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  theme: string;
  layout: string;
  slug?: string;
  /** Manual custom design (PATCH /api/design) — theme ke upar override layer */
  design?: DesignPrefs | null;
  /** 🔒 Privacy: view count public page par dikhana hai ya nahi */
  hidePublicStats?: boolean;
  upiId?: string | null;
}

interface ActiveMediaModal {
  type: "pdf" | "markdown" | "image" | "video" | "audio" | "doc";
  url: string;
  title: string;
}

export function BioRenderer({
  profile,
  links,
  trackClicks = true,
  footerSlot,
}: {
  profile: BioProfileShape;
  links: Link[];
  trackClicks?: boolean;
  footerSlot?: React.ReactNode;
}) {
  const theme = getTheme(profile.theme);
  const v = theme.vars;
  const active = links.filter((l) => l.isActive);
  const isBento = profile.layout === "bento";

  // Manual custom design — theme vars ke upar override (NULL = theme defaults)
  const d = profile.design;
  const accent = d?.accent || v.accent;
  const customBg = d?.background;

  // Custom button / card radius
  let radius = v.radius;
  if (d?.buttonShape === "sharp") radius = "0px";
  else if (d?.buttonShape === "soft") radius = "12px";
  else if (d?.buttonShape === "curved") radius = "18px";
  else if (d?.buttonShape === "pill") radius = "9999px";
  else if (d?.radiusPx != null) radius = `${d.radiusPx}px`;

  const fontScale = d?.fontScale ?? 1;
  const iconSize = d?.iconSize ?? 20;
  const iconBox = iconSize + 20;

  // Custom Font Family mapping (15+ Google Fonts + System/Next.js)
  const fontFamilies: Record<string, string> = {
    "space-grotesk": "'Space Grotesk', var(--font-space-grotesk), sans-serif",
    "inter": "'Inter', var(--font-inter), sans-serif",
    "outfit": "'Outfit', sans-serif",
    "jakarta": "'Plus Jakarta Sans', sans-serif",
    "syne": "'Syne', sans-serif",
    "playfair": "'Playfair Display', serif",
    "mono": "'JetBrains Mono', var(--font-jetbrains), monospace",
    "jetbrains": "'JetBrains Mono', var(--font-jetbrains), monospace",
    "bricolage": "'Bricolage Grotesque', sans-serif",
    "poppins": "'Poppins', sans-serif",
    "sora": "'Sora', sans-serif",
    "cinzel": "'Cinzel', serif",
    "caveat": "'Caveat', cursive",
    "fraunces": "'Fraunces', serif",
    "urbanist": "'Urbanist', sans-serif",
    "montserrat": "'Montserrat', sans-serif",
  };

  // Custom Google Font: if customFontName is set, use it (overrides fontFamily list)
  let activeFontFamily: string | undefined;
  if (d?.customFontName) {
    const sanitized = d.customFontName.trim();
    activeFontFamily = `'${sanitized}', sans-serif`;
  } else if (d?.fontFamily) {
    activeFontFamily = fontFamilies[d.fontFamily];
  }

  // Custom Google Font URL injected into the page head at runtime
  const customFontLinkHref = d?.customFontName
    ? `https://fonts.googleapis.com/css2?family=${d.customFontName.trim().replace(/\s+/g, "+")}:wght@300;400;500;600;700;900&display=swap`
    : null;

  // Text Casing
  const textTransform =
    d?.fontStyle === "uppercase"
      ? "uppercase"
      : d?.fontStyle === "capitalize"
        ? "capitalize"
        : d?.fontStyle === "lowercase"
          ? "lowercase"
          : undefined;

  // Letter Spacing: new numeric field takes priority over legacy fontStyle presets
  const letterSpacingValue: string | undefined =
    typeof d?.letterSpacing === "number"
      ? `${d.letterSpacing}em`
      : d?.fontStyle === "wide"
        ? "0.08em"
        : d?.fontStyle === "widest"
          ? "0.15em"
          : d?.fontStyle === "tight"
            ? "-0.03em"
            : undefined;

  // Line Height: new numeric field
  const lineHeightValue: number | undefined =
    typeof d?.lineHeight === "number" ? d.lineHeight : undefined;

  // Font Weight (extended: light, normal, medium, semibold, bold, black)
  const fontWeightClass =
    d?.fontWeight === "light"
      ? "font-light"
      : d?.fontWeight === "normal"
        ? "font-normal"
        : d?.fontWeight === "medium"
          ? "font-medium"
          : d?.fontWeight === "semibold"
            ? "font-semibold"
            : d?.fontWeight === "black"
              ? "font-black"
              : d?.fontWeight === "bold"
                ? "font-bold"
                : "font-bold";

  // Title Glow / Shadow
  let textShadowStyle: string | undefined = undefined;
  if (d?.textShadow === "subtle") {
    textShadowStyle = "0 2px 10px rgba(0, 0, 0, 0.75)";
  } else if (d?.textShadow === "neon") {
    textShadowStyle = `0 0 20px ${accent}, 0 0 40px ${accent}88`;
  } else if (d?.textShadow === "outline") {
    textShadowStyle = "-1px -1px 0 rgba(255,255,255,0.25), 1px 1px 0 rgba(0,0,0,0.85)";
  }

  // Custom Card Surface Style
  const effectiveCardStyle = d?.cardStyle || v.cardStyle;

  // Background Atmosphere Effect (22 distinct styles)
  const bgEffect = d?.backgroundEffect || "glow";
  const baseBg = customBg || v.bg;
  let backgroundStyle = `radial-gradient(ellipse 80% 50% at 50% -20%, ${accent}25, transparent), ${baseBg}`;
  let backgroundSizeStyle: string | undefined = undefined;

  switch (bgEffect) {
    case "glow":
      backgroundStyle = `radial-gradient(ellipse 80% 50% at 50% -20%, ${accent}28, transparent), ${baseBg}`;
      break;
    case "mesh":
      backgroundStyle = `radial-gradient(at 0% 0%, ${accent}30 0px, transparent 50%), radial-gradient(at 100% 100%, #d946ef25 0px, transparent 50%), radial-gradient(at 50% 50%, #38bdf820 0px, transparent 50%), ${baseBg}`;
      break;
    case "dots":
      backgroundStyle = `radial-gradient(${accent}25 1.5px, transparent 1.5px), ${baseBg}`;
      backgroundSizeStyle = "24px 24px";
      break;
    case "aurora":
      backgroundStyle = `radial-gradient(ellipse at 20% 0%, ${accent}35 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, #38bdf830 0%, transparent 60%), radial-gradient(ellipse at 50% 80%, #f43f5e25 0%, transparent 50%), ${baseBg}`;
      break;
    case "matrix":
      backgroundStyle = `linear-gradient(180deg, rgba(34, 197, 94, 0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.04) 1px, transparent 1px), radial-gradient(circle at 50% 0%, rgba(34, 197, 94, 0.15), transparent 70%), ${baseBg}`;
      backgroundSizeStyle = "18px 24px, 18px 24px, 100% 100%, 100% 100%";
      break;
    case "synthwave":
      backgroundStyle = `linear-gradient(to top, rgba(236, 72, 153, 0.3) 0%, transparent 40%), linear-gradient(rgba(168, 85, 247, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.18) 1px, transparent 1px), ${baseBg}`;
      backgroundSizeStyle = "100% 100%, 40px 40px, 40px 40px, 100% 100%";
      break;
    case "constellation":
      backgroundStyle = `radial-gradient(1.5px 1.5px at 20px 30px, #ffffff 100%, transparent), radial-gradient(1.5px 1.5px at 140px 80px, ${accent} 100%, transparent), radial-gradient(1px 1px at 80px 170px, #ffffff88 100%, transparent), radial-gradient(1.5px 1.5px at 210px 140px, ${accent}88 100%, transparent), ${baseBg}`;
      backgroundSizeStyle = "260px 260px";
      break;
    case "bokeh":
      backgroundStyle = `radial-gradient(circle at 18% 22%, ${accent}35 0%, transparent 35%), radial-gradient(circle at 82% 60%, #38bdf825 0%, transparent 40%), radial-gradient(circle at 50% 88%, #ec489922 0%, transparent 35%), ${baseBg}`;
      break;
    case "waves":
      backgroundStyle = `repeating-radial-gradient(circle at 50% -25%, transparent 0, transparent 40px, ${accent}14 41px, transparent 43px), ${baseBg}`;
      break;
    case "circuit":
      backgroundStyle = `linear-gradient(90deg, ${accent}15 1px, transparent 1px), linear-gradient(0deg, ${accent}15 1px, transparent 1px), radial-gradient(circle at 50% 50%, ${accent}30 2px, transparent 2px), ${baseBg}`;
      backgroundSizeStyle = "36px 36px, 36px 36px, 36px 36px, 100% 100%";
      break;
    case "carbon":
      backgroundStyle = `radial-gradient(black 15%, transparent 16%) 0 0, radial-gradient(black 15%, transparent 16%) 8px 8px, radial-gradient(rgba(255,255,255,0.08) 15%, transparent 20%) 0 1px, radial-gradient(rgba(255,255,255,0.08) 15%, transparent 20%) 8px 9px, ${baseBg}`;
      backgroundSizeStyle = "16px 16px";
      break;
    case "isometric":
      backgroundStyle = `linear-gradient(30deg, ${accent}16 12%, transparent 12.5%, transparent 87%, ${accent}16 87.5%, ${accent}16), linear-gradient(150deg, ${accent}16 12%, transparent 12.5%, transparent 87%, ${accent}16 87.5%, ${accent}16), linear-gradient(30deg, ${accent}16 12%, transparent 12.5%, transparent 87%, ${accent}16 87.5%, ${accent}16), linear-gradient(150deg, ${accent}16 12%, transparent 12.5%, transparent 87%, ${accent}16 87.5%, ${accent}16), ${baseBg}`;
      backgroundSizeStyle = "40px 70px";
      break;
    case "particles":
      backgroundStyle = `radial-gradient(1px 1px at 25px 25px, white 100%, transparent), radial-gradient(1px 1px at 75px 85px, ${accent} 100%, transparent), radial-gradient(1.5px 1.5px at 150px 110px, #a78bfa 100%, transparent), radial-gradient(1px 1px at 220px 190px, white 100%, transparent), ${baseBg}`;
      backgroundSizeStyle = "240px 240px";
      break;
    case "honeycomb":
      backgroundStyle = `radial-gradient(circle at 100% 50%, transparent 20%, ${accent}18 21%, ${accent}18 34%, transparent 35%, transparent), radial-gradient(circle at 0% 50%, transparent 20%, ${accent}18 21%, ${accent}18 34%, transparent 35%, transparent) 0 25px, ${baseBg}`;
      backgroundSizeStyle = "50px 50px";
      break;
    case "stripes":
      backgroundStyle = `repeating-linear-gradient(45deg, ${accent}10, ${accent}10 10px, transparent 10px, transparent 20px), ${baseBg}`;
      break;
    case "topography":
      backgroundStyle = `repeating-radial-gradient(circle at 50% 120%, transparent 0, transparent 28px, ${accent}16 29px, transparent 31px), repeating-radial-gradient(circle at 20% 10%, transparent 0, transparent 40px, ${accent}12 41px, transparent 43px), ${baseBg}`;
      break;
    case "scanlines":
      backgroundStyle = `repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.35) 0px, rgba(0, 0, 0, 0.35) 1px, transparent 1px, transparent 3px), radial-gradient(ellipse at 50% 50%, ${accent}25 0%, transparent 80%), ${baseBg}`;
      break;
    case "sunset":
      backgroundStyle = `linear-gradient(180deg, ${baseBg} 0%, #3b0764 45%, #831843 70%, #f97316 92%, #facc15 100%)`;
      break;
    case "spotlight":
      backgroundStyle = `radial-gradient(ellipse 55% 75% at 20% -10%, ${accent}45 0%, transparent 60%), radial-gradient(ellipse 55% 75% at 80% -10%, #38bdf835 0%, transparent 60%), ${baseBg}`;
      break;
    case "nebula":
      backgroundStyle = `radial-gradient(ellipse at top left, #9333ea40 0%, transparent 50%), radial-gradient(ellipse at top right, #06b6d440 0%, transparent 50%), radial-gradient(ellipse at bottom, #ec489930 0%, transparent 60%), ${baseBg}`;
      break;
    case "noise":
      backgroundStyle = `radial-gradient(circle at 50% 50%, ${accent}20 0%, transparent 80%), repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.035) 0, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 3px), ${baseBg}`;
      break;
    case "none":
      backgroundStyle = baseBg;
      break;
    default:
      backgroundStyle = `radial-gradient(ellipse 80% 50% at 50% -20%, ${accent}25, transparent), ${baseBg}`;
  }

  // Card Border Width & Blur Filter
  const cardBorderWidth = d?.borderWidth != null ? `${d.borderWidth}px` : "1px";
  const blurFilter =
    d?.blurStrength === "none"
      ? undefined
      : d?.blurStrength === "low"
        ? "blur(8px)"
        : d?.blurStrength === "high"
          ? "blur(24px)"
          : "blur(14px)";

  // Per-element color tokens
  const effectiveNameColor = d?.nameColor || undefined;
  const effectiveBioColor = d?.bioColor || v.muted;
  const effectiveLinkTextColor = d?.linkTextColor || undefined;
  const effectiveLinkIconColor = d?.linkIconColor || accent;
  const effectiveLinkBorderColor = d?.linkBorderColor || undefined;
  const effectiveBorderColor = d?.borderColor || undefined;

  // Card advanced controls
  const cardOpacity = d?.cardOpacity ?? 1.0;
  const cardPaddingMap: Record<string, string> = {
    compact: "8px",
    default: "14px",
    spacious: "20px",
    roomy: "28px",
  };
  const cardPaddingValue = d?.cardPadding ? (cardPaddingMap[d.cardPadding] ?? "14px") : undefined;

  // Icon background style
  const iconBgStyle = d?.iconBgStyle ?? "transparent";
  const iconBgForCard = (iconColor: string) => {
    if (iconBgStyle === "accent") return iconColor;
    if (iconBgStyle === "tinted") return `${iconColor}18`;
    return "transparent";
  };
  const iconBorderForCard = (iconColor: string) => {
    if (iconBgStyle === "accent") return "transparent";
    if (iconBgStyle === "tinted") return `${iconColor}35`;
    return `${iconColor}35`;
  };

  // Motion: transition speed
  const transitionDurationMs =
    d?.transitionSpeed === "instant" ? 0
      : d?.transitionSpeed === "fast" ? 150
        : d?.transitionSpeed === "slow" ? 400
          : d?.hoverDuration ?? 200;
  const transitionDuration = `${transitionDurationMs}ms`;

  // Easing curve
  const easingMap: Record<string, string> = {
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    linear: "linear",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    ease: "ease",
  };
  const transitionEasing = easingMap[d?.hoverEasing ?? "ease"] ?? "ease";
  const transitionValue = `all ${transitionDuration} ${transitionEasing}`;

  // Stagger delay (ms per card)
  const staggerMs = d?.staggerDelay ?? 45;

  // Card Hover Effect
  const hoverClass =
    d?.hoverEffect === "scale"
      ? "hover:scale-[1.025]"
      : d?.hoverEffect === "glow"
        ? "hover:ring-2"
        : d?.hoverEffect === "tilt"
          ? "hover:-rotate-0.5 hover:scale-[1.015]"
          : d?.hoverEffect === "none"
            ? ""
            : "hover:-translate-y-1";

  // Avatar Framing & Glow Ring
  let avatarShapeClass = "rounded-full";
  if (d?.avatarShape === "squircle") avatarShapeClass = "rounded-[28px]";
  else if (d?.avatarShape === "rounded") avatarShapeClass = "rounded-2xl";
  else if (d?.avatarShape === "hexagon") avatarShapeClass = "rounded-3xl";
  const hasAvatarRing = d?.avatarRing ?? false;

  // ── Avatar Aura & Halo Customization ─────────────────────────────────────────
  const auraStyle = d?.avatarAuraStyle || (hasAvatarRing ? "spin" : "none");
  const showAura = auraStyle !== "none";
  const auraColor = d?.avatarAuraColor || accent;
  const auraSpeed = d?.avatarAuraSpeed || "normal";
  const auraBlur = d?.avatarAuraBlur || "subtle";

  const auraDuration =
    auraSpeed === "fast" ? "1.8s" : auraSpeed === "slow" ? "8s" : "3.6s";

  const auraBlurPx =
    auraBlur === "intense" ? "16px" : auraBlur === "medium" ? "8px" : "2px";

  const auraRadius =
    d?.avatarShape === "squircle" ? "32px" : d?.avatarShape === "rounded" ? "22px" : "9999px";

  let auraBackground = `conic-gradient(from 0deg, ${auraColor}, #ec4899, #38bdf8, ${auraColor})`;
  let auraAnimation = `spinSlow ${auraDuration} linear infinite`;
  let auraInset = "-inset-1.5";

  if (auraStyle === "pulse") {
    auraBackground = `radial-gradient(circle, ${auraColor}, ${auraColor}40, transparent 75%)`;
    auraAnimation = `auraPulse ${auraDuration} ease-in-out infinite`;
    auraInset = "-inset-2.5";
  } else if (auraStyle === "ripple") {
    auraBackground = `radial-gradient(circle, transparent 55%, ${auraColor}88 70%, ${auraColor} 90%, transparent 100%)`;
    auraAnimation = `auraRipple ${auraDuration} cubic-bezier(0.1, 0.8, 0.3, 1) infinite`;
    auraInset = "-inset-3";
  } else if (auraStyle === "neon") {
    auraBackground = auraColor;
    auraAnimation = `neonBreathe ${auraDuration} ease-in-out infinite`;
    auraInset = "-inset-1.5";
  } else if (auraStyle === "fire") {
    auraBackground = "conic-gradient(from 0deg, #ff4500, #ff8c00, #ffd700, #ff0055, #ff4500)";
    auraAnimation = `spinSlow ${auraDuration} linear infinite`;
    auraInset = "-inset-2";
  } else if (auraStyle === "cyber") {
    auraBackground = "conic-gradient(from 0deg, #00f0ff, #7000ff, #ff007b, #00f0ff)";
    auraAnimation = `spinSlow ${auraDuration} linear infinite`;
    auraInset = "-inset-2";
  } else if (auraStyle === "static") {
    auraBackground = `radial-gradient(circle, ${auraColor}99, ${auraColor}33, transparent 75%)`;
    auraAnimation = "none";
    auraInset = "-inset-2";
  }

  // ── Display Name Typography & Animation ─────────────────────────────────────
  const nameAnim = d?.nameAnimation || "none";
  const nameGrad = d?.nameGradient;

  const gradientPalettes: Record<string, string> = {
    "violet-cyan": "linear-gradient(135deg, #c084fc 0%, #22d3ee 50%, #f472b6 100%)",
    sunset: "linear-gradient(135deg, #fb923c 0%, #f43f5e 50%, #facc15 100%)",
    "neon-matrix": "linear-gradient(135deg, #34d399 0%, #22d3ee 50%, #60a5fa 100%)",
    "golden-fire": "linear-gradient(135deg, #fbbf24 0%, #f87171 50%, #f59e0b 100%)",
    cyberpunk: "linear-gradient(135deg, #f43f5e 0%, #a855f7 50%, #06b6d4 100%)",
  };

  const activeGradient = nameGrad
    ? (gradientPalettes[nameGrad] || (nameGrad.startsWith("linear-gradient") || nameGrad.startsWith("radial-gradient") ? nameGrad : null))
    : null;
  const isGradientName = Boolean(activeGradient) || nameAnim === "gradient-flow";
  const nameBgGradient = activeGradient || "linear-gradient(135deg, #a855f7 0%, #06b6d4 50%, #ec4899 100%)";

  // ⌨️ Multi-Type Real-Time Typewriter Engine
  const isTypingAnim = nameAnim.startsWith("typing");
  const isMultiTyping = nameAnim === "typing-multi";
  const isTerminalTyping = nameAnim === "typing-terminal";
  const isOnceTyping = nameAnim === "typing-once";

  const rawPhrases = d?.typewriterPhrases
    ? d.typewriterPhrases.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const multiPhrases = rawPhrases.length > 0
    ? rawPhrases
    : [profile.displayName || "Creator", profile.slug ? `@${profile.slug}` : "Creator", "Welcome to my Bio"];

  const [phraseIdx, setPhraseIdx] = useState(0);
  const currentTargetText = isMultiTyping
    ? multiPhrases[phraseIdx % multiPhrases.length]
    : (profile.displayName || "");

  const [typedCount, setTypedCount] = useState(profile.displayName ? profile.displayName.length : 0);
  const [isDeleting, setIsDeleting] = useState(false);

  const typeSpeed = d?.typewriterSpeed === "fast" ? 70 : d?.typewriterSpeed === "slow" ? 180 : 110;
  const deleteSpeed = Math.round(typeSpeed * 0.55);

  useEffect(() => {
    if (!isTypingAnim || nameAnim === "typing-scramble") {
      setTypedCount(currentTargetText.length);
      return;
    }
    if (!currentTargetText) return;

    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting && typedCount < currentTargetText.length) {
      timer = setTimeout(() => setTypedCount((prev) => prev + 1), typeSpeed);
    } else if (!isDeleting && typedCount >= currentTargetText.length) {
      if (isOnceTyping) return;
      timer = setTimeout(() => setIsDeleting(true), 2400);
    } else if (isDeleting && typedCount > 0) {
      timer = setTimeout(() => setTypedCount((prev) => prev - 1), deleteSpeed);
    } else if (isDeleting && typedCount === 0) {
      if (isMultiTyping) {
        setPhraseIdx((i) => (i + 1) % multiPhrases.length);
      }
      timer = setTimeout(() => setIsDeleting(false), 500);
    }

    return () => clearTimeout(timer);
  }, [isTypingAnim, isOnceTyping, isMultiTyping, nameAnim, currentTargetText, typedCount, isDeleting, typeSpeed, deleteSpeed, multiPhrases.length]);

  // 👾 Hacker Matrix Decrypt Effect
  const [scrambleText, setScrambleText] = useState(profile.displayName || "");

  useEffect(() => {
    if (nameAnim !== "typing-scramble") return;
    const target = profile.displayName || "";
    if (!target) return;
    const glyphs = "!<>-_\\/[]{}—=+*^?#________0101";
    let iteration = 0;
    let timer: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;

    const runScramble = () => {
      iteration = 0;
      clearInterval(interval);
      interval = setInterval(() => {
        setScrambleText(
          target
            .split("")
            .map((char, index) => {
              if (index < iteration) return target[index];
              if (char === " ") return " ";
              return glyphs[Math.floor(Math.random() * glyphs.length)];
            })
            .join("")
        );

        if (iteration >= target.length) {
          clearInterval(interval);
          timer = setTimeout(runScramble, 3200);
        }
        iteration += 1 / 3;
      }, 35);
    };

    runScramble();
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [nameAnim, profile.displayName]);

  let nameAnimStyle: React.CSSProperties = {};
  if (nameAnim === "gradient-flow") {
    nameAnimStyle = {
      backgroundImage: nameBgGradient,
      backgroundSize: "200% auto",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      animation: "gradientFlow 4s ease infinite",
    };
  } else if (nameAnim === "neon-pulse") {
    nameAnimStyle = {
      animation: "neonBreathe 3s ease-in-out infinite",
      color: effectiveNameColor || accent,
    };
  } else if (nameAnim === "shimmer") {
    nameAnimStyle = {
      backgroundImage: `linear-gradient(90deg, ${effectiveNameColor || "#ffffff"} 0%, ${accent} 50%, ${effectiveNameColor || "#ffffff"} 100%)`,
      backgroundSize: "200% 100%",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      animation: "shimmer 2.5s infinite",
    };
  } else if (nameAnim === "float") {
    nameAnimStyle = {
      display: "inline-block",
      animation: "float 3s ease-in-out infinite",
      color: effectiveNameColor,
    };
  } else if (isGradientName) {
    nameAnimStyle = {
      backgroundImage: nameBgGradient,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    };
  }

  // In-App Modal State
  const [activeModal, setActiveModal] = useState<ActiveMediaModal | null>(null);
  const [docContent, setDocContent] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  useEffect(() => {
    if (activeModal && (activeModal.type === "markdown" || activeModal.type === "doc")) {
      setLoadingDoc(true);
      fetch(activeModal.url)
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`Failed to load (HTTP ${r.status})`))))
        .then((txt) => {
          setDocContent(txt);
          setLoadingDoc(false);
        })
        .catch((err) => {
          setDocContent(`Error reading document: ${err.message}`);
          setLoadingDoc(false);
        });
    } else {
      setDocContent(null);
    }
  }, [activeModal]);

  // 🖱️ Interactive Custom Cursor Tracking (accent glow dot / follower)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [cursorVisible, setCursorVisible] = useState(false);

  useEffect(() => {
    if (!d?.cursorEffect || d.cursorEffect === "none") return;
    const onMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      setCursorVisible(true);
    };
    const onLeave = () => setCursorVisible(false);
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [d?.cursorEffect]);

  const hrefFor = (link: Link) => (trackClicks ? `/r/${link.id}` : link.url);

  // ── Elite Public Website Features: Search, Categories & Audio Feedback ──────
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(d?.audioFeedback ?? false);
  const [checkoutItem, setCheckoutItem] = useState<DigitalItem | null>(null);

  const openDigitalCheckout = (link: Link) => {
    playClick();
    const priceMatch = link.title.match(/\[(.*?)\]/) || link.description?.match(/\[(.*?)\]/);
    const price = priceMatch
      ? priceMatch[1]
      : link.type === "course"
        ? "Full Course"
        : link.type === "product"
          ? "Instant"
          : undefined;

    let syllabus: Array<{ title: string; duration?: string; isFreePreview?: boolean }> | undefined;
    if (link.description?.includes("•")) {
      const parts = link.description.split("•").map((p) => p.trim());
      syllabus = parts
        .filter((p) => p.toLowerCase().includes("ch") || p.toLowerCase().includes("mod") || p.includes(":"))
        .map((p, i) => ({
          title: p.replace(/^Ch\d+:\s*/i, "").replace(/^Module\s*\d+:\s*/i, ""),
          duration: p.match(/\((.*?)\)/)?.[1] || undefined,
          isFreePreview: i === 0,
        }));
    }

    setCheckoutItem({
      id: link.id,
      title: link.title.replace(/\[.*?\]/, "").trim(),
      url: hrefFor(link),
      description: link.description || undefined,
      price,
      type: link.type,
      downloadUrl: link.url,
      syllabus: syllabus && syllabus.length > 0 ? syllabus : undefined,
    });
  };

  const playClick = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(560, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {}
  };

  const isSocialLink = (l: Link) => {
    const t = (l.type || "").toLowerCase();
    const u = (l.url || "").toLowerCase();
    const socials = [
      "github", "youtube", "twitter", "x", "instagram", "linkedin", "telegram",
      "discord", "facebook", "tiktok", "twitch", "threads", "bluesky", "spotify",
      "email", "mail", "phone", "contact"
    ];
    return socials.includes(t) || socials.some((s) => u.includes(s));
  };

  const isMediaLink = (l: Link) => {
    const t = (l.type || "").toLowerCase();
    return ["video", "audio", "document", "image", "media", "doc", "pdf"].includes(t);
  };

  const isShopLink = (l: Link) => {
    const t = (l.type || "").toLowerCase();
    return ["product", "course", "shop", "digital"].includes(t);
  };

  const counts = {
    all: active.length,
    featured: active.filter((l) => l.isPinned).length,
    socials: active.filter(isSocialLink).length,
    media: active.filter(isMediaLink).length,
    shop: active.filter(isShopLink).length,
  };

  const categories = [
    { id: "all", label: "All", count: counts.all },
    ...(counts.featured > 0 ? [{ id: "featured", label: "Featured", count: counts.featured }] : []),
    ...(counts.socials > 0 ? [{ id: "socials", label: "Socials", count: counts.socials }] : []),
    ...(counts.media > 0 ? [{ id: "media", label: "Media", count: counts.media }] : []),
    ...(counts.shop > 0 ? [{ id: "shop", label: "Store", count: counts.shop }] : []),
  ];

  const showCategoryTabs = (d?.showCategories ?? true) && categories.length > 2;
  const showSearchBar = (d?.showSearch ?? true) && active.length >= 4;
  const showTopFloatingBar = d?.showFloatingBar ?? true;

  const filteredLinks = active.filter((link) => {
    if (selectedCategory === "featured" && !link.isPinned) return false;
    if (selectedCategory === "socials" && !isSocialLink(link)) return false;
    if (selectedCategory === "media" && !isMediaLink(link)) return false;
    if (selectedCategory === "shop" && !isShopLink(link)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (link.title || "").toLowerCase().includes(q);
      const matchDesc = (link.description || "").toLowerCase().includes(q);
      const matchUrl = (link.url || "").toLowerCase().includes(q);
      return matchTitle || matchDesc || matchUrl;
    }
    return true;
  });

  const downloadVCard = () => {
    playClick();
    const name = profile.displayName || "Creator";
    const bio = (profile.bio || "").replace(/\n/g, " ");
    const slugUrl = profile.slug
      ? (typeof window !== "undefined" ? `${window.location.origin}/${profile.slug}` : `https://linkforge-demo.vercel.app/${profile.slug}`)
      : "";
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${name}`,
      `TITLE:${bio}`,
      `URL:${slugUrl}`,
      "NOTE:Saved from LinkForge Bio",
      "END:VCARD",
    ].join("\r\n");

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = `${name.replace(/[^a-zA-Z0-9]/g, "_")}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(u);
  };

  const handleShare = () => {
    playClick();
    setShareModalOpen(true);
  };

  const cardStyleFor = (hover = false): React.CSSProperties => {
    let surfaceBg = hover ? v.surfaceHover : v.surface;
    let borderColor = effectiveLinkBorderColor || effectiveBorderColor || v.border;
    let shadow: string | undefined = undefined;

    if (effectiveCardStyle === "solid") {
      surfaceBg = hover ? "#1c1c28" : "#12121c";
      borderColor = effectiveLinkBorderColor || effectiveBorderColor || (hover ? `${accent}66` : "rgba(255,255,255,0.12)");
    } else if (effectiveCardStyle === "neon") {
      surfaceBg = hover ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.4)";
      borderColor = effectiveLinkBorderColor || effectiveBorderColor || accent;
      shadow = `0 0 18px ${accent}45`;
    } else if (effectiveCardStyle === "neumorphic") {
      surfaceBg = hover ? "#161622" : "#101018";
      borderColor = effectiveLinkBorderColor || effectiveBorderColor || "rgba(255,255,255,0.06)";
      shadow = `0 14px 28px -6px rgba(0,0,0,0.7)`;
    } else if (effectiveCardStyle === "minimal") {
      surfaceBg = hover ? "rgba(255,255,255,0.04)" : "transparent";
      borderColor = effectiveLinkBorderColor || effectiveBorderColor || (hover ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)");
    }

    if (d?.shadowStrength === "none") {
      shadow = "none";
    } else if (d?.shadowStrength === "soft") {
      shadow = "0 8px 20px -6px rgba(0,0,0,0.35)";
    } else if (d?.shadowStrength === "floating") {
      shadow = "0 20px 40px -10px rgba(0,0,0,0.65)";
    } else if (d?.shadowStrength === "glow") {
      shadow = `0 0 24px ${accent}45, 0 10px 30px rgba(0,0,0,0.5)`;
    }

    // Apply cardTintColor as an overlay gradient on top of surface
    const bgWithTint = d?.cardTintColor
      ? `linear-gradient(${d.cardTintColor}22, ${d.cardTintColor}22), ${surfaceBg}`
      : surfaceBg;

    return {
      background: bgWithTint,
      borderColor,
      borderWidth: cardBorderWidth,
      borderStyle: "solid",
      borderRadius: radius,
      backdropFilter: effectiveCardStyle === "glass" ? blurFilter : undefined,
      WebkitBackdropFilter: effectiveCardStyle === "glass" ? blurFilter : undefined,
      boxShadow: shadow ?? (v.cardStyle === "shadow" ? `0 10px 34px -12px ${accent}55` : undefined),
      opacity: cardOpacity !== 1.0 ? cardOpacity : undefined,
      padding: cardPaddingValue,
      transition: transitionValue,
    };
  };


  const spanClass = (size: string) =>
    !isBento
      ? ""
      : size === "wide"
        ? "col-span-2"
        : size === "tall"
          ? "row-span-2"
          : size === "feature"
            ? "col-span-2 row-span-2"
            : "";

  return (
    <div
      className={`theme-font-${v.font} relative min-h-screen w-full transition-colors duration-300 overflow-x-hidden${d?.extraBodyClass ? ` ${d.extraBodyClass}` : ""}`}
      style={{
        background: backgroundStyle,
        backgroundSize: backgroundSizeStyle,
        color: v.text,
        fontFamily: activeFontFamily,
        letterSpacing: letterSpacingValue,
        lineHeight: lineHeightValue,
      }}
    >
      {/* Dynamic Google Font loader for custom font names */}
      {customFontLinkHref && (
        <link rel="stylesheet" href={customFontLinkHref} />
      )}
      {/* Custom CSS injection (sanitized server-side) */}
      {d?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: d.customCss }} />
      )}
      {/* 🖱️ Interactive Custom Cursor Tracking */}
      {d?.cursorEffect && d.cursorEffect !== "none" && cursorPos && cursorVisible && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 transition-transform duration-75 ease-out will-change-transform hidden sm:block"
          style={{
            transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`,
            top: 0,
            left: 0,
          }}
        >
          {d.cursorEffect === "glow" ? (
            <div
              className="-translate-x-1/2 -translate-y-1/2 rounded-full blur-[6px] opacity-75 animate-pulse"
              style={{
                width: 32,
                height: 32,
                background: `radial-gradient(circle, ${accent}, ${accent}15)`,
              }}
            />
          ) : (
            <div
              className="-translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50 shadow-md"
              style={{
                width: 12,
                height: 12,
                backgroundColor: accent,
              }}
            />
          )}
        </div>
      )}
      {/* Ambient background light orbs for balanced widescreen and desktop presentation */}
      {bgEffect !== "none" && bgEffect !== "scanlines" && bgEffect !== "carbon" && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <div
            className="absolute -top-32 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full blur-[140px] opacity-25"
            style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
          />
          <div
            className="hidden md:block absolute -bottom-32 left-1/2 h-[450px] w-[800px] -translate-x-1/2 rounded-full blur-[160px] opacity-20"
            style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
          />
        </div>
      )}

      <div
        className={`relative z-[1] mx-auto flex min-h-screen w-full flex-col items-center px-4 sm:px-6 py-8 sm:py-12 transition-all ${
          isBento
            ? "max-w-xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl"
            : "max-w-xl md:max-w-2xl"
        }`}
      >
        {/* 🌐 Top Floating Glass Action Bar (Hero Header) */}
        {showTopFloatingBar && (
          <header
            className="w-full mb-6 flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-lg transition-all"
            style={{ borderColor: `${accent}25` }}
          >
            {/* Status indicator or brand tag */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: accent }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: accent }} />
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-zinc-300 truncate">
                {d?.statusBadge || (profile.displayName ? `@${profile.slug || profile.displayName}` : "LinkForge")}
              </span>
            </div>

            {/* Quick Actions: Audio, vCard Contact, Share */}
            <div className="flex items-center gap-1.5 shrink-0">
              {d?.audioFeedback && (
                <button
                  type="button"
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    playClick();
                  }}
                  title={soundEnabled ? "Mute tactile click sounds" : "Enable tactile click sounds"}
                  className="p-1.5 rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-white transition-all text-xs"
                >
                  {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-violet-400" /> : <VolumeX className="h-3.5 w-3.5" />}
                </button>
              )}

              {(d?.showSaveContact ?? true) && (
                <button
                  type="button"
                  onClick={downloadVCard}
                  title="Save contact card (vCard)"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition-all text-xs font-medium"
                >
                  <UserPlus className="h-3.5 w-3.5 text-violet-400" />
                  <span className="hidden sm:inline">Save Contact</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShareModalOpen(true);
                }}
                title="View QR Code"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition-all text-xs font-medium"
              >
                <QrCode className="h-3.5 w-3.5 text-violet-400" />
                <span className="hidden sm:inline">QR Code</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                title="Share profile"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition-all text-xs font-medium"
              >
                <Share2 className="h-3.5 w-3.5 text-violet-400" />
                <span>Share</span>
              </button>
            </div>
          </header>
        )}

        {/* Desktop Card Wrapper: provides structure and eliminates empty void on desktop */}
        <div
          className={`w-full flex flex-col items-center transition-all ${
            !isBento
              ? "sm:rounded-3xl sm:border sm:border-white/10 sm:bg-white/[0.02] sm:p-7 sm:shadow-2xl sm:backdrop-blur-xl"
              : ""
          }`}
        >
        {/* Avatar + identity with optional customizable aura halo ring */}
        <div className="relative">
          {showAura && (
            <div
              className={`absolute ${auraInset} opacity-85 transition-all`}
              style={{
                background: auraBackground,
                borderRadius: auraRadius,
                filter: `blur(${auraBlurPx})`,
                animation: auraAnimation,
              }}
            />
          )}
          <div
            className={`relative h-24 w-24 sm:h-28 sm:w-28 overflow-hidden border-2 z-10 transition-all ${avatarShapeClass}`}
            style={{ borderColor: accent, boxShadow: `0 0 40px ${accent}44` }}
          >
            {profile.avatarUrl ? (
               
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-3xl font-bold"
                style={{ background: v.surface, color: accent }}
              >
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <h1
          className={`mt-4 sm:mt-5 text-center text-2xl sm:text-3xl tracking-tight transition-all ${fontWeightClass}`}
          style={{
            fontSize: fontScale !== 1 ? `calc(1.5rem * ${fontScale})` : undefined,
            textTransform: textTransform as React.CSSProperties["textTransform"],
            textShadow: isGradientName ? undefined : textShadowStyle,
            color: isGradientName ? undefined : (effectiveNameColor || v.text),
          }}
        >
          {nameAnim === "typing-scramble" ? (
            <span
              className={isGradientName ? "inline-block font-mono tracking-wider" : "font-mono tracking-wider"}
              style={isGradientName ? {
                backgroundImage: nameBgGradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent",
              } : {
                color: effectiveNameColor || accent,
              }}
            >
              {scrambleText}
            </span>
          ) : isTypingAnim ? (
            <span className="inline-flex items-center justify-center">
              {isTerminalTyping && (
                <span className="opacity-70 font-mono text-emerald-400 select-none mr-1.5 font-bold text-[0.9em]">
                  $ 
                </span>
              )}
              <span
                className={isGradientName ? "inline-block" : ""}
                style={isGradientName ? {
                  backgroundImage: nameBgGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                } : {
                  color: isTerminalTyping ? "#10b981" : (effectiveNameColor || v.text),
                }}
              >
                {currentTargetText.slice(0, typedCount)}
              </span>
              {(d?.typewriterCursor || (isTerminalTyping ? "block" : "bar")) === "block" ? (
                <span
                  className="inline-block ml-1 px-1 rounded-[2px] font-mono text-[0.75em] leading-none align-middle animate-[blink_0.8s_infinite]"
                  style={{ backgroundColor: isTerminalTyping ? "#10b981" : accent, color: "#000" }}
                >
                  █
                </span>
              ) : (d?.typewriterCursor || (isTerminalTyping ? "block" : "bar")) === "underscore" ? (
                <span
                  className="inline-block ml-0.5 w-[0.55em] h-[3px] align-baseline animate-[blink_0.8s_infinite]"
                  style={{ backgroundColor: accent }}
                />
              ) : (
                <span
                  className="inline-block ml-1 w-[2.5px] h-[0.9em] align-middle rounded-sm animate-[blink_0.9s_infinite]"
                  style={{ backgroundColor: accent }}
                />
              )}
            </span>
          ) : nameAnim === "glitch" ? (
            <span
              className="inline-block"
              style={{
                animation: "glitch 2.5s infinite",
                color: effectiveNameColor || accent,
              }}
            >
              {profile.displayName}
            </span>
          ) : nameAnim === "bounce" ? (
            <span
              className="inline-block"
              style={{
                animation: "bounceSubtle 2s ease-in-out infinite",
                ...(isGradientName ? {
                  backgroundImage: nameBgGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                } : {
                  color: effectiveNameColor || v.text,
                }),
              }}
            >
              {profile.displayName}
            </span>
          ) : isGradientName ? (
            <span
              className="inline-block"
              style={{
                backgroundImage: nameBgGradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent",
                ...(nameAnim === "gradient-flow"
                  ? {
                      backgroundSize: "200% auto",
                      animation: "gradientFlow 4s ease infinite",
                    }
                  : {}),
              }}
            >
              {profile.displayName}
            </span>
          ) : nameAnim === "neon-pulse" ? (
            <span
              className="inline-block"
              style={{
                animation: "neonBreathe 3s ease-in-out infinite",
                color: effectiveNameColor || accent,
              }}
            >
              {profile.displayName}
            </span>
          ) : nameAnim === "shimmer" ? (
            <span
              className="inline-block"
              style={{
                backgroundImage: `linear-gradient(90deg, ${effectiveNameColor || "#ffffff"} 0%, ${accent} 50%, ${effectiveNameColor || "#ffffff"} 100%)`,
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent",
                animation: "shimmer 2.5s infinite",
              }}
            >
              {profile.displayName}
            </span>
          ) : nameAnim === "float" ? (
            <span
              className="inline-block"
              style={{
                animation: "float 3s ease-in-out infinite",
                color: effectiveNameColor || v.text,
              }}
            >
              {profile.displayName}
            </span>
          ) : (
            <span>{profile.displayName}</span>
          )}
        </h1>
        {profile.bio ? (
          <p className="mt-2 max-w-md text-center text-sm sm:text-base leading-relaxed transition-all" style={{ color: effectiveBioColor }}>
            {profile.bio}
          </p>
        ) : null}

        {/* 🟢 Optional Creator Status Pill Badge */}
        {d?.statusBadge && (
          <div
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium border backdrop-blur-md transition-all shadow-sm"
            style={{
              borderColor: `${accent}40`,
              background: `${accent}15`,
              color: accent,
            }}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: accent }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: accent }} />
            </span>
            <span>{d.statusBadge}</span>
          </div>
        )}


        {/* ✍️ Daily Blog / Journal Link */}
        {profile.slug ? (
          <a
            href={`/${profile.slug}/blog`}
            className="mt-3.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all hover:scale-105"
            style={{
              borderColor: `${accent}35`,
              background: `${accent}12`,
              color: accent,
            }}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Read Daily Blog</span>
            <span className="text-[10px] opacity-70">→</span>
          </a>
        ) : null}

        {/* 🔍 Search Bar & Category Filter Tabs */}
        {(showSearchBar || showCategoryTabs) && (
          <div className="w-full mt-6 space-y-3">
            {/* Search Input */}
            {showSearchBar && (
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search links, articles, projects..."
                  className="w-full rounded-2xl border border-white/10 bg-black/40 pl-10 pr-9 py-2.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-400/50 backdrop-blur-md transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 text-xs px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Category Filter Pills */}
            {showCategoryTabs && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categories.map((cat) => {
                  const isCatActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        playClick();
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                        isCatActive
                          ? "border-violet-400/70 bg-violet-500/20 text-white shadow-sm"
                          : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-[10px] opacity-70">({cat.count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Links Container */}
        <div
          className={
            isBento
              ? "mt-8 sm:mt-10 grid w-full auto-rows-[minmax(84px,auto)] grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
              : "mt-8 sm:mt-10 flex w-full flex-col gap-3 sm:gap-3.5"
          }
        >
          {filteredLinks.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <p className="text-xs text-zinc-500">No links found matching your search.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  playClick();
                }}
                className="mt-3 text-xs font-semibold text-violet-400 hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}
          {filteredLinks.map((link, idx) => {
            // ── Section Divider / Category Header Card ───────────────────
            if (link.type === "header" || link.type === "section" || link.title.startsWith("---")) {
              const cleanTitle = link.title.replace(/^-+\s*/, "").replace(/\s*-+$/, "");
              return (
                <div key={link.id} className="col-span-full pt-6 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="h-[1px] flex-1 bg-white/10" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      {cleanTitle}
                    </h3>
                    <span className="h-[1px] flex-1 bg-white/10" />
                  </div>
                </div>
              );
            }

            const mediaType = detectMediaType(link);
            const entranceClass =
              d?.entranceAnimation === "pop"
                ? "animate-in zoom-in-95 duration-300"
                : d?.entranceAnimation === "slide"
                  ? "animate-in slide-in-from-bottom-2 duration-300"
                  : d?.entranceAnimation === "fade"
                    ? "animate-in fade-in duration-300"
                    : "";
            const attentionClass =
              d?.attentionEffect === "pulse"
                ? "animate-pulse-subtle"
                : "";
            const isShimmer = d?.attentionEffect === "shimmer";

            const activeHoverClass = d?.cardHover3D ? "" : hoverClass;
            return (
              <div
                key={link.id}
                className={`group relative overflow-hidden flex flex-col justify-center border p-4 ${activeHoverClass} ${spanClass(link.size)} ${entranceClass} ${attentionClass}`}
                style={{
                  ...cardStyleFor(false),
                  animationDelay: `${idx * staggerMs}ms`,
                  transformStyle: d?.cardHover3D ? "preserve-3d" : undefined,
                  willChange: d?.cardHover3D ? "transform" : undefined,
                }}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardStyleFor(true))}
                onMouseMove={(e) => {
                  if (!d?.cardHover3D) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / rect.width - 0.5;
                  const y = (e.clientY - rect.top) / rect.height - 0.5;
                  e.currentTarget.style.transition = "transform 60ms ease-out";
                  e.currentTarget.style.transform = `perspective(800px) rotateX(${-y * 14}deg) rotateY(${x * 14}deg) translateZ(8px)`;
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, cardStyleFor(false));
                  if (d?.cardHover3D) {
                    e.currentTarget.style.transition = transitionValue;
                    e.currentTarget.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
                  }
                }}
              >
                {isShimmer && (
                  <div
                    className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  />
                )}
                {/* 1. Optional Custom Cover / Thumbnail */}
                {link.thumbnailUrl && mediaType !== "image" && (
                  <div className="mb-3 overflow-hidden rounded-xl border border-white/10 max-h-48 w-full bg-black/30">
                    { }
                    <img
                      src={link.thumbnailUrl}
                      alt={link.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* 2. Top Title Row (Clickable) */}
                {/* 📱 WhatsApp — special green CTA card */}
                {link.type === "whatsapp" ? (
                  <a
                    href={hrefFor(link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5"
                    style={{ color: "#25D366" }}
                  >
                    <span
                      className="flex shrink-0 items-center justify-center rounded-xl border"
                      style={{ width: iconBox, height: iconBox, borderColor: "#25D36640", background: "#25D36615" }}
                    >
                      {linkIcon(link, undefined, iconSize)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-sm">{link.title}</p>
                      {link.description && <p className="mt-0.5 text-xs opacity-60">{link.description}</p>}
                    </div>
                    <span className="rounded-full bg-[#25D366] px-3 py-1 text-xs font-bold text-white">Message</span>
                  </a>
                ) : link.type === "upi" ? (
                  /* 💳 UPI — India payment CTA with In-Bio Drawer trigger */
                  <button
                    type="button"
                    onClick={() => openDigitalCheckout(link)}
                    className="flex items-center gap-3.5 w-full text-left cursor-pointer"
                    style={{ color: "#097939" }}
                  >
                    <span
                      className="flex shrink-0 items-center justify-center rounded-xl border"
                      style={{ width: iconBox, height: iconBox, borderColor: "#09793940", background: "#09793915" }}
                    >
                      {linkIcon(link, undefined, iconSize)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-sm">{link.title}</p>
                      {link.description && <p className="mt-0.5 text-xs opacity-60">{link.description}</p>}
                    </div>
                    <span className="rounded-full bg-[#097939] px-3 py-1 text-xs font-bold text-white shadow-sm">Pay via UPI</span>
                  </button>
                ) : link.type === "phone" ? (
                  /* 📞 Phone — click-to-call + copy */
                  <div className="flex items-center gap-3.5">
                    <span
                      className="flex shrink-0 items-center justify-center rounded-xl border"
                      style={{ width: iconBox, height: iconBox, borderColor: v.border, color: accent, background: v.surface }}
                    >
                      {linkIcon(link, undefined, iconSize)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-sm" style={{ color: effectiveLinkTextColor || v.text }}>{link.title}</p>
                      {link.description && <p className="mt-0.5 text-xs" style={{ color: v.muted }}>{link.description}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={hrefFor(link)}
                        target={trackClicks ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold border transition-colors"
                        style={{ borderColor: v.border, color: accent }}
                      >Call</a>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(link.url.replace(/^tel:/, ""))}
                        className="rounded-lg px-2 py-1 text-xs border transition-colors"
                        style={{ borderColor: v.border, color: v.muted }}
                        title="Copy number"
                      >📋</button>
                    </div>
                  </div>
                ) : link.type === "email" ? (
                  /* ✉️ Email — click-to-copy */
                  <div className="flex items-center gap-3.5">
                    <span
                      className="flex shrink-0 items-center justify-center rounded-xl border"
                      style={{ width: iconBox, height: iconBox, borderColor: v.border, color: accent, background: v.surface }}
                    >
                      {linkIcon(link, undefined, iconSize)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-sm" style={{ color: effectiveLinkTextColor || v.text }}>{link.title}</p>
                      {link.description && <p className="mt-0.5 text-xs" style={{ color: v.muted }}>{link.description}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={hrefFor(link)}
                        target={trackClicks ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold border transition-colors"
                        style={{ borderColor: v.border, color: accent }}
                      >Mail</a>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(link.url.replace(/^mailto:/, ""))}
                        className="rounded-lg px-2 py-1 text-xs border transition-colors"
                        style={{ borderColor: v.border, color: v.muted }}
                        title="Copy email"
                      >📋</button>
                    </div>
                  </div>
                ) : link.type === "course" || link.type === "playlist" ? (
                  /* 🎓 Course & Playlist Lesson Card with In-Bio Curriculum Drawer */
                  <div
                    onClick={() => openDigitalCheckout(link)}
                    className="flex items-center gap-3.5 cursor-pointer w-full text-left"
                  >
                    <span
                      className="flex shrink-0 items-center justify-center rounded-xl border"
                      style={{
                        width: iconBox,
                        height: iconBox,
                        borderColor: "#8b5cf640",
                        color: "#a78bfa",
                        background: "#8b5cf615",
                      }}
                    >
                      <Play className="h-4 w-4 fill-current" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-sm" style={{ color: v.text }}>
                          {link.title}
                        </p>
                        <span className="rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-300 border border-violet-500/30">
                          {link.description?.includes("Modules") ? "CURRICULUM" : "LESSON"}
                        </span>
                      </div>
                      {link.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs" style={{ color: v.muted }}>
                          {link.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDigitalCheckout(link);
                      }}
                      className="rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white shadow-sm shrink-0 hover:bg-violet-500 transition-colors"
                    >
                      {link.description?.includes("Modules") ? "Curriculum" : "View"}
                    </button>
                  </div>
                ) : link.type === "product" || link.type === "lead_magnet" ? (
                  /* 🛍️ Digital Store & Lead Magnet Card with 1-Tap Checkout Drawer */
                  <div
                    onClick={() => openDigitalCheckout(link)}
                    className="flex items-center gap-3.5 cursor-pointer w-full text-left"
                  >
                    <span
                      className="flex shrink-0 items-center justify-center rounded-xl border"
                      style={{
                        width: iconBox,
                        height: iconBox,
                        borderColor: "#d946ef40",
                        color: "#e879f9",
                        background: "#d946ef15",
                      }}
                    >
                      {link.type === "lead_magnet" ? <Download className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-sm" style={{ color: effectiveLinkTextColor || v.text }}>
                          {link.title}
                        </p>
                        <span className="rounded-md bg-fuchsia-500/20 px-1.5 py-0.5 text-[10px] font-bold text-fuchsia-300 border border-fuchsia-500/30">
                          {link.type === "lead_magnet" ? "FREEBIE" : "STORE"}
                        </span>
                      </div>
                      {link.description && (
                        <p className="mt-0.5 truncate text-xs" style={{ color: v.muted }}>
                          {link.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDigitalCheckout(link);
                      }}
                      className="rounded-full bg-fuchsia-600 px-3 py-1 text-xs font-bold text-white shadow-sm shrink-0 hover:bg-fuchsia-500 transition-colors"
                    >
                      {link.title.toLowerCase().includes("free") ? "Download" : "Get Now"}
                    </button>
                  </div>
                ) : link.type === "countdown" ? (
                  /* ⏳ Interactive Live Ticking Launch / Event Countdown Timer Card */
                  <CountdownCard
                    link={link}
                    accent={accent}
                    textColor={v.text}
                    mutedColor={v.muted}
                    iconBox={iconBox}
                    onOpen={() => {
                      if (link.url && link.url !== "#") {
                        if (trackClicks) {
                          window.open(hrefFor(link), "_blank");
                        } else {
                          window.open(link.url, "_blank");
                        }
                      }
                    }}
                  />
                ) : link.type === "contact" ? (
                  /* 📬 Direct Business Inquiry & Contact Card */
                  <div
                    onClick={() => openDigitalCheckout(link)}
                    className="flex items-center gap-3.5 cursor-pointer w-full text-left"
                  >
                    <span
                      className="flex shrink-0 items-center justify-center rounded-xl border"
                      style={{
                        width: iconBox,
                        height: iconBox,
                        borderColor: "#8b5cf640",
                        color: "#a78bfa",
                        background: "#8b5cf615",
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-sm" style={{ color: v.text }}>
                          {link.title}
                        </p>
                        <span className="rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-300 border border-violet-500/30">
                          INQUIRY
                        </span>
                      </div>
                      {link.description && (
                        <p className="mt-0.5 truncate text-xs" style={{ color: v.muted }}>
                          {link.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDigitalCheckout(link);
                      }}
                      className="rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white shadow-sm shrink-0 hover:bg-violet-500 transition-colors"
                    >
                      Contact
                    </button>
                  </div>
                ) : link.type === "cal" ? (
                  /* 📅 Calendly / Cal.com Meeting Booking Card */
                  <div
                    onClick={() => openDigitalCheckout(link)}
                    className="flex items-center gap-3.5 cursor-pointer w-full text-left"
                  >
                    <span
                      className="flex shrink-0 items-center justify-center rounded-xl border"
                      style={{
                        width: iconBox,
                        height: iconBox,
                        borderColor: "#0284c740",
                        color: "#38bdf8",
                        background: "#0284c715",
                      }}
                    >
                      <Calendar className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-sm" style={{ color: v.text }}>
                          {link.title}
                        </p>
                        <span className="rounded-md bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-500/30">
                          1:1 CALL
                        </span>
                      </div>
                      {link.description && (
                        <p className="mt-0.5 truncate text-xs" style={{ color: v.muted }}>
                          {link.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDigitalCheckout(link);
                      }}
                      className="rounded-full bg-sky-600 px-3 py-1 text-xs font-bold text-white shadow-sm shrink-0 hover:bg-sky-500 transition-colors"
                    >
                      Book
                    </button>
                  </div>
                ) : link.type === "substack" ? (
                  /* 📰 Substack / Medium Newsletter Card */
                  <a
                    href={hrefFor(link)}
                    target={trackClicks ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5"
                  >
                    <span
                      className="flex shrink-0 items-center justify-center rounded-xl border"
                      style={{
                        width: iconBox,
                        height: iconBox,
                        borderColor: "#ea580c40",
                        color: "#fb923c",
                        background: "#ea580c15",
                      }}
                    >
                      <BrandIcon id="substack" className="h-4 w-4 text-[#FF6719]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-sm" style={{ color: v.text }}>
                          {link.title}
                        </p>
                        <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                          NEWSLETTER
                        </span>
                      </div>
                      {link.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: v.muted }}>
                          {link.description}
                        </p>
                      )}
                    </div>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-zinc-200 border border-white/15 shrink-0">
                      Read
                    </span>
                  </a>
                ) : link.type === "discord" || link.type === "telegram" || link.type === "twitch" ? (
                  /* 💬 Community Social Card */
                  <a
                    href={hrefFor(link)}
                    target={trackClicks ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5"
                  >
                    <span
                      className="flex shrink-0 items-center justify-center rounded-xl border"
                      style={{
                        width: iconBox,
                        height: iconBox,
                        borderColor: link.type === "discord" ? "#5865F240" : link.type === "telegram" ? "#26A5E440" : "#9146FF40",
                        background: link.type === "discord" ? "#5865F215" : link.type === "telegram" ? "#26A5E415" : "#9146FF15",
                      }}
                    >
                      <BrandIcon id={link.type} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-sm" style={{ color: v.text }}>
                          {link.title}
                        </p>
                        <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 border border-white/15 uppercase">
                          {link.type}
                        </span>
                      </div>
                      {link.description && (
                        <p className="mt-0.5 truncate text-xs" style={{ color: v.muted }}>
                          {link.description}
                        </p>
                      )}
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm shrink-0"
                      style={{
                        background: link.type === "discord" ? "#5865F2" : link.type === "telegram" ? "#26A5E4" : "#9146FF",
                      }}
                    >
                      Join
                    </span>
                  </a>
                ) : (
                <a
                  href={hrefFor(link)}
                  target={trackClicks ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="flex items-center gap-3.5"
                >
                  <span
                    className="flex shrink-0 items-center justify-center rounded-xl border"
                    style={{
                      width: iconBox,
                      height: iconBox,
                      borderColor: iconBorderForCard(effectiveLinkIconColor),
                      color: effectiveLinkIconColor,
                      background: iconBgForCard(effectiveLinkIconColor),
                    }}
                  >
                    {linkIcon(link, undefined, iconSize)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`truncate font-semibold ${link.size === "feature" ? "text-lg" : "text-sm"}`}
                        style={{
                          color: effectiveLinkTextColor || v.text,
                          ...(fontScale !== 1
                            ? {
                                fontSize: `calc(${link.size === "feature" ? "1.125rem" : "0.875rem"} * ${fontScale})`,
                              }
                            : null),
                        }}
                      >
                        {link.title}
                      </p>
                      {/* 📌 Pinned badge */}
                      {link.isPinned && (
                        <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-300 border border-amber-500/30">
                          ★ FEATURED
                        </span>
                      )}
                      {/* Media Format Badges */}
                      {mediaType === "video" && (
                        <span className="rounded-md bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-purple-300 border border-purple-500/30">
                          VIDEO
                        </span>
                      )}
                      {mediaType === "audio" && (
                        <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-300 border border-emerald-500/30">
                          AUDIO
                        </span>
                      )}
                      {mediaType === "pdf" && (
                        <span className="rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-red-300 border border-red-500/30">
                          PDF
                        </span>
                      )}
                      {mediaType === "markdown" && (
                        <span className="rounded-md bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-sky-300 border border-sky-500/30">
                          DOC
                        </span>
                      )}
                      {mediaType === "image" && (
                        <span className="rounded-md bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-teal-300 border border-teal-500/30">
                          IMAGE
                        </span>
                      )}
                    </div>
                    {link.description ? (
                      <p className="mt-0.5 line-clamp-2 text-xs" style={{ color: v.muted }}>
                        {link.description}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className="text-xs opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-80"
                    style={{ color: accent }}
                  >
                    →
                  </span>
                </a>
                )}

                {/* 3. In-App Rich Media Player / Cover / Reader */}
                {/* VIDEO PLAYER */}
                {mediaType === "video" && (
                  <div
                    className="relative mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-lg group/vid"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <video
                      src={link.url}
                      controls
                      playsInline
                      preload="metadata"
                      poster={link.thumbnailUrl || undefined}
                      className="w-full max-h-[360px] object-contain bg-black"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveModal({ type: "video", url: link.url, title: link.title });
                      }}
                      className="absolute top-2 right-2 rounded-lg bg-black/75 px-2 py-1 text-[11px] font-medium text-white/90 hover:bg-black/95 hover:text-white border border-white/15 transition-all flex items-center gap-1 cursor-pointer backdrop-blur-sm"
                      title="Fullscreen Cinema Mode"
                    >
                      <Maximize2 className="h-3 w-3" /> Fullscreen
                    </button>
                  </div>
                )}

                {/* AUDIO PLAYER */}
                {mediaType === "audio" && (
                  <div
                    className="mt-3 flex flex-col gap-2 rounded-xl border border-white/10 bg-black/40 p-3 shadow-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                        <Music className="h-3.5 w-3.5" /> In-App Player
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveModal({ type: "audio", url: link.url, title: link.title });
                        }}
                        className="rounded-lg bg-white/5 px-2 py-1 text-[11px] text-zinc-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Fullscreen Audio Player"
                      >
                        <Maximize2 className="h-3 w-3" /> Fullscreen
                      </button>
                    </div>
                    <audio
                      src={link.url}
                      controls
                      preload="metadata"
                      className="w-full h-10 accent-violet-400"
                    />
                  </div>
                )}

                {/* IMAGE COVER THUMBNAIL */}
                {mediaType === "image" && (
                  <div
                    className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/30 group/img relative cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveModal({ type: "image", url: link.url, title: link.title });
                    }}
                  >
                    { }
                    <img
                      src={link.url}
                      alt={link.title}
                      loading="lazy"
                      className="w-full max-h-72 object-cover transition-transform duration-300 group-hover/img:scale-105"
                    />
                    <div className="absolute bottom-2 right-2 rounded-lg bg-black/75 px-2 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm pointer-events-none flex items-center gap-1">
                      <Maximize2 className="h-3 w-3" /> Click to view
                    </div>
                  </div>
                )}

                {/* PDF DOCUMENT CARD */}
                {mediaType === "pdf" && (
                  <div
                    className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 p-2.5"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <FileText className="h-4 w-4 text-red-400" />
                      <span>PDF Document</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveModal({ type: "pdf", url: link.url, title: link.title });
                        }}
                        className="rounded-lg bg-violet-600/30 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-600/50 border border-violet-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <BookOpen className="h-3.5 w-3.5" /> Read in App
                      </button>
                      <a
                        href={link.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-white/5 p-1.5 text-xs text-zinc-400 hover:text-white border border-white/10 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                )}

                {/* MARKDOWN / DOC READER CARD */}
                {(mediaType === "markdown" || mediaType === "doc") && (
                  <div
                    className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 p-2.5"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <FileCode className="h-4 w-4 text-sky-400" />
                      <span>{mediaType === "markdown" ? "Markdown Document" : "Text Document"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveModal({ type: mediaType, url: link.url, title: link.title });
                        }}
                        className="rounded-lg bg-sky-600/30 px-3 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-600/50 border border-sky-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <BookOpen className="h-3.5 w-3.5" /> Read in App
                      </button>
                      <a
                        href={link.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-white/5 p-1.5 text-xs text-zinc-400 hover:text-white border border-white/10 transition-colors"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                )}

                {/* 4. Embedded YouTube / Spotify */}
                <Embed link={link} />
              </div>
            );
          })}
          {active.length === 0 ? (
            <p className="text-center text-sm" style={{ color: v.muted }}>
              No links published yet.
            </p>
          ) : null}
        </div>

        {/* Footer Slot (Newsletter + Share Dock) */}
        {footerSlot ? <div key="bio-renderer-footer-slot-wrapper" className="w-full">{footerSlot}</div> : null}


        {/* Footer badge */}
        <a
          href="/"
          className="mt-8 mb-4 inline-flex items-center gap-1.5 text-[11px] font-medium opacity-60 transition-opacity hover:opacity-100"
          style={{ color: v.muted }}
        >
          <span
            className="inline-block h-3.5 w-3.5 rounded-sm"
            style={{ background: `linear-gradient(135deg, ${accent}, transparent)` }}
          />
          Made with LinkForge
        </a>
        </div>
      </div>

      {/* 🌟 IN-APP MEDIA VIEWER MODAL */}
      {activeModal ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-2xl border border-white/15 bg-zinc-950 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/5">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="shrink-0 text-violet-400">
                  {activeModal.type === "pdf" && <FileText className="h-4 w-4 text-red-400" />}
                  {activeModal.type === "markdown" && <FileCode className="h-4 w-4 text-sky-400" />}
                  {activeModal.type === "image" && <ImageIcon className="h-4 w-4 text-emerald-400" />}
                  {activeModal.type === "video" && <Film className="h-4 w-4 text-purple-400" />}
                  {activeModal.type === "doc" && <FileText className="h-4 w-4 text-amber-400" />}
                </span>
                <span className="truncate text-sm font-semibold text-white">
                  {activeModal.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="rounded-lg bg-white/5 p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Direct Download / External Open"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="rounded-lg bg-white/5 p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 bg-black/40">
              {activeModal.type === "pdf" && (
                <iframe
                  src={activeModal.url}
                  title={activeModal.title}
                  className="h-[75vh] w-full rounded-xl border border-white/10 bg-white"
                />
              )}
              {activeModal.type === "image" && (
                <div className="flex h-full min-h-[50vh] items-center justify-center">
                  { }
                  <img
                    src={activeModal.url}
                    alt={activeModal.title}
                    className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl"
                  />
                </div>
              )}
              {activeModal.type === "video" && (
                <div className="flex h-full min-h-[50vh] items-center justify-center">
                  <video
                    src={activeModal.url}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[75vh] w-full rounded-xl bg-black shadow-2xl"
                  />
                </div>
              )}
              {activeModal.type === "audio" && (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-2xl animate-pulse">
                    <Music className="h-12 w-12" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white max-w-md">
                    {activeModal.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400">Audio playback in app</p>
                  <div className="mt-6 w-full max-w-md">
                    <audio
                      src={activeModal.url}
                      controls
                      autoPlay
                      className="w-full h-12 accent-emerald-400"
                    />
                  </div>
                </div>
              )}
              {(activeModal.type === "markdown" || activeModal.type === "doc") && (
                <div className="mx-auto max-w-2xl">
                  {loadingDoc ? (
                    <div className="flex h-40 items-center justify-center text-sm text-zinc-400">
                      Loading document…
                    </div>
                  ) : docContent ? (
                    <MarkdownReader content={docContent} />
                  ) : (
                    <div className="text-center text-sm text-zinc-400">
                      Unable to render content directly. Please use the download button above.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* 🚀 Share & QR Code Modal */}
      {shareModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShareModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-zinc-950 p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-violet-400" />
                Share Profile
              </h3>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile URL Copy Bar */}
            <div className="flex items-center gap-2 p-2 rounded-xl border border-white/10 bg-zinc-900">
              <input
                type="text"
                readOnly
                value={typeof window !== "undefined" ? window.location.href : `https://linkforge-demo.vercel.app/${profile.slug || ""}`}
                className="flex-1 bg-transparent text-xs text-zinc-300 font-mono outline-none truncate"
              />
              <button
                type="button"
                onClick={() => {
                  const url = typeof window !== "undefined" ? window.location.href : `https://linkforge-demo.vercel.app/${profile.slug || ""}`;
                  navigator.clipboard.writeText(url);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                  playClick();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition-all shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* QR Code Studio */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-black shadow-inner space-y-2.5">
              { }
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  typeof window !== "undefined" ? window.location.href : `https://linkforge-demo.vercel.app/${profile.slug || ""}`
                )}`}
                alt="Profile QR Code"
                width={160}
                height={160}
                className="rounded-lg shadow-sm"
              />
              <div className="flex items-center justify-between w-full pt-1">
                <p className="text-[11px] font-medium text-zinc-600">Scan to open on mobile</p>
                <button
                  type="button"
                  onClick={() => {
                    const currentUrl = typeof window !== "undefined" ? window.location.href : `https://linkforge-demo.vercel.app/${profile.slug || ""}`;
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&format=png&data=${encodeURIComponent(currentUrl)}`;
                    fetch(qrUrl)
                      .then((res) => res.blob())
                      .then((blob) => {
                        const blobUrl = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = blobUrl;
                        a.download = `${profile.slug || "linkforge"}-qr.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(blobUrl);
                      })
                      .catch(() => {
                        window.open(qrUrl, "_blank");
                      });
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:text-violet-900 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download PNG</span>
                </button>
              </div>
            </div>

            {/* 1-Click Social Shares */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${profile.displayName}'s bio: ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 text-center text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:text-emerald-300 transition-all"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(`Check out ${profile.displayName}'s bio on LinkForge:`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 text-center text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:bg-sky-500/20 hover:border-sky-500/40 hover:text-sky-300 transition-all"
                >
                  Telegram
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${profile.displayName}'s bio:`)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 text-center text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  X / Twitter
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 text-center text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:bg-blue-500/20 hover:border-blue-500/40 hover:text-blue-300 transition-all"
                >
                  LinkedIn
                </a>
              </div>

              {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.share({
                        title: `${profile.displayName} | LinkForge`,
                        text: profile.bio || `Check out ${profile.displayName}'s official bio`,
                        url: typeof window !== "undefined" ? window.location.href : "",
                      });
                    } catch {}
                  }}
                  className="w-full py-2 text-center text-xs font-semibold rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>More Sharing Options (System Sheet)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🛍️ In-Bio 1-Tap Digital Checkout & Lead Magnet Drawer */}
      <DigitalCheckoutDrawer
        item={checkoutItem}
        slug={profile.slug || ""}
        displayName={profile.displayName || "Creator"}
        onClose={() => setCheckoutItem(null)}
        accentColor={accent}
        globalUpiId={profile.upiId ?? undefined}
      />
    </div>
  );
}
