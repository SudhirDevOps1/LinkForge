"use client";

// =============================================================================
// ❓ FAQ accordion — smooth expand/collapse
// =============================================================================
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    q: "Kya LinkForge sach me free hai?",
    a: "Haan, 100%. MIT license open-source hai — hosting (Vercel/Cloudflare free tier), database (Neon/Turso/D1 free tier) aur storage (B2/R2 free tier) sab free tier par chalta hai. Koi paywall, koi premium badge nahi. Self-host karo to hamesha ₹0.",
  },
  {
    q: "Mera data kahan store hota hai?",
    a: "Jahan aap chaho. DATABASE_PROVIDER aur STORAGE_PROVIDER env vars se aap Neon, Turso, D1, Supabase ya apna Postgres — aur B2, R2, S3, MinIO ya local disk me se koi bhi choose karte ho. Koi third-party tracker nahi, analytics me raw IP kabhi store nahi hota.",
  },
  {
    q: "Linktree se migrate kar sakta hoon?",
    a: "Bilkul. Apne links JSON format me taiyaar karo aur Settings → Import se ek click me saara data le aao. Export bhi utna hi aasan hai — vendor lock-in zero, dono direction me.",
  },
  {
    q: "Kaunse databases aur storage supported hain?",
    a: "Databases: Neon, Turso (libSQL), Cloudflare D1, Supabase, local Postgres (+ Upstash Redis rate-limiting ke liye). Storage: Backblaze B2, Cloudflare R2, AWS S3, MinIO, Vercel Blob, local disk. Deploy: Vercel, Cloudflare Pages, Netlify, Railway, Render, Docker.",
  },
  {
    q: "Custom domain kaise connect karoon?",
    a: "Apne DNS me ek CNAME record banao (bio → aapka deployment domain), hosting dashboard me domain add karo, aur Settings me domain save karo — bas. Edge middleware automatically sahi bio page serve karta hai.",
  },
  {
    q: "Kya coding aani chahiye?",
    a: "Bilkul nahi. Dashboard UI se links, themes, analytics sab manage hota hai. Developers ke liye REST API, webhooks aur poora documented codebase bonus me milta hai.",
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
