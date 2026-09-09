"use client";

// =============================================================================
// 🪪 BioRenderer — public bio page renderer
// Themes + layouts (list / bento) + platform embeds (YouTube, Spotify, X, ...)
// Server-component safe (koi hook nahi) — public page, custom domain page aur
// dashboard live preview sab isi ko use karte hain.
// =============================================================================
import type { Link } from "@/db/schema";
import { getTheme } from "@/lib/themes";
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

// ---- Brand icons (inline SVG — zero external dependency) -----------------------
function BrandIcon({ type, className }: { type: string; className?: string }) {
  const cls = className ?? "h-5 w-5";
  switch (type) {
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <path d="M23 7.2s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.4-1C16.6 3.6 12 3.6 12 3.6h0s-4.6 0-7.7.3c-.5.1-1.5.1-2.4 1-.7.7-.9 2.3-.9 2.3S.8 9.1.8 11v1.8c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.9.2 7.6.3 7.6.3s4.6 0 7.7-.4c.5-.1 1.5-.1 2.4-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8V11c0-1.9-.2-3.8-.2-3.8zM9.7 15.1V8.4l6.3 3.4-6.3 3.3z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.3 17.41z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85 0 3.2-.01 3.58-.07 4.85-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85 0-3.2.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.18 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
        </svg>
      );
    case "spotify":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.7 1.32.36.18.48.66.24 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.38-1.32 9.78-.66 13.5 1.62.42.24.6.84.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.1 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.48-1.02.66-1.5.3z" />
        </svg>
      );
    case "github":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <path d="M12 .3a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.49 5.92.43.38.82 1.11.82 2.24v3.32c0 .32.22.7.82.58A12 12 0 0 0 12 .3z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-2.31-2.83V9.31a6.34 6.34 0 1 0 5.76 6.36V8.69a8.16 8.16 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z" />
        </svg>
      );
    default:
      return <Link2 className={cls} />;
  }
}

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

export function linkIcon(link: Pick<Link, "icon" | "type">, className?: string) {
  if (link.icon && link.icon !== "link" && LUCIDE_ICONS[link.icon]) {
    const Icon = LUCIDE_ICONS[link.icon];
    return <Icon className={className ?? "h-5 w-5"} />;
  }
  if (["youtube", "spotify", "x", "instagram", "tiktok", "github"].includes(link.type)) {
    return <BrandIcon type={link.type} className={className} />;
  }
  const Icon = LUCIDE_ICONS[link.icon ?? "link"] ?? Link2;
  return <Icon className={className ?? "h-5 w-5"} />;
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

  const hrefFor = (link: Link) => (trackClicks ? `/r/${link.id}` : link.url);

  const cardStyleFor = (hover = false): React.CSSProperties => ({
    background: hover ? v.surfaceHover : v.surface,
    borderColor: v.border,
    borderRadius: v.radius,
    backdropFilter: v.cardStyle === "glass" ? "blur(14px)" : undefined,
    WebkitBackdropFilter: v.cardStyle === "glass" ? "blur(14px)" : undefined,
    boxShadow:
      v.cardStyle === "shadow" ? `0 10px 34px -12px ${v.accent}55` : undefined,
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
          style={{ borderColor: v.accent, boxShadow: `0 0 40px ${v.accent}44` }}
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
              style={{ background: v.surface, color: v.accent }}
            >
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h1 className="mt-5 text-center text-2xl font-bold tracking-tight">
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
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                  style={{ borderColor: v.border, color: v.accent, background: v.surface }}
                >
                  {linkIcon(link)}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate font-semibold ${link.size === "feature" ? "text-lg" : "text-sm"}`}
                    style={{ color: v.text }}
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
                  style={{ color: v.accent }}
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
            style={{ background: `linear-gradient(135deg, ${v.accent}, transparent)` }}
          />
          Made with LinkForge
        </a>
      </div>
    </div>
  );
}
