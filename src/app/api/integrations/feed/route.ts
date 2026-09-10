// 🔍 /api/integrations/feed — oEmbed / RSS / public metadata inspector
import { z } from "zod";
import { ApiError, guardRateLimit, handle, json, parseOrThrow } from "@/lib/api";
import { requireUser } from "@/lib/auth";

const querySchema = z.object({
  url: z.string().trim().url(),
  type: z.enum(["youtube", "spotify", "rss", "generic"]).optional().default("generic"),
});

export const GET = handle(async (req: Request) => {
  await guardRateLimit(req, "integrations:feed", 30);
  await requireUser();

  const reqUrl = new URL(req.url);
  const { url, type } = parseOrThrow(querySchema, {
    url: reqUrl.searchParams.get("url") ?? "",
    type: (reqUrl.searchParams.get("type") as any) ?? "generic",
  });

  try {
    // 1. YouTube oEmbed
    if (type === "youtube" || url.includes("youtube.com") || url.includes("youtu.be")) {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data = await res.json();
        return json({
          title: data.title,
          author: data.author_name,
          thumbnailUrl: data.thumbnail_url,
          url,
          type: "youtube",
        });
      }
    }

    // 2. Spotify oEmbed
    if (type === "spotify" || url.includes("spotify.com")) {
      const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data = await res.json();
        return json({
          title: data.title,
          thumbnailUrl: data.thumbnail_url,
          url,
          type: "spotify",
        });
      }
    }

    // 3. RSS / Substack / Medium feed
    if (type === "rss" || url.includes("substack.com") || url.includes("medium.com") || url.endsWith("/feed") || url.endsWith(".xml")) {
      let feedUrl = url;
      if (url.includes("substack.com") && !url.includes("/feed")) {
        feedUrl = url.replace(/\/+$/, "") + "/feed";
      }
      if (url.includes("medium.com") && !url.includes("/feed/")) {
        // e.g. medium.com/@username -> medium.com/feed/@username
        const parts = url.split("medium.com/");
        if (parts[1]) feedUrl = `https://medium.com/feed/${parts[1]}`;
      }

      const res = await fetch(feedUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LinkForge/1.0" },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const text = await res.text();
        // Lightweight regex-based XML item parser (zero dependency)
        const items: Array<{ title: string; url: string; description: string; pubDate?: string }> = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
        let match;
        while ((match = itemRegex.exec(text)) !== null && items.length < 15) {
          const itemXml = match[1];
          const titleMatch = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i.exec(itemXml);
          const linkMatch = /<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i.exec(itemXml);
          const descMatch = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i.exec(itemXml);
          const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(itemXml);

          const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
          const itemUrl = linkMatch ? linkMatch[1].trim() : "";
          let desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : "";
          if (desc.length > 180) desc = desc.slice(0, 180) + "...";

          if (title && itemUrl) {
            items.push({
              title,
              url: itemUrl,
              description: desc,
              pubDate: pubDateMatch ? pubDateMatch[1].trim() : undefined,
            });
          }
        }

        if (items.length > 0) {
          return json({ items, feedUrl, type: "rss" });
        }
      }
    }

    // 4. Generic page metadata fallback
    const pageRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 LinkForge-Bot/1.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
      const ogTitle = /<meta property="og:title" content="([^"]+)"/i.exec(html);
      const ogImage = /<meta property="og:image" content="([^"]+)"/i.exec(html);
      const ogDesc = /<meta property="og:description" content="([^"]+)"/i.exec(html);

      return json({
        title: ogTitle?.[1] || titleMatch?.[1] || url,
        description: ogDesc?.[1] || "",
        thumbnailUrl: ogImage?.[1] || null,
        url,
        type: "generic",
      });
    }

    return json({ url, title: url, type: "generic" });
  } catch (err) {
    return json({ url, title: url, error: (err as Error).message });
  }
});
