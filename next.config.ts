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
  // Vercel apni file-tracing khud karta hai (standalone + Turbopack par uska
  // onBuildComplete `next-server.js.nft.json` dhoondhta reh jata hai) — isliye
  // Vercel builds par standalone OFF. Dockerfile `.next/standalone` copy karta
  // hai — self-hosting (Docker/Railway/Render) ke liye standalone ON rehta hai.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  // pg-cloudflare workerd shims (dist/esm) ko standalone trace me force karo —
  // warna opennext esbuild pass fail hota hai ("Could not resolve pg-cloudflare",
  // upstream opennextjs-cloudflare#1214). Local/Docker par koi effect nahi.
  outputFileTracingIncludes: {
    "**/*": ["./node_modules/pg-cloudflare/dist/**/*", "./node_modules/pg-cloudflare/esm/**/*"],
  },
  outputFileTracingExcludes: {
    "**/*": [
      "./uploads/**/*",
      "./node_modules/@swc/core-linux-x64-gnu/**/*",
      "./node_modules/@swc/core-linux-x64-musl/**/*",
      "./node_modules/@esbuild/**/*",
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@dnd-kit/core", "@dnd-kit/sortable", "drizzle-orm"],
  },
  // Avatars/logos kisi bhi HTTPS host se aa sakte hain (B2, R2, Supabase, ...)
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [];
  },
};


export default nextConfig;
