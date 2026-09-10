// Privacy Policy — transparent, GDPR/CCPA/DPDP-compliant
import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "LinkForge Privacy Policy — what data is collected, what is never collected, cookies, analytics, retention, and your data rights.",
};

const UPDATED = "September 10, 2026";

const TOC = [
  ["tldr", "TL;DR — Summary"],
  ["collect", "Data we collect"],
  ["never", "Data we NEVER collect"],
  ["cookies", "Cookies"],
  ["analytics", "Analytics & tracking"],
  ["storage", "Storage & subprocessors"],
  ["retention", "Retention & deletion"],
  ["rights", "Your privacy rights (GDPR / CCPA / DPDP)"],
  ["security", "Security standards"],
  ["children", "Children's privacy"],
  ["changes", "Policy updates"],
  ["contact", "Contact us"],
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
            On this page
          </p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {TOC.map(([id, label], i) => (
              <li key={id}>
                <a href={"#" + id} className="text-sm text-zinc-400 transition-colors hover:text-violet-300">
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
            <H2 id="tldr">TL;DR — Summary</H2>
            <div className="mt-4 rounded-2xl border border-violet-400/25 bg-violet-500/10 p-5 text-sm leading-relaxed text-violet-100">
              We only store the data strictly necessary to operate your profile and services
              (account credentials, profile details, links, and uploads). <strong>Raw IP addresses are
              never stored, there are zero advertising trackers, and we never sell your data.</strong> You
              can export or permanently delete your entire data at any time with one click.
            </div>
          </section>

          <section>
            <H2 id="collect">Data we collect</H2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-4 py-3 font-semibold text-white">Category</th>
                    <th className="px-4 py-3 font-semibold text-white">Examples</th>
                    <th className="px-4 py-3 font-semibold text-white">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-400">
                  {[
                    ["Account", "Name, email address, password hash (bcrypt)", "Authentication and account security"],
                    ["Profile & links", "Display name, bio, links, and theme configuration", "Rendering your public bio page"],
                    ["Uploads", "Avatars, documents, and media files", "Displaying and delivering creator assets"],
                    ["Sessions", "Session token, expiry timestamp, device fingerprint hint", "Maintaining secure authenticated sessions"],
                    ["Analytics (hashed)", "Salted hashed IP, device type, country code", "Anonymous aggregate traffic statistics"],
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
            <H2 id="never">Data we NEVER collect</H2>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
              {[
                "Raw IP addresses — only salted cryptographic SHA-256 hashes are recorded",
                "Cross-site browsing histories, ad IDs, or third-party trackers",
                "Precise GPS location coordinates — only coarse country code via edge headers",
                "Credit card or banking numbers — payments are processed directly by your provider",
                "Biometric, genetic, or health-related personal data",
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
              We only use <strong className="text-zinc-200">one functional session cookie</strong>:{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">lf_session</code>{" "}
              (encrypted authentication session, httpOnly, SameSite=Lax, 30-day lifetime). We do not
              use analytics cookies, advertising cookies, or third-party tracking pixels. Public
              creator bio pages operate with <strong className="text-zinc-200">zero cookies</strong>,
              so your visitors are never bothered with cookie consent banners.
            </P>
          </section>

          <section>
            <H2 id="analytics">Analytics & tracking</H2>
            <P>
              Page views and link clicks are recorded purely for aggregated creator insights
              (device category, browser family, country, and referrer domain). IP addresses are
              transformed into irreversible salted SHA-256 hashes before storage. There is no device
              fingerprinting and zero third-party tracking scripts. Profile owners can completely
              disable analytics collection at any time in Profile Settings.
            </P>
          </section>

          <section>
            <H2 id="storage">Storage & subprocessors</H2>
            <P>
              LinkForge provides an adaptable multi-cloud architecture. Your data resides on{" "}
              <strong className="text-zinc-200">your configured infrastructure providers</strong>:
              database engines (Neon, Turso, Cloudflare D1, Supabase, or PostgreSQL), object storage
              (Backblaze B2, Cloudflare R2, AWS S3, MinIO, or Vercel Blob), and application hosts
              (Vercel, Cloudflare, Netlify, Railway, or Render). Self-hosted deployments keep 100% of
              data within your own sovereign environment.
            </P>
            <P>
              <strong className="text-zinc-200">Daily Blog & Micro-Journal Storage:</strong> Creator
              articles and blog posts (.md, .txt, .html) are streamed directly to Backblaze B2 or S3
              Object Storage, maintaining zero bloat in relational databases.
            </P>
            <P>
              <strong className="text-zinc-200">Creator Monetization & Direct Payments:</strong> Transactions
              for courses, scheduling consultations, or digital products are routed directly through the
              creator's connected payment processor (such as Stripe, PayPal, Razorpay, or UPI).
              LinkForge does not collect, process, or store financial credentials.
            </P>
          </section>

          <section>
            <H2 id="retention">Retention & deletion</H2>
            <P>
              Analytics events are automatically purged after <strong className="text-zinc-200">30 days</strong>{" "}
              (or your configured retention window). Expired sessions are cleared periodically. Upon
              account deletion, your profile, links, uploaded assets, and active sessions are
              permanently erased immediately. You can download a full copy of your data at any time via
              Settings → Export Data in JSON format.
            </P>
          </section>

          <section>
            <H2 id="rights">Your privacy rights (GDPR / CCPA / DPDP)</H2>
            <P>
              Under international privacy regulations including the EU GDPR, California CCPA/CPRA, and
              India DPDP Act 2023, you have the right to access, rectify, port, and delete your
              personal data. Most actions can be executed self-serve directly within your Settings
              dashboard. For any additional requests, contact our privacy officer at the address below;
              we respond within 30 business days.
            </P>
          </section>

          <section>
            <H2 id="security">Security standards</H2>
            <P>
              Passwords are salted and hashed using bcrypt. Authenticated sessions rely on secure
              httpOnly cookies, all user inputs are strictly validated with Zod schemas, endpoints are
              rate-limited, and webhook deliveries are signed using HMAC-SHA256 signatures. Our automated
              security suite executes across every build before deployment.
            </P>
          </section>

          <section>
            <H2 id="children">Children's privacy</H2>
            <P>
              LinkForge is not intended for individuals under 13 years of age. If you believe that a
              minor has provided personal information without appropriate guardian consent, please
              notify us immediately and we will promptly delete the data.
            </P>
          </section>

          <section>
            <H2 id="changes">Policy updates</H2>
            <P>
              When this policy is revised, the "Last updated" date will be refreshed and prominent
              notices will be displayed on the creator dashboard for significant modifications.
              Continued use of the service signifies acceptance of updated policies.
            </P>
          </section>

          <section>
            <H2 id="contact">Contact us</H2>
            <P>
              For privacy inquiries, data export requests, or security disclosures:{" "}
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
