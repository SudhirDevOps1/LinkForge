// 🖼️ Dynamic OG Image — har bio page ka auto-generated social card
import { ImageResponse } from "next/og";
import { getBioBySlug } from "@/lib/queries";
import { getTheme } from "@/lib/themes";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Ctx = { params: Promise<{ slug: string }> };

export default async function OgImage({ params }: Ctx) {
  const { slug } = await params;
  const bio = await getBioBySlug(slug);
  const theme = getTheme(bio?.profile.theme ?? "midnight");
  const name = bio?.profile.displayName ?? "LinkForge";
  const bioText = bio?.profile.bio ?? "One link. Every platform. Zero lock-in.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: theme.swatch[0],
          color: theme.vars.text,
          fontFamily: "sans-serif",
          padding: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: theme.vars.surface,
            border: `3px solid ${theme.swatch[2]}`,
            fontSize: 56,
            fontWeight: 700,
            color: theme.swatch[2],
          }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, marginTop: 32 }}>{name}</div>
        <div
          style={{
            fontSize: 28,
            marginTop: 16,
            color: theme.vars.muted,
            maxWidth: 800,
            textAlign: "center",
          }}
        >
          {bioText.slice(0, 90)}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 48,
            fontSize: 24,
            color: theme.swatch[2],
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${theme.swatch[2]}, transparent)`,
            }}
          />
          LinkForge
        </div>
      </div>
    ),
    size,
  );
}
