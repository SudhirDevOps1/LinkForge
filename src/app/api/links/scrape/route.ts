// 🔍 /api/links/scrape — Scrapes OpenGraph metadata, title, description, and images
import { ApiError, assertSameOrigin, guardRateLimit, handle, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";

// SSRF safety check to block loopback and private networks
function isSafeUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".lan") ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0" ||
      hostname === "169.254.169.254" // AWS/Cloud metadata
    ) {
      return false;
    }

    // IP address checks for private subnets
    const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
    if (ipv4Match) {
      const b0 = Number.parseInt(ipv4Match[1], 10);
      const b1 = Number.parseInt(ipv4Match[2], 10);
      if (b0 === 10) return false; // 10.0.0.0/8
      if (b0 === 127) return false; // 127.0.0.0/8
      if (b0 === 172 && b1 >= 16 && b1 <= 31) return false; // 172.16.0.0/12
      if (b0 === 192 && b1 === 168) return false; // 192.168.0.0/16
      if (b0 === 169 && b1 === 254) return false; // 169.254.0.0/16
      if (b0 === 0) return false;
    }

    return true;
  } catch {
    return false;
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function resolveUrl(relativeOrAbsolute: string | null | undefined, baseUrl: string): string | null {
  if (!relativeOrAbsolute) return null;
  const clean = relativeOrAbsolute.trim();
  if (!clean || clean.startsWith("data:") || clean.startsWith("javascript:")) return null;
  try {
    return new URL(clean, baseUrl).href;
  } catch {
    return null;
  }
}

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await guardRateLimit(req, "links:scrape", 60);
  const { profile } = await requireUser();
  if (!profile) throw new ApiError(404, "Profile not found");

  const body = (await req.json().catch(() => ({}))) as { url?: string };
  const targetUrl = body.url?.trim();
  if (!targetUrl) throw new ApiError(400, "URL is required");

  if (!isSafeUrl(targetUrl)) {
    throw new ApiError(400, "Invalid or unsafe URL");
  }

  const parsed = new URL(targetUrl);
  const hostname = parsed.hostname.toLowerCase();

  // 1. 🐙 GitHub Platform Optimization
  if (hostname === "github.com" || hostname.endsWith(".github.com")) {
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const [owner, repo] = parts;
      const ogImage = `https://opengraph.githubassets.com/1/${owner}/${repo}`;
      return json({
        url: targetUrl,
        title: `${owner}/${repo}`,
        description: `GitHub repository by ${owner}`,
        thumbnailUrl: ogImage,
        siteName: "GitHub",
        favicon: "https://github.githubassets.com/favicons/favicon.svg",
        detectedType: "link",
        detectedIcon: "github",
      });
    }
    if (parts.length === 1) {
      const [user] = parts;
      const avatar = `https://avatars.githubusercontent.com/${user}`;
      return json({
        url: targetUrl,
        title: user,
        description: `GitHub profile of ${user}`,
        thumbnailUrl: avatar,
        siteName: "GitHub",
        favicon: "https://github.githubassets.com/favicons/favicon.svg",
        detectedType: "link",
        detectedIcon: "github",
      });
    }
  }

  // 2. 📺 YouTube Video & Shorts Optimization
  if (
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com") ||
    hostname === "youtu.be"
  ) {
    let videoId: string | null = null;
    if (hostname === "youtu.be") {
      videoId = parsed.pathname.replace(/^\//, "").split("/")[0] || null;
    } else if (parsed.pathname.startsWith("/shorts/")) {
      videoId = parsed.pathname.replace("/shorts/", "").split("/")[0] || null;
    } else if (parsed.pathname.startsWith("/watch")) {
      videoId = parsed.searchParams.get("v");
    }

    if (videoId) {
      let title = "YouTube Video";
      let author = "YouTube Creator";
      let thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (oembedRes.ok) {
          const data = (await oembedRes.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
          if (data.title) title = data.title;
          if (data.author_name) author = data.author_name;
          if (data.thumbnail_url) thumbnail = data.thumbnail_url;
        }
      } catch {
        // Fallback to defaults
      }

      return json({
        url: targetUrl,
        title,
        description: `Video by ${author}`,
        thumbnailUrl: thumbnail,
        siteName: "YouTube",
        favicon: "https://www.youtube.com/s/desktop/favicon.ico",
        detectedType: "youtube",
        detectedIcon: "youtube",
      });
    }
  }

  // 3. 🎵 Spotify Embed & OEmbed
  if (hostname === "open.spotify.com") {
    try {
      const oembedRes = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(targetUrl)}`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (oembedRes.ok) {
        const data = (await oembedRes.json()) as { title?: string; thumbnail_url?: string };
        return json({
          url: targetUrl,
          title: data.title || "Spotify Track",
          description: "Listen on Spotify",
          thumbnailUrl: data.thumbnail_url || null,
          siteName: "Spotify",
          favicon: "https://open.spotifycdn.com/cdn/images/favicon.0f31d2ea.ico",
          detectedType: "spotify",
          detectedIcon: "spotify",
        });
      }
    } catch {
      // Fall through to generic scraper
    }
  }

  // 4. 🌐 Generic Webpage HTML Metadata Scraper
  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (compatible; LinkForge-Bot/1.0; +https://linkforge.dev)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return json({
        url: targetUrl,
        title: hostname.replace(/^www\./, ""),
        description: "",
        thumbnailUrl: null,
        siteName: hostname.replace(/^www\./, ""),
        favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
        detectedType: "link",
        detectedIcon: "link",
      });
    }

    const html = await res.text();

    // Regex extraction for speed and zero heavy dependencies
    const ogTitle =
      /<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i.exec(html)?.[1] ||
      /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:title["']/i.exec(html)?.[1] ||
      /<meta\s+(?:property|name)=["']twitter:title["']\s+content=["']([^"']+)["']/i.exec(html)?.[1] ||
      /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1];

    const ogDesc =
      /<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']+)["']/i.exec(html)?.[1] ||
      /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:description["']/i.exec(html)?.[1] ||
      /<meta\s+(?:property|name)=["']twitter:description["']\s+content=["']([^"']+)["']/i.exec(html)?.[1] ||
      /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i.exec(html)?.[1];

    const ogImage =
      /<meta\s+(?:property|name)=["']og:image:secure_url["']\s+content=["']([^"']+)["']/i.exec(html)?.[1] ||
      /<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i.exec(html)?.[1] ||
      /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i.exec(html)?.[1] ||
      /<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i.exec(html)?.[1] ||
      /<meta\s+(?:property|name)=["']twitter:image:src["']\s+content=["']([^"']+)["']/i.exec(html)?.[1] ||
      /<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/i.exec(html)?.[1];

    const ogSiteName =
      /<meta\s+(?:property|name)=["']og:site_name["']\s+content=["']([^"']+)["']/i.exec(html)?.[1] ||
      /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:site_name["']/i.exec(html)?.[1];

    const iconHref =
      /<link\s+[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i.exec(html)?.[1] ||
      /<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i.exec(html)?.[1] ||
      /<link\s+[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i.exec(html)?.[1];

    const cleanTitle = ogTitle ? decodeHtmlEntities(ogTitle).slice(0, 120) : hostname.replace(/^www\./, "");
    const cleanDesc = ogDesc ? decodeHtmlEntities(ogDesc).slice(0, 200) : "";
    const cleanImage = resolveUrl(ogImage, targetUrl);
    const cleanFavicon = resolveUrl(iconHref, targetUrl) || `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    const cleanSiteName = ogSiteName ? decodeHtmlEntities(ogSiteName) : hostname.replace(/^www\./, "");

    // Platform detection for brand icons
    let detectedIcon = "link";
    let detectedType = "link";
    if (hostname.includes("instagram.com")) {
      detectedIcon = "instagram";
      detectedType = "instagram";
    } else if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      detectedIcon = "twitter";
      detectedType = "x";
    } else if (hostname.includes("linkedin.com")) {
      detectedIcon = "linkedin";
    } else if (hostname.includes("facebook.com")) {
      detectedIcon = "facebook";
    } else if (hostname.includes("telegram") || hostname.includes("t.me")) {
      detectedIcon = "telegram";
      detectedType = "telegram";
    } else if (hostname.includes("discord.com") || hostname.includes("discord.gg")) {
      detectedIcon = "discord";
      detectedType = "discord";
    } else if (hostname.includes("twitch.tv")) {
      detectedIcon = "twitch";
      detectedType = "twitch";
    } else if (hostname.includes("substack.com")) {
      detectedIcon = "substack";
      detectedType = "substack";
    } else if (hostname.includes("medium.com")) {
      detectedIcon = "medium";
    } else if (hostname.includes("reddit.com")) {
      detectedIcon = "reddit";
    } else if (hostname.includes("figma.com")) {
      detectedIcon = "figma";
    }

    return json({
      url: targetUrl,
      title: cleanTitle,
      description: cleanDesc,
      thumbnailUrl: cleanImage,
      siteName: cleanSiteName,
      favicon: cleanFavicon,
      detectedType,
      detectedIcon,
    });
  } catch (scrapeErr) {
    // If external site blocks or times out, return basic hostname metadata safely
    return json({
      url: targetUrl,
      title: hostname.replace(/^www\./, ""),
      description: "",
      thumbnailUrl: null,
      siteName: hostname.replace(/^www\./, ""),
      favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
      detectedType: "link",
      detectedIcon: "link",
      warning: (scrapeErr as Error).message,
    });
  }
});
