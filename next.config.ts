import type { NextConfig } from "next";

// =============================================================================
// ⚙️ next.config — Multi-platform compatible (Vercel / Cloudflare / Netlify /
// Railway / Render / Docker). Helmet-style security headers har route par.
// =============================================================================

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Dockerfile `.next/standalone` copy karta hai — isliye standalone output
  // zaroori hai (Docker/Railway/Render self-hosting ke liye).
  output: "standalone",
  // Avatars/logos kisi bhi HTTPS host se aa sakte hain (B2, R2, Supabase, ...)
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
