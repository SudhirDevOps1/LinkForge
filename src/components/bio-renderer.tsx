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
import { BrandIcon, BRAND_IDS } from "./icons";
import {
  AtSign,
  Calendar,
  Camera,
  FileText,
  Globe,
  Heart,
  Link2,
  Mail,
  Music,
  Play,
  ShoppingBag,
  Star,
  Video,
} from "lucide-react";

// ---- Generic lucide icon map ---------------------------------------------------
const LUCIDE_ICONS: Record<string, typeof Globe> = {
  link: Link2,
  globe: Globe,
  mail: Mail,
  calendar: Calendar,
  camera: Camera,
  video: Video,
  music: Music,
  play: Play,
  shop: ShoppingBag,
  star: Star,
  heart: Heart,
  file: FileText,
  at: AtSign,
};

export function linkIcon(
  link: Pick<Link, "icon" | "type">,
  className?: string,
  sizePx?: number,
) {
  const style =
    sizePx && Number.isFinite(sizePx) ? { width: sizePx, height: sizePx } : undefined;
  const cls = sizePx ? undefined : (className ?? "h-5 w-5");
  // 1. Explicit brand icon id (icon picker se — 29 real brands)
  if (link.icon && BRAND_IDS.includes(link.icon)) {
    return <BrandIcon id={link.icon} className={cls} style={style} />;
  }
  // 2. Type-based brand (youtube/spotify/github/...) — purana behavior, ab 29 brands
  if (link.type && BRAND_IDS.includes(link.type)) {
    return <BrandIcon id={link.type} className={cls} style={style} />;
  }
  if (link.icon && link.icon !== "link" && LUCIDE_ICONS[link.icon]) {
    const Icon = LUCIDE_ICONS[link.icon];
    return <Icon className={cls} style={style} />;
  }
  const Icon = LUCIDE_ICONS[link.icon ?? "link"] ?? Link2;
  return <Icon className={cls} style={style} />;
}

// ---- Embeds ---------------------------------------------------------------------
function youtubeId(url: string): string | null {
  const m =
    /(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.exec(url);
  return m?.[1] ?? null;
}

function spotifyEmbedUrl(url: string): string | null {
  const m = /open\.spotify\.com\/(track|album|playlist|episode|show|artist)\/([a-zA-Z0-9]+)/.exec(url);
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0` : null;
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
}

export function BioRenderer({
  profile,
  links,
  trackClicks = true,
}: {
  profile: BioProfileShape;
  links: Link[];
  trackClicks?: boolean;
}) {
  const theme = getTheme(profile.theme);
  const v = theme.vars;
  const active = links.filter((l) => l.isActive);
  const isBento = profile.layout === "bento";

  // Manual custom design — theme vars ke upar override (NULL = theme defaults)
  const accent = profile.design?.accent || v.accent;
  const radius = profile.design?.radiusPx != null ? `${profile.design.radiusPx}px` : v.radius;
  const fontScale = profile.design?.fontScale ?? 1;
  const iconSize = profile.design?.iconSize ?? 20;
  const iconBox = iconSize + 20;

  const hrefFor = (link: Link) => (trackClicks ? `/r/${link.id}` : link.url);

  const cardStyleFor = (hover = false): React.CSSProperties => ({
    background: hover ? v.surfaceHover : v.surface,
    borderColor: v.border,
    borderRadius: radius,
    backdropFilter: v.cardStyle === "glass" ? "blur(14px)" : undefined,
    WebkitBackdropFilter: v.cardStyle === "glass" ? "blur(14px)" : undefined,
    boxShadow:
      v.cardStyle === "shadow" ? `0 10px 34px -12px ${accent}55` : undefined,
  });

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
      className={`theme-font-${v.font} relative min-h-screen w-full overflow-hidden`}
      style={{ background: v.bg, color: v.text }}
    >
      <div className="relative z-[1] mx-auto flex min-h-screen w-full max-w-xl flex-col items-center px-5 py-14">
        {/* Avatar + identity */}
        <div
          className="relative h-24 w-24 overflow-hidden rounded-full border-2"
          style={{ borderColor: accent, boxShadow: `0 0 40px ${accent}44` }}
        >
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
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
        <h1
          className="mt-5 text-center text-2xl font-bold tracking-tight"
          style={fontScale !== 1 ? { fontSize: `calc(1.5rem * ${fontScale})` } : undefined}
        >
          {profile.displayName}
        </h1>
        {profile.bio ? (
          <p className="mt-2 max-w-sm text-center text-sm leading-relaxed" style={{ color: v.muted }}>
            {profile.bio}
          </p>
        ) : null}

        {/* Links */}
        <div
          className={
            isBento
              ? "mt-9 grid w-full auto-rows-[minmax(84px,auto)] grid-cols-2 gap-3"
              : "mt-9 flex w-full flex-col gap-3"
          }
        >
          {active.map((link) => (
            <a
              key={link.id}
              href={hrefFor(link)}
              target={trackClicks ? "_blank" : undefined}
              rel="noopener noreferrer"
              className={`group flex flex-col justify-center border p-4 transition-all duration-200 hover:-translate-y-0.5 ${spanClass(link.size)}`}
              style={cardStyleFor(false)}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardStyleFor(true))}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyleFor(false))}
            >
              <div className="flex items-center gap-3.5">
                <span
                  className="flex shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    width: iconBox,
                    height: iconBox,
                    borderColor: v.border,
                    color: accent,
                    background: v.surface,
                  }}
                >
                  {linkIcon(link, undefined, iconSize)}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate font-semibold ${link.size === "feature" ? "text-lg" : "text-sm"}`}
                    style={{
                      color: v.text,
                      ...(fontScale !== 1
                        ? {
                            fontSize: `calc(${link.size === "feature" ? "1.125rem" : "0.875rem"} * ${fontScale})`,
                          }
                        : null),
                    }}
                  >
                    {link.title}
                  </p>
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
              </div>
              <Embed link={link} />
            </a>
          ))}
          {active.length === 0 ? (
            <p className="text-center text-sm" style={{ color: v.muted }}>
              Abhi koi link publish nahi hua.
            </p>
          ) : null}
        </div>

        {/* Footer badge */}
        <a
          href="/"
          className="mt-14 inline-flex items-center gap-1.5 text-[11px] font-medium opacity-60 transition-opacity hover:opacity-100"
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
  );
}
