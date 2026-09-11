"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Cloud,
  Database,
  HardDrive,
  ShieldCheck,
  Webhook,
  Copy,
  Check,
  Search,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Lock,
  Zap,
  FileCode,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";

type DocTab = "deployments" | "webhooks" | "troubleshooting" | "database" | "security" | "monetization";

const GAS_CODE = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    
    // Auto-create styled headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp (UTC)",
        "Event Type",
        "Profile Username",
        "Subscriber / Click Details",
        "Link Title",
        "Destination URL",
        "Referrer",
        "Device Type"
      ]);
      sheet.getRange("A1:H1").setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }
    
    var event = payload.event || "unknown";
    var data = payload.data || {};
    var timestamp = payload.timestamp || new Date().toISOString();
    
    sheet.appendRow([
      timestamp,
      event,
      payload.profileUsername || data.username || "",
      data.email || data.subscriberEmail || data.title || "",
      data.title || "",
      data.url || "",
      data.referrer || "direct",
      data.device || "desktop"
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", received: true, event: event }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

const DISCORD_PAYLOAD_EXAMPLE = `// LinkForge automatically formats payload for Discord Webhook:
{
  "content": "🎉 **New Subscriber Joined!**\\n👤 **Profile:** @alex_creator\\n📧 **Email:** visitor@example.com\\n🕒 **Time:** 2026-09-11 14:32 UTC"
}`;

const SLACK_PAYLOAD_EXAMPLE = `// LinkForge automatically formats payload for Slack Incoming Webhook:
{
  "text": "⚡ *New Link Click Event* on @alex_creator: 'My Premium Course' (14 clicks today)"
}`;

const TROUBLESHOOTING_DATA = [
  {
    id: "db-relation-missing",
    category: "database",
    title: "relation 'subscribers' does not exist / relation 'profiles' does not exist",
    severity: "high",
    symptom: "500 Internal Server Error when loading bio page or signing up on freshly deployed Neon/Supabase database.",
    cause: "PostgreSQL database was created, but Drizzle database schema tables have not been pushed yet.",
    solution: "Run 'npm run db:push' in your terminal, or visit any page on LinkForge — our built-in autoMigrate() engine will automatically detect and create all 21 tables without data loss.",
    command: "npm run db:push\\n# For Turso / SQLite:\\nnpm run db:push:turso\\n# For Cloudflare D1:\\nnpm run db:push:d1",
  },
  {
    id: "db-missing-columns",
    category: "database",
    title: "column 'meta_pixel_id' does not exist (React Minified Error #441)",
    severity: "high",
    symptom: "Dashboard crashes or returns HTTP 500 when saving appearance, tracking pixels, or monetization settings.",
    cause: "Database was provisioned on an earlier version before the monetization & analytics migration was applied.",
    solution: "LinkForge contains an automated self-healing schema patch in 'src/db/auto-migrate.ts'. It runs 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS' dynamically on server boot. Re-run 'npm run db:push' or trigger any API request.",
    command: "npm run db:push",
  },
  {
    id: "db-neon-timeout",
    category: "database",
    title: "Neon connection timeout / terminating connection due to administrator command",
    severity: "medium",
    symptom: "Database query errors after 5+ minutes of inactivity, cold-start latency on Vercel.",
    cause: "Neon scales down serverless instances to 0 compute after 5 minutes of idle time. Direct connections fail during cold wakeup.",
    solution: "Use Neon's pooled connection string with '-pooler' in the hostname and '?sslmode=require'. This routes queries via Neon's persistent connection pooler.",
    command: "DATABASE_URL=postgresql://user:pass@ep-cool-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
  },
  {
    id: "auth-mx-dns",
    category: "auth",
    title: "Email domain '...' has no mail exchange (MX) servers configured",
    severity: "medium",
    symptom: "Registration or newsletter subscription fails with an MX server validation error message.",
    cause: "Zero-trust input protection: The user entered an email on a domain that does not exist or has no active mail server (e.g. test.com, duku.com, example.com).",
    solution: "This is LinkForge's automated fake-account defense! Only real domains with valid DNS MX records can create accounts or join subscriber lists. Test with a real email (@gmail.com, @outlook.com, @company.com).",
    command: "dig mx yourdomain.com +short",
  },
  {
    id: "auth-csrf-origin",
    category: "auth",
    title: "Origin header missing — request must originate from the browser (403 Forbidden)",
    severity: "medium",
    symptom: "POST/PATCH/DELETE requests fail when invoked from external scripts, curl, or misconfigured reverse proxy.",
    cause: "LinkForge enforces RFC 6454 CSRF boundary verification to protect user sessions from cross-site request forgery.",
    solution: "Ensure NEXT_PUBLIC_APP_URL matches your deployment domain exactly (including https://). For external automation or API integrations, use API Bearer token keys (/api/v1/*) instead of session cookies.",
    command: "NEXT_PUBLIC_APP_URL=https://your-custom-domain.com",
  },
  {
    id: "auth-altcha-pow",
    category: "auth",
    title: "Security verification failed. Please complete the challenge (ALTCHA)",
    severity: "medium",
    symptom: "Login, signup, or newsletter submission returns 400 Bad Request with anti-bot challenge failure.",
    cause: "Proof-of-Work token was expired, replayed, or generated with a mismatched HMAC secret key.",
    solution: "Ensure ALTCHA_HMAC_KEY is defined in your environment variables. In local development, verify your system clock is synchronized (PoW tokens expire after 5 minutes).",
    command: "ALTCHA_HMAC_KEY=lf_altcha_secret_random_64_characters",
  },
  {
    id: "webhook-gas-302",
    category: "webhook",
    title: "Webhook test returns 'HTTP 302 Redirect Blocked' or fails to trigger",
    severity: "high",
    symptom: "Google Apps Script webhook test in Settings fails or stops delivery.",
    cause: "Google Apps Script web apps return a 302 redirect to 'script.googleusercontent.com' upon receiving POST payloads. Standard fetch tools fail SSRF checks on redirects.",
    solution: "LinkForge's outbound safeFetch engine automatically detects Google Apps Script URLs and follows safe 302 redirects with IP safety checks. Use the 'Test Webhook' button in Settings to verify live round-trip latency.",
    command: "// LinkForge handles this natively in src/lib/outbound.ts with followSafeRedirects: true",
  },
  {
    id: "webhook-gas-401",
    category: "webhook",
    title: "Google Sheet not updating / Webhook returns HTTP 401 or Google Login HTML",
    severity: "high",
    symptom: "Google Sheets receives 0 rows. LinkForge test returns HTTP 401 or response is an HTML sign-in page.",
    cause: "When deploying the Apps Script Web App, 'Who has access' was set to 'Only myself' instead of 'Anyone'.",
    solution: "In Google Sheets: Click Extensions > Apps Script > Deploy > Manage deployments > Edit > Set 'Who has access' to 'Anyone' (NOT 'Only myself' or 'Anyone with Google account') > Click Deploy.",
    command: "1. Google Sheets -> Extensions -> Apps Script\\n2. Deploy -> Manage deployments\\n3. Set 'Who has access' to 'Anyone'\\n4. Click Deploy and copy the fresh /exec URL",
  },
  {
    id: "deploy-vercel-size",
    category: "deploy",
    title: "Vercel Serverless Function size exceeds 250MB limit",
    severity: "medium",
    symptom: "Deployment fails on Vercel during the 'Collecting build traces' step with bundle size error.",
    cause: "Large Node.js dev packages or local upload directories were bundled into the Next.js serverless build.",
    solution: "LinkForge has built-in outputFileTracingExcludes in next.config.ts for uploads, @swc, and @esbuild, reducing serverless function bundles to under 35MB.",
    command: "// next.config.ts is already configured with:\\noutputFileTracingExcludes: { '**/*': ['./uploads/**/*', './node_modules/@swc/**/*'] }",
  },
  {
    id: "deploy-cloudflare-pg",
    category: "deploy",
    title: "Could not resolve 'pg-cloudflare' on Cloudflare Pages / OpenNext",
    severity: "medium",
    symptom: "Cloudflare build errors out when compiling pg driver for edge workers.",
    cause: "OpenNext requires explicit tracing rules for Cloudflare worker socket drivers.",
    solution: "Pre-configured in next.config.ts via outputFileTracingIncludes. When deploying to Cloudflare, recommend using D1 (Cloudflare native database) with 'DATABASE_PROVIDER=d1'.",
    command: "npx opennextjs-cloudflare build\\nnpx wrangler pages deploy",
  },
  {
    id: "storage-b2-cors",
    category: "storage",
    title: "Browser direct PUT upload to Backblaze B2 / Cloudflare R2 fails with CORS error",
    severity: "medium",
    symptom: "Avatar or banner upload progress bar stalls or console logs 'Access-Control-Allow-Origin missing'.",
    cause: "The S3 bucket does not have CORS rules allowing HTTP PUT requests from your custom domain.",
    solution: "Add a CORS rule in your B2 or R2 bucket dashboard allowing Allowed Origins: '*', Allowed Methods: ['PUT', 'GET'], Allowed Headers: ['*'].",
    command: `[
  {
    "corsRuleName": "linkforgeUploads",
    "allowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
    "allowedOperations": ["s3_put", "s3_get"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]`,
  },
  {
    id: "rate-limit-429",
    category: "security",
    title: "HTTP 429 Too Many Requests (Rate Limit Exceeded)",
    severity: "low",
    symptom: "Visitor receives 'Too many requests from this IP' or 'Too many subscribe attempts'.",
    cause: "LinkForge's dual-bucket sliding window rate limiter prevents brute-force attacks and newsletter inbox bombing (max 10 subscribe attempts per 10 minutes per IP).",
    solution: "Wait 10 minutes for the sliding window to reset, or configure higher thresholds in 'src/lib/rate-limit.ts' for enterprise staging environments.",
    command: "# Rate limiter stores active buckets in memory (or Upstash Redis if configured)",
  }
];

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<DocTab>("deployments");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [expandedTrouble, setExpandedTrouble] = useState<string | null>("db-relation-missing");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2200);
  };

  const filteredTroubles = TROUBLESHOOTING_DATA.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.symptom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.cause.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.solution.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-ink-950 text-zinc-100 selection:bg-violet-500/30">
      {/* Background ambient lighting */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[140px]" />
        <div className="absolute top-[30rem] -right-32 h-96 w-96 rounded-full bg-cyan-600/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-white/10 bg-zinc-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <span className="text-zinc-700">|</span>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30">
                <BookOpen className="h-4 w-4" />
              </span>
              <span className="font-display font-bold text-sm tracking-tight text-white">LinkForge Docs & Knowledge Base</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/SudhirDevOps1/LinkForge"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5 text-violet-400" />
              GitHub Repository
            </a>
          </div>
        </div>
      </header>

      {/* Hero & Search Banner */}
      <div className="relative z-10 border-b border-white/5 bg-white/[0.01] px-5 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-medium text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            Complete Production, Deployment & Troubleshooting Manual
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Everything you need to <span className="text-gradient">build, deploy & fix</span> LinkForge.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Official step-by-step guides for multi-cloud deployments (Vercel, Cloudflare, Netlify, Docker), Google Apps Script webhooks, 21-table database setup, and solutions for every potential error.
          </p>

          {/* Search Bar */}
          <div className="relative mx-auto mt-8 max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides, errors (e.g. 'relation does not exist', 'vercel', 'apps script', 'mx dns')..."
              className="w-full rounded-2xl border border-white/15 bg-zinc-900/90 py-3.5 pl-11 pr-4 text-sm text-zinc-100 placeholder-zinc-500 shadow-2xl backdrop-blur-md outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-10">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
          {[
            { id: "deployments" as const, label: "☁️ Multi-Cloud Deploy", icon: Cloud },
            { id: "webhooks" as const, label: "🪝 Webhooks & Sheets", icon: Webhook },
            { id: "troubleshooting" as const, label: "🛠️ Error Troubleshooting", icon: AlertTriangle, badge: "12 Fixes" },
            { id: "database" as const, label: "🗄️ Database & Storage", icon: Database },
            { id: "security" as const, label: "🔐 Zero-Trust Security", icon: ShieldCheck },
            { id: "monetization" as const, label: "💳 UPI & Monetization", icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-violet-600 text-white shadow-[0_0_24px_rgba(139,92,246,.4)]"
                    : "border border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/15 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-violet-500/20 text-violet-300"}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Multi-Cloud Deployments */}
        {activeTab === "deployments" && (
          <div className="mt-8 space-y-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Cloud className="h-5 w-5 text-violet-400" />
                Multi-Cloud Architecture & 1-Click Setup
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                LinkForge is designed with a universal driver architecture. The same code runs across Vercel, Cloudflare, Netlify, Railway, Render, or Docker with zero code changes.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Vercel Guide */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 space-y-4 hover:border-violet-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black border border-white/20 text-white font-bold text-lg">
                      ▲
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Vercel (Recommended)</h3>
                      <p className="text-xs text-zinc-400">Serverless Node.js + Neon Postgres + Backblaze B2</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                    Tier 1 Support
                  </span>
                </div>

                <div className="space-y-2 text-xs text-zinc-300">
                  <p><strong>1. Environment Variables:</strong> Set in Vercel Project Settings:</p>
                  <pre className="rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto">
{`DATABASE_PROVIDER=neon
DATABASE_URL=postgresql://user:pass@ep-...-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=your_random_32_character_secret
BETTER_AUTH_URL=https://your-custom-domain.com
STORAGE_PROVIDER=b2 # or vercel-blob
B2_APPLICATION_KEY_ID=...
B2_APPLICATION_KEY=...
B2_BUCKET_NAME=linkforge-uploads
B2_BUCKET_ENDPOINT=https://s3.us-west-004.backblazeb2.com`}
                  </pre>
                  <p><strong>2. Deploy Command:</strong></p>
                  <div className="relative">
                    <pre className="rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-violet-300">
                      npm i -g vercel && vercel --prod
                    </pre>
                    <button
                      onClick={() => copyToClipboard("npm i -g vercel && vercel --prod", "vercel-cmd")}
                      className="absolute right-2 top-2 rounded-lg border border-white/10 bg-white/5 p-1.5 text-zinc-400 hover:text-white"
                    >
                      {copiedSnippet === "vercel-cmd" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="text-zinc-500">
                    * Auto-migration runs on the first request. All 21 database tables are automatically initialized.
                  </p>
                </div>
              </div>

              {/* Cloudflare Pages Guide */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 space-y-4 hover:border-violet-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 font-bold text-lg">
                      ⚡
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Cloudflare Pages & Workers</h3>
                      <p className="text-xs text-zinc-400">OpenNext + Cloudflare D1 + Cloudflare R2 (Zero Egress Fees)</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-400 border border-cyan-500/20">
                    Zero Egress
                  </span>
                </div>

                <div className="space-y-2 text-xs text-zinc-300">
                  <p><strong>1. Prerequisites:</strong> Ensure wrangler and opennextjs are installed:</p>
                  <pre className="rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto">
{`npm i -D @opennextjs/cloudflare wrangler
# Setup D1 Database in Cloudflare Dashboard:
npx wrangler d1 create linkforge-db`}
                  </pre>
                  <p><strong>2. Build & Deploy:</strong></p>
                  <div className="relative">
                    <pre className="rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-violet-300">
                      npx opennextjs-cloudflare build && npx wrangler pages deploy
                    </pre>
                    <button
                      onClick={() => copyToClipboard("npx opennextjs-cloudflare build && npx wrangler pages deploy", "cf-cmd")}
                      className="absolute right-2 top-2 rounded-lg border border-white/10 bg-white/5 p-1.5 text-zinc-400 hover:text-white"
                    >
                      {copiedSnippet === "cf-cmd" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="text-zinc-500">
                    * Set DATABASE_PROVIDER=d1 and STORAGE_PROVIDER=r2 for 100% Cloudflare-native stack.
                  </p>
                </div>
              </div>

              {/* Docker Self-Hosted Guide */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 space-y-4 hover:border-violet-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-lg">
                      🐳
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Docker Compose (Self-Hosted)</h3>
                      <p className="text-xs text-zinc-400">All-in-one container with local PostgreSQL + Healthcheck</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                    Sovereign
                  </span>
                </div>

                <div className="space-y-2 text-xs text-zinc-300">
                  <p><strong>1. One-line Launch:</strong></p>
                  <div className="relative">
                    <pre className="rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-violet-300">
                      docker compose up -d
                    </pre>
                    <button
                      onClick={() => copyToClipboard("docker compose up -d", "docker-cmd")}
                      className="absolute right-2 top-2 rounded-lg border border-white/10 bg-white/5 p-1.5 text-zinc-400 hover:text-white"
                    >
                      {copiedSnippet === "docker-cmd" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p><strong>2. Dev Mailcatcher profile (optional for testing emails):</strong></p>
                  <pre className="rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-zinc-300">
                    docker compose --profile mail up -d
                  </pre>
                  <p className="text-zinc-500">
                    * App runs on port 3000, Postgres on 5432 with persistent volume mounts.
                  </p>
                </div>
              </div>

              {/* Railway & Netlify */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 space-y-4 hover:border-violet-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 font-bold text-lg">
                      🚂
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Railway & Netlify</h3>
                      <p className="text-xs text-zinc-400">Continuous deployment from GitHub with automatic build detection</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-400 border border-purple-500/20">
                    PaaS
                  </span>
                </div>

                <div className="space-y-2 text-xs text-zinc-300">
                  <p><strong>Netlify CLI:</strong></p>
                  <pre className="rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-violet-300">
                    netlify login && netlify init && netlify deploy --prod
                  </pre>
                  <p><strong>Railway:</strong> Connect GitHub repo, add PostgreSQL service, Railway auto-injects DATABASE_URL.</p>
                  <p className="text-zinc-500">
                    * Pre-configured netlify.toml and railway profiles are included in the repo root.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Webhooks & Google Sheets */}
        {activeTab === "webhooks" && (
          <div className="mt-8 space-y-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Webhook className="h-5 w-5 text-violet-400" />
                Google Apps Script (GAS) & Webhook Integration Manual
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Kab, kaise, aur kyu use karein? Har click event aur new subscriber email ko automatically Google Sheets, Discord, ya Slack mein bina kisi external paid tool (jaise Zapier) ke sync karein.
              </p>
            </div>

            {/* Why & When */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-bold mb-2">1</div>
                <h4 className="text-sm font-semibold text-white">Kyu use karein?</h4>
                <p className="mt-1 text-xs text-zinc-400">
                  Har visitor ka email aur link click direct aapke personal Google Sheet mein real-time record ho jata hai. Free lead collection bina database load ke.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 font-bold mb-2">2</div>
                <h4 className="text-sm font-semibold text-white">Kab trigger hota hai?</h4>
                <p className="mt-1 text-xs text-zinc-400">
                  (1) Jab koi aapke page par newsletter subscribe kare. (2) Jab koi aapke links par click kare. (3) Jab Settings se "Test Webhook" button click karein.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 font-bold mb-2">3</div>
                <h4 className="text-sm font-semibold text-white">Kaise verify karein?</h4>
                <p className="mt-1 text-xs text-zinc-400">
                  Dashboard ➔ Settings ➔ Webhooks mein URL enter karein aur <strong>"Test Webhook"</strong> dabayein. Hamara engine real HTTP status aur round-trip latency verify karta hai.
                </p>
              </div>
            </div>

            {/* Step by Step Setup */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCode className="h-4 w-4 text-violet-400" />
                Step-by-Step Google Apps Script Setup (100% Free & Copy-Paste)
              </h3>

              <div className="space-y-4 text-xs text-zinc-300">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white font-bold text-xs">1</span>
                  <p className="pt-0.5">
                    Ek new Google Sheet open karein: <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-violet-400 underline">sheets.new</a>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white font-bold text-xs">2</span>
                  <p className="pt-0.5">
                    Top menu se click karein: <strong>Extensions ➔ Apps Script</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white font-bold text-xs">3</span>
                  <div className="w-full space-y-2">
                    <p className="pt-0.5">Editor mein jo pehle se code hai usko delete karke niche diya gaya code paste karein:</p>
                    <div className="relative">
                      <pre className="rounded-xl border border-white/10 bg-black/80 p-4 font-mono text-[11px] text-zinc-200 overflow-x-auto max-h-80">
                        {GAS_CODE}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(GAS_CODE, "gas-code")}
                        className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white"
                      >
                        {copiedSnippet === "gas-code" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedSnippet === "gas-code" ? "Copied!" : "Copy Code"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white font-bold text-xs">4</span>
                  <div className="space-y-1">
                    <p className="pt-0.5">
                      Top right mein <strong>Deploy ➔ New deployment</strong> par click karein.
                    </p>
                    <p className="text-zinc-400">
                      Select type: <strong>Web app</strong>.
                    </p>
                    <p className="text-zinc-400">
                      Execute as: <strong>Me</strong>.
                    </p>
                    <p className="text-amber-400 font-semibold bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      ⚠️ CRITICAL STEP: Set "Who has access" to "Anyone". Agar aap "Only myself" karenge to Google login mangega aur webhook fail ho jayega!
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white font-bold text-xs">5</span>
                  <p className="pt-0.5">
                    Generated Web App URL (<code className="text-violet-300">https://script.google.com/macros/s/.../exec</code>) copy karein aur LinkForge Dashboard ➔ Settings ➔ Webhook URL field mein daal kar <strong>"Save & Test"</strong> karein!
                  </p>
                </div>
              </div>
            </div>

            {/* Discord & Slack Payloads */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-3">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" /> Discord Channel Alerts
                </h4>
                <p className="text-xs text-zinc-400">
                  Discord Server Settings ➔ Integrations ➔ Webhooks se URL copy karke LinkForge Settings mein paste karein. LinkForge auto-formats Discord markdown embeds:
                </p>
                <pre className="rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                  {DISCORD_PAYLOAD_EXAMPLE}
                </pre>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-3">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Slack Channel Alerts
                </h4>
                <p className="text-xs text-zinc-400">
                  Slack App Incoming Webhooks URL enter karein. New subscriber alerts aur milestone click counts instant deliver hote hain:
                </p>
                <pre className="rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                  {SLACK_PAYLOAD_EXAMPLE}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Error Troubleshooting (Exhaustive Table & Accordion) */}
        {activeTab === "troubleshooting" && (
          <div className="mt-8 space-y-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    Exhaustive Error Resolution & Troubleshooting Manual
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Every deployment, database, authentication, DNS MX check, and webhook error documented with exact root cause and 1-minute fix.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
                  Showing {filteredTroubles.length} of {TROUBLESHOOTING_DATA.length} issues
                </div>
              </div>
            </div>

            {/* Error cards */}
            <div className="space-y-4">
              {filteredTroubles.map((issue) => {
                const isExpanded = expandedTrouble === issue.id;
                return (
                  <div
                    key={issue.id}
                    className={`rounded-2xl border transition-all ${
                      isExpanded
                        ? "border-violet-500/40 bg-zinc-900/80 shadow-[0_0_30px_rgba(139,92,246,.15)]"
                        : "border-white/10 bg-zinc-900/40 hover:border-white/20"
                    }`}
                  >
                    <button
                      onClick={() => setExpandedTrouble(isExpanded ? null : issue.id)}
                      className="flex w-full items-center justify-between p-5 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                          issue.severity === "high"
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                            : issue.severity === "medium"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                            : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                        }`}>
                          <XCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">{issue.category}</p>
                          <h3 className="text-sm font-bold text-white font-mono">{issue.title}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          issue.severity === "high"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : issue.severity === "medium"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}>
                          {issue.severity}
                        </span>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-white/10 p-5 space-y-4 text-xs">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-white/5 bg-black/40 p-3.5 space-y-1">
                            <p className="font-semibold text-rose-300 flex items-center gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5" /> Symptom
                            </p>
                            <p className="text-zinc-400 leading-relaxed">{issue.symptom}</p>
                          </div>
                          <div className="rounded-xl border border-white/5 bg-black/40 p-3.5 space-y-1">
                            <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                              <HelpCircle className="h-3.5 w-3.5" /> Root Cause
                            </p>
                            <p className="text-zinc-400 leading-relaxed">{issue.cause}</p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 space-y-2">
                          <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Solution & Fix
                          </p>
                          <p className="text-zinc-300 leading-relaxed">{issue.solution}</p>
                        </div>

                        {issue.command && (
                          <div className="space-y-1.5">
                            <p className="font-semibold text-zinc-400">Terminal Command / Code Pattern:</p>
                            <div className="relative">
                              <pre className="rounded-xl border border-white/10 bg-black/80 p-3 font-mono text-[11px] text-violet-300 overflow-x-auto">
                                {issue.command}
                              </pre>
                              <button
                                onClick={() => copyToClipboard(issue.command, `trouble-${issue.id}`)}
                                className="absolute right-2 top-2 rounded-lg border border-white/10 bg-white/5 p-1.5 text-zinc-400 hover:text-white"
                              >
                                {copiedSnippet === `trouble-${issue.id}` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Database & Storage */}
        {activeTab === "database" && (
          <div className="mt-8 space-y-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-violet-400" />
                Universal 21-Table Schema & Object Storage
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                LinkForge uses an abstract Drizzle ORM layer supporting 5 database engines and S3-compliant object storage with zero code rewrites.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-violet-400" /> Supported Databases
                </h3>
                <ul className="space-y-3 text-xs text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-1.5" />
                    <div>
                      <strong>Neon PostgreSQL (Recommended for Vercel):</strong> Serverless HTTP driver with auto-scaling to zero and pooled connections.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-1.5" />
                    <div>
                      <strong>Supabase Postgres:</strong> High-performance managed Postgres with session pooler on port 6543.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-1.5" />
                    <div>
                      <strong>Cloudflare D1:</strong> Edge-native SQLite database distributed across Cloudflare's global edge network.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-1.5" />
                    <div>
                      <strong>Turso libSQL:</strong> Serverless SQLite with embedded replicas worldwide for sub-10ms queries.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-1.5" />
                    <div>
                      <strong>Self-Hosted PostgreSQL / Docker:</strong> Direct pg connection via standard PostgreSQL URI.
                    </div>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-cyan-400" /> S3 Storage Adapters
                </h3>
                <ul className="space-y-3 text-xs text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5" />
                    <div>
                      <strong>Backblaze B2:</strong> 10 GB free cloud storage, S3-compatible, ultra-low pricing for avatars, banners, and blog posts.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5" />
                    <div>
                      <strong>Cloudflare R2:</strong> Zero egress fees across the globe. Seamless integration with Cloudflare Workers.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5" />
                    <div>
                      <strong>AWS S3 & MinIO:</strong> Standard S3 client compatible with enterprise Amazon S3 and self-hosted MinIO clusters.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5" />
                    <div>
                      <strong>Local Storage:</strong> Zero-dependency file storage saved in local uploads/ directory for dev or single-VPS setups.
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Security Model */}
        {activeTab === "security" && (
          <div className="mt-8 space-y-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-violet-400" />
                The 7-Layer Enterprise Security Standard
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                LinkForge applies banking-grade defense mechanisms to protect creator credentials, subscriber lists, and payment information.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-2">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
                  <Lock className="h-4 w-4" /> 1. Zero-Trust API Boundary & MX DNS
                </div>
                <p className="text-xs text-zinc-400">
                  Every user input is strictly validated with Zod schemas. Real-time Google & Cloudflare DNS MX queries ensure disposable fake emails cannot abuse signup or subscription APIs.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-2">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
                  <ShieldAlert className="h-4 w-4" /> 2. IDOR Protection (Ownership Check)
                </div>
                <p className="text-xs text-zinc-400">
                  Database queries strictly match <code className="text-zinc-300">where: and(eq(id, linkId), eq(profileId, userProfile.id))</code> preventing any tenant from reading or updating another creator's resources.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-2">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
                  <Lock className="h-4 w-4" /> 3. AES-256-GCM Database Cipher
                </div>
                <p className="text-xs text-zinc-400">
                  Sensitive creator credentials (UPI IDs, webhook secrets, API keys) are encrypted at rest using AES-256-GCM authenticated encryption. Raw keys never leak to disk.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-2">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
                  <Zap className="h-4 w-4" /> 4. Dual-Bucket Rate Limiting
                </div>
                <p className="text-xs text-zinc-400">
                  Protects sensitive endpoints with two sliding windows: (1) Client IP address bucket, and (2) Target identifier bucket (e.g. slug:email), preventing distributed dictionary attacks.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-2">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
                  <ShieldCheck className="h-4 w-4" /> 5. ALTCHA Proof-of-Work Bot Defense
                </div>
                <p className="text-xs text-zinc-400">
                  Zero cookies, zero Google tracking. Cryptographic PoW puzzles solved transparently by the client CPU prevent automated credential stuffing and bot subscriptions.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-2">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
                  <FileCode className="h-4 w-4" /> 6. Strict CSP & Stored XSS Cleansing
                </div>
                <p className="text-xs text-zinc-400">
                  Strict Content-Security-Policy headers in next.config.ts forbid unsafe eval/scripts. Custom CSS and bio descriptions pass through sanitizeText() and sanitizeCss() stripping javascript: URIs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Monetization */}
        {activeTab === "monetization" && (
          <div className="mt-8 space-y-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-violet-400" />
                0% Platform Commission Monetization & Analytics
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Keep 100% of your earnings. LinkForge charges 0% fees and never sits between you and your customers.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-2">
                <h4 className="font-semibold text-white">Direct UPI Payment QR</h4>
                <p className="text-xs text-zinc-400">
                  Instant money transfer directly into your Indian bank account via Google Pay, PhonePe, Paytm, or BHIM. Zero payment gateway cut.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-2">
                <h4 className="font-semibold text-white">Meta Pixel & Retargeting</h4>
                <p className="text-xs text-zinc-400">
                  Enter your Meta Pixel ID in Dashboard ➔ Retargeting to build high-converting custom audiences for Facebook & Instagram Ads.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-2">
                <h4 className="font-semibold text-white">Google Analytics 4</h4>
                <p className="text-xs text-zinc-400">
                  Enter your GA4 Measurement ID (G-XXXXXX) for seamless enterprise web traffic tracking alongside LinkForge's private DuckDB analytics.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
