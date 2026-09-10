// 📚 Docs index — saare setup guides ek jagah
import Link from "next/link";

const FILES = [
  { name: "docs/auth.md", title: "Auth providers", desc: "builtin (working) · supabase (partial) · clerk/nextauth/neon (501 roadmap)" },
  { name: "docs/database.md", title: "Database providers", desc: "postgres · neon · supabase URL · turso · d1 (experimental)" },
  { name: "docs/storage.md", title: "Storage providers", desc: "local · b2 · r2 · s3 · minio · vercel-blob" },
  { name: "docs/media.md", title: "Media & uploads", desc: "presign → PUT → complete ticket flow, CORS, cleanup" },
  { name: "docs/security.md", title: "Security model", desc: "SSRF guard, CSRF, rate limits, privacy analytics" },
  { name: "docs/deployment.md", title: "Deployment", desc: "vercel · cloudflare · netlify · railway · render · docker" },
  { name: "docs/production.md", title: "Production guide", desc: "checklist, backups, retention, health, platform notes" },
];

export default function DocsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-14">
      <h1 className="text-2xl font-bold">Documentation</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Setup guides are available in the <code>docs/</code> directory of the repository — index below. Video demo:{" "}
        <Link href="/demo" className="underline hover:text-white">
          /demo
        </Link>{" "}
        (real SudhirDevOps1 data).
      </p>
      <ul className="mt-6 space-y-2.5">
        {FILES.map((f) => (
          <li
            key={f.name}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
          >
            <p className="text-sm font-semibold">{f.title}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{f.desc}</p>
            <p className="mt-1 font-mono text-[11px] text-zinc-600">{f.name}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-zinc-600">
        Complete documentation on GitHub:{" "}
        <a
          href="https://github.com/SudhirDevOps1/LinkForge/tree/main/docs"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-white"
        >
          SudhirDevOps1/LinkForge/docs
        </a>
      </p>
    </div>
  );
}
