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
  BookOpen,
  Calendar,
  Camera,
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
  Music,
  Play,
  ShoppingBag,
  Star,
  Video,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

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

  // Video check
  if (
    link.type === "video" ||
    /\.(mp4|webm|mov|mkv|avi|m4v|ogv)$/i.test(cleanUrl)
  ) {
    return "video";
  }

  // Audio check
  if (
    link.type === "audio" ||
    link.icon === "music" ||
    /\.(mp3|m4a|wav|ogg|aac|flac|wma)$/i.test(cleanUrl)
  ) {
    return "audio";
  }

  // Image check
  if (
    link.type === "image" ||
    link.icon === "camera" ||
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

        {/* Links Container */}
        <div
          className={
            isBento
              ? "mt-9 grid w-full auto-rows-[minmax(84px,auto)] grid-cols-2 gap-3"
              : "mt-9 flex w-full flex-col gap-3"
          }
        >
          {active.map((link) => {
            const mediaType = detectMediaType(link);

            return (
              <div
                key={link.id}
                className={`group flex flex-col justify-center border p-4 transition-all duration-200 hover:-translate-y-0.5 ${spanClass(link.size)}`}
                style={cardStyleFor(false)}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardStyleFor(true))}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyleFor(false))}
              >
                {/* 1. Optional Custom Cover / Thumbnail */}
                {link.thumbnailUrl && mediaType !== "image" && (
                  <div className="mb-3 overflow-hidden rounded-xl border border-white/10 max-h-48 w-full bg-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={link.thumbnailUrl}
                      alt={link.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* 2. Top Title Row (Clickable) */}
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
                      borderColor: v.border,
                      color: accent,
                      background: v.surface,
                    }}
                  >
                    {linkIcon(link, undefined, iconSize)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                  title="Close (Band karein)"
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
    </div>
  );
}
