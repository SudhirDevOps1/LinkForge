// 🔏 Privacy Policy — transparent, GDPR/CCPA/DPDP-aware
import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "LinkForge Privacy Policy — kya data collect hota hai, kya kabhi nahi, cookies, analytics, retention aur aapke rights.",
};

const UPDATED = "September 9, 2026";

const TOC = [
  ["tldr", "TL;DR — short me"],
  ["collect", "Hum kya data collect karte hain"],
  ["never", "Hum kya KABHI collect nahi karte"],
  ["cookies", "Cookies"],
  ["analytics", "Analytics & tracking"],
  ["storage", "Kahan store hota hai (subprocessors)"],
  ["retention", "Retention & deletion"],
  ["rights", "Aapke rights (GDPR / CCPA / DPDP)"],
  ["security", "Security"],
  ["children", "Children"],
  ["changes", "Policy changes"],
  ["contact", "Contact"],
];

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 pt-2 font-display text-xl font-bold text-white">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-zinc-400">{children}</p>;
}

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-ink-950">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-80 w-[640px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[120px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-5 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" /> Privacy-first by design
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-zinc-500">Last updated: {UPDATED}</p>

        {/* TOC */}
        <nav className="glass mt-8 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Is page me
          </p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {TOC.map(([id, label], i) => (
              <li key={id}>
                <a href={`#${id}`} className="text-sm text-zinc-400 transition-colors hover:text-violet-300">
                  <span className="mr-2 font-mono text-xs text-zinc-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          <section>
            <H2 id="tldr">TL;DR — short me</H2>
            <div className="mt-4 rounded-2xl border border-violet-400/25 bg-violet-500/10 p-5 text-sm leading-relaxed text-violet-100">
              Hum sirf wahi data rakhte hain jo aapka page chalane ke liye zaroori hai
              (account, profile, links, uploads). <strong>Raw IP addresses kabhi store
              nahi hote, koi advertising tracker nahi, koi data sale nahi.</strong> Aap
              apna poora data kabhi bhi export ya delete kar sakte ho.
            </div>
          </section>

          <section>
            <H2 id="collect">Hum kya data collect karte hain</H2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-4 py-3 font-semibold text-white">Category</th>
                    <th className="px-4 py-3 font-semibold text-white">Examples</th>
                    <th className="px-4 py-3 font-semibold text-white">Kyun</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-400">
                  {[
                    ["Account", "Name, email, password hash (bcrypt)", "Login & security"],
                    ["Profile & links", "Display name, bio, links, theme", "Aapka public page render karne ke liye"],
                    ["Uploads", "Avatars, PDFs, media files", "Aapke page par dikhane ke liye"],
                    ["Sessions", "Session token, expiry, device hint", "Logged-in rakhne ke liye"],
                    ["Analytics (hashed)", "Hashed IP, device type, country code", "Aggregate stats, bina pehchaan ke"],
                  ].map((row) => (
                    <tr key={row[0]} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3 font-medium text-zinc-200">{row[0]}</td>
                      <td className="px-4 py-3">{row[1]}</td>
                      <td className="px-4 py-3">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <H2 id="never">Hum kya KABHI collect nahi karte</H2>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
              {[
                "Raw IP addresses — sirf salted SHA-256 hash store hota hai",
                "Cross-site browsing history ya advertising IDs",
                "Precise GPS location — sirf country code (edge headers se)",
                "Payment details — koi paid plan hi nahi hai",
                "Biometric ya health data",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <H2 id="cookies">Cookies</H2>
            <P>
              Sirf <strong className="text-zinc-200">ek functional cookie</strong> use hota hai:{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">lf_session</code>{" "}
              (login session, httpOnly, SameSite=Lax, 30 din). Koi analytics cookies, koi
              marketing cookies, koi third-party cookies nahi. Public bio pages par{" "}
              <strong className="text-zinc-200">zero cookies</strong> set hote hain — visitors
              ko consent banner ki zaroorat hi nahi.
            </P>
          </section>

          <section>
            <H2 id="analytics">Analytics & tracking</H2>
            <P>
              Page views aur link clicks aggregate statistics ke liye record hote hain
              (device type, browser, country, referrer). IP addresses salted hash me
              convert hokar store hote hain — reverse karna possible nahi. Koi
              fingerprinting nahi, koi third-party analytics (Google Analytics waghera)
              nahi. Profile owners Settings se analytics poori tarah band kar sakte hain.
            </P>
          </section>

          <section>
            <H2 id="storage">Kahan store hota hai (subprocessors)</H2>
            <P>
              LinkForge multi-cloud hai — data <strong className="text-zinc-200">aapke chosen
              providers</strong> par rehta hai: database (Neon / Turso / D1 / Supabase /
              Postgres), file storage (Backblaze B2 / Cloudflare R2 / S3 / MinIO / Vercel
              Blob) aur hosting (Vercel / Cloudflare / Netlify / Railway / Render). Self-hosted
              instances me data 100% aapke infrastructure par rehta hai.
            </P>
            <P>
              <strong className="text-zinc-200">Daily Blog & Micro-Journal Storage:</strong> Creator ke
              daily blog posts (.md, .txt, .html) directly Backblaze B2 / S3 Object Storage me
              store hote hain — relational database me zero bloat ke saath.
            </P>
            <P>
              <strong className="text-zinc-200">Creator Monetization & Payments:</strong> Courses,
              1:1 calls ya digital products ke transactions directly creator ke payment gateway
              (Razorpay, Stripe, Topmate, Gumroad, UPI) par process hote hain. LinkForge kisi bhi
              user ka card/banking details hold ya process nahi karta.
            </P>
          </section>

          <section>
            <H2 id="retention">Retention & deletion</H2>
            <P>
              Analytics events <strong className="text-zinc-200">30 din</strong> (configurable)
              ke baad automatically purge ho jate hain. Sessions expire hone par delete hote
              hain. Account delete karne par profile, links, files aur sessions — sab kuch
              permanently hata diya jata hai. Settings → Export se aap kabhi bhi apna poora
              data JSON me download kar sakte ho.
            </P>
          </section>

          <section>
            <H2 id="rights">Aapke rights (GDPR / CCPA / DPDP)</H2>
            <P>
              EU (GDPR), California (CCPA) aur India (DPDP Act 2023) ke tehat aapko right hai:
              apna data access karne ka, correct karne ka, export karne ka, aur delete karne
              ka. Zyadatar actions Settings me self-serve hain; baaki ke liye neeche contact
              par email karein — 30 din ke andar response milega.
            </P>
          </section>

          <section>
            <H2 id="security">Security</H2>
            <P>
              Passwords bcrypt se hashed, sessions httpOnly cookies me, saare inputs
              validated, rate limiting har API par, aur webhook deliveries HMAC-signed.
              Security test suite (80 assertions) har release se pehle chalti hai. Koi
              vulnerability mile to responsibly disclose karein — hum 48 ghante me
              acknowledge karte hain.
            </P>
          </section>

          <section>
            <H2 id="children">Children</H2>
            <P>
              LinkForge 13 saal se kam umar ke bacchon ke liye nahi hai. Agar aapko lage
              ki kisi minor ka data galti se collect hua hai, to contact karein — turant
              delete karenge.
            </P>
          </section>

          <section>
            <H2 id="changes">Policy changes</H2>
            <P>
              Policy update hogi to “Last updated” date badlegi aur material changes par
              dashboard me notice dikhega. Chalti service ka use jaari rakhna updated
              policy ki acceptance mana jayega.
            </P>
          </section>

          <section>
            <H2 id="contact">Contact</H2>
            <P>
              Privacy questions, data requests ya complaints:{" "}
              <a href="mailto:privacy@linkforge.app" className="text-violet-300 hover:underline">
                privacy@linkforge.app
              </a>
            </P>
          </section>
        </div>

        <div className="mt-14 flex flex-wrap gap-3 border-t border-white/5 pt-8">
          <Link href="/terms" className="text-sm text-violet-300 hover:underline">
            Terms of Service →
          </Link>
          <Link href="/" className="text-sm text-zinc-500 hover:text-white">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
