import Link from "next/link";
import { 
  BookOpen, 
  ShieldCheck, 
  Database, 
  HardDrive, 
  UploadCloud, 
  Lock, 
  Cloud, 
  Rocket, 
  ShoppingBag,
  FileText
} from "lucide-react";

const DOCS_INDEX = [
  {
    icon: Lock,
    name: "docs/auth.md",
    title: "Enterprise Authentication",
    desc: "Better Auth · WebAuthn Passkeys · TOTP Two-Factor · Multi-Tenant Orgs · Anonymous Trials",
  },
  {
    icon: Database,
    name: "docs/database.md",
    title: "Database Architecture & 21-Table Schema",
    desc: "PostgreSQL · Neon Serverless · Supabase Pooler · Turso libSQL · Cloudflare D1",
  },
  {
    icon: HardDrive,
    name: "docs/storage.md",
    title: "Universal Object Storage",
    desc: "Backblaze B2 (10 GB free) · Cloudflare R2 · AWS S3 · MinIO · Vercel Blob · Local Disk",
  },
  {
    icon: UploadCloud,
    name: "docs/media.md",
    title: "Media Engine & Presigned Uploads",
    desc: "Direct browser-to-bucket PUT · Magic byte verification · Stream proxy & range seeking",
  },
  {
    icon: ShieldCheck,
    name: "docs/security.md",
    title: "Defense-in-Depth Security Model",
    desc: "ALTCHA PoW · Dual-bucket sliding window rate limiting · Constant-time timing defense · db-cipher",
  },
  {
    icon: FileText,
    name: "docs/daily-blog-b2.md",
    title: "Object Storage Daily Blog Engine",
    desc: "Markdown live editor · Zero-DB storage · Dual manifest auto-healing · Instant cache-free delivery",
  },
  {
    icon: ShoppingBag,
    name: "docs/superprofile-monetization.md",
    title: "Creator Monetization Studio",
    desc: "Digital courses · 1:1 consultation calls · Download bundles · 0% fee direct UPI & global tipping",
  },
  {
    icon: Cloud,
    name: "docs/deployment.md",
    title: "Multi-Cloud Deployment",
    desc: "Vercel · Cloudflare Pages · Netlify · Railway · Render · Docker Compose",
  },
  {
    icon: Rocket,
    name: "docs/production.md",
    title: "Production Readiness & Operations",
    desc: "Go-live checklist · Automated backups · Health probes · Zero-downtime migrations",
  },
];

export default function DocsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-14">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Documentation & Architecture</h1>
          <p className="text-xs text-zinc-400">Engineering guides, API references, and infrastructure specifications</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
        Comprehensive configuration guides are located in the <code className="text-zinc-200 bg-white/5 px-1.5 py-0.5 rounded text-xs">docs/</code> directory of the repository.
      </p>

      <div className="mt-8 grid gap-3">
        {DOCS_INDEX.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.name}
              className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-violet-500/30 hover:bg-white/[0.04]"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-300 group-hover:text-violet-400 group-hover:border-violet-500/30">
                <IconComponent className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-zinc-400 leading-normal">{item.desc}</p>
                <p className="mt-2 font-mono text-[11px] text-zinc-500">{item.name}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/[0.06] to-cyan-500/[0.06] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">Full Repository Documentation</p>
        <p className="mt-1 text-xs text-zinc-400">
          Source code, migration SQL scripts, and architectural RFCs are maintained on GitHub:
        </p>
        <div className="mt-3">
          <a
            href="https://github.com/SudhirDevOps1/LinkForge"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs font-medium text-white hover:text-violet-300 underline underline-offset-4"
          >
            github.com/SudhirDevOps1/LinkForge
          </a>
        </div>
      </div>
    </div>
  );
}
