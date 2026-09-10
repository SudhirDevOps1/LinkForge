"use client";

// =============================================================================
// ❓ FAQ accordion — smooth expand/collapse
// =============================================================================
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    q: "Is LinkForge really free?",
    a: "Yes, 100%. LinkForge is open-source under the MIT license. Everything runs seamlessly within standard free tiers for hosting (Vercel/Cloudflare), serverless databases (Neon/Turso/D1), and object storage (Backblaze B2/Cloudflare R2). There are no paywalls, artificial feature gates, or mandatory subscription fees.",
  },
  {
    q: "Where is my data stored?",
    a: "Wherever you decide. Through DATABASE_PROVIDER and STORAGE_PROVIDER environment variables, you can connect Neon, Turso, Cloudflare D1, Supabase, self-hosted Postgres, and storage backends like Backblaze B2, Cloudflare R2, AWS S3, MinIO, or local disk. No third-party ad trackers exist, and raw IP addresses are never logged.",
  },
  {
    q: "Can I migrate from other link-in-bio services?",
    a: "Absolutely. Export your links to JSON or prepare your data, then import it in one click via Settings → Import. You can also export your complete profile and analytics anytime with zero vendor lock-in.",
  },
  {
    q: "Which databases and storage backends are supported?",
    a: "Databases: Neon Postgres, Turso (libSQL), Cloudflare D1, Supabase, and standard PostgreSQL (with Upstash Redis for rate-limiting). Storage: Backblaze B2, Cloudflare R2, AWS S3, MinIO, Vercel Blob, and local disk. Deployment targets include Vercel, Cloudflare Pages, Netlify, Railway, Render, and Docker.",
  },
  {
    q: "How do I connect a custom domain?",
    a: "Add a CNAME record in your DNS provider pointing to your deployment domain (e.g., bio → your-app.vercel.app), register the domain in your hosting dashboard, and save it in LinkForge Settings. Edge middleware handles routing automatically.",
  },
  {
    q: "Do I need coding experience to use LinkForge?",
    a: "Not at all. The intuitive dashboard lets you configure links, courses, digital downloads, appearance, and analytics effortlessly. For developers, a clean REST API, signed webhooks, and full source code access are included out of the box.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className={`glass overflow-hidden rounded-2xl transition-colors duration-300 ${
              isOpen ? "border-violet-400/30" : "hover:border-white/20"
            }`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-display text-sm font-semibold text-white sm:text-base">
                {item.q}
              </span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 transition-transform duration-300 ${
                  isOpen ? "rotate-180 text-violet-300" : "text-zinc-400"
                }`}
              >
                <ChevronDown className="h-4 w-4" />
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
