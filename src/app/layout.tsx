import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600"],
});

/** Empty-string-proof base URL (dashboard me khaali var bhi safe) */
function appBaseUrl(): URL {
  const raw = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/+$/, "");
  try {
    return new URL(raw || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: appBaseUrl(),
  title: {
    default: "LinkForge — Open-source link-in-bio builder. Zero lock-in.",
    template: "%s · LinkForge",
  },
  description:
    "Production-grade link-in-bio builder — deployable on any database (Neon, Turso, D1, Supabase), any cloud (Vercel, Cloudflare, Netlify), and any storage (B2, R2, S3). Free, privacy-first, and fully self-hostable.",
  keywords: [
    "link in bio",
    "creator storefront",
    "bio link builder",
    "open source",
    "self-hosted",
    "multi-cloud",
  ],
  openGraph: {
    type: "website",
    siteName: "LinkForge",
    title: "LinkForge — One link. Every platform. Zero lock-in.",
    description:
      "Advanced open-source link-in-bio builder with multi-database, multi-cloud and multi-storage support.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkForge — One link. Every platform. Zero lock-in.",
    description:
      "Advanced open-source link-in-bio builder with multi-database, multi-cloud and multi-storage support.",
  },
};

export const viewport: Viewport = {
  themeColor: "#050508",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen bg-ink-950 font-sans text-zinc-100 antialiased">
        {children}
        <Toaster theme="dark" richColors closeButton position="top-center" />
      </body>
    </html>
  );
}
