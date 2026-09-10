// Terms of Service — fair, readable, legally compliant
import type { Metadata } from "next";
import { ArrowLeft, ScrollText } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "LinkForge Terms of Service — acceptable use, your content, API fair use, availability, liability, and governing law.",
};

const UPDATED = "September 10, 2026";

const TOC = [
  ["service", "1. Service"],
  ["accounts", "2. Accounts"],
  ["content", "3. Your content"],
  ["acceptable", "4. Acceptable use"],
  ["domains", "5. Custom domains"],
  ["api", "6. API, webhooks & fair use"],
  ["uploads", "7. Uploads & creator studio"],
  ["availability", "8. Availability (no SLA)"],
  ["termination", "9. Suspension & termination"],
  ["liability", "10. Warranty & liability"],
  ["law", "11. Governing law"],
  ["changes", "12. Changes & contact"],
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

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-zinc-400">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-ink-950">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-80 w-[640px] -translate-x-1/2 rounded-full bg-fuchsia-600/12 blur-[120px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-5 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300">
          <ScrollText className="h-3.5 w-3.5" /> Fair terms, plain language
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-zinc-500">Last updated: {UPDATED}</p>

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
            <H2 id="service">1. Service</H2>
            <P>
              LinkForge is an open-source (MIT licensed) link-in-bio and creator storefront builder:
              you create public profile pages, manage curated links, themes, and files, and observe
              privacy-first analytics. The service is provided on an &ldquo;as-is&rdquo; and
              &ldquo;as-available&rdquo; basis with no uptime guarantee on the hosted tier.
              Self-hosting grants you full sovereign control over your SLA.
            </P>
          </section>

          <section>
            <H2 id="accounts">2. Accounts</H2>
            <List
              items={[
                "Registration requires a valid email address and a password of at least 8 characters.",
                "You are responsible for maintaining the security of your credentials. If you notice unauthorized access, immediately change your password and use \"Sign out everywhere\".",
                "Users may create multiple accounts provided they are not utilized for abuse, spam, or rate limit evasion.",
                "Individuals under 13 years of age are not permitted to use this service.",
              ]}
            />
          </section>

          <section>
            <H2 id="content">3. Your content</H2>
            <P>
              Your profiles, links, biographical text, and uploaded media files{" "}
              <strong className="text-zinc-200">belong 100% to you</strong>. You grant LinkForge only
              the limited worldwide license necessary to host, process, and display your content to
              visitors on your behalf. You represent and warrant that you hold all necessary rights
              to publish your content and that it does not infringe on any copyright or trademark.
            </P>
          </section>

          <section>
            <H2 id="acceptable">4. Acceptable use</H2>
            <P>The following activities are strictly prohibited:</P>
            <List
              items={[
                "Distributing malware, phishing pages, deceptive scams, or credential-harvesting links",
                "Publishing unlawful content, hate speech, targeted harassment, or explicit minor-related material",
                "Spamming, automated mass account registration, or circumventing operational rate limits",
                "Attempting unauthorized access to accounts, database instances, or underlying infrastructure",
                "Automated scraping, denial-of-service (DDoS), or load patterns intended to degrade service stability",
                "Misrepresenting affiliation with or impersonating LinkForge or other creators",
              ]}
            />
            <P>
              Violations may result in immediate content removal, account suspension, or permanent
              termination. Severe security infractions will be referred to relevant authorities.
            </P>
          </section>

          <section>
            <H2 id="domains">5. Custom domains</H2>
            <P>
              You may connect custom domain names that you legitimately own or control (via DNS CNAME
              records). You certify that you hold the legal authority to use any domain mapped to
              LinkForge. Domains involved in trademark infringement or malicious deceptive practices
              will be detached immediately.
            </P>
          </section>

          <section>
            <H2 id="api">6. API, webhooks & fair use</H2>
            <List
              items={[
                "REST API keys are personal and confidential. Keep them secure and immediately revoke any key that is exposed.",
                "Standard operational limits apply: 100 requests/minute for general endpoints, 60 requests/minute for API key endpoints. Use webhooks for real-time notification rather than heavy polling.",
                "Webhook receiver endpoints must be maintained by you. LinkForge delivers webhook payloads on a best-effort basis with cryptographic HMAC-SHA256 signatures.",
                "Repeated abuse of API endpoints may result in automated rate limiting or key revocation.",
              ]}
            />
          </section>

          <section>
            <H2 id="uploads">7. Uploads, blogs & creator monetization</H2>
            <P>
              Supported upload formats include images, PDF documents, audio clips, video snippets,
              and archive packages (default 10 MB per file, configurable per instance). Executable files,
              scripts, and malicious payloads are strictly prohibited and subject to immediate removal.
              Self-hosted installations are governed by your selected object storage provider limits.
            </P>
            <P>
              <strong className="text-zinc-200">Daily Blogs & Journals:</strong> Creators authoring
              posts and articles retain 100% of their intellectual property. Posts are stored securely
              in connected object storage buckets.
            </P>
            <P>
              <strong className="text-zinc-200">Courses, Consultations & Digital Products:</strong> Creators
              maintain full responsibility for pricing, fulfilling, and handling refunds for their
              offerings. LinkForge provides presentation and connection tooling and does not act as the
              merchant of record.
            </P>
          </section>

          <section>
            <H2 id="availability">8. Availability (no SLA)</H2>
            <P>
              We strive to deliver high service uptime on a best-effort basis, but do not provide a
              financially backed Service Level Agreement (SLA). Downtime may occasionally occur due to
              maintenance windows or upstream provider interruptions. For mission-critical requirements,
              deploying an independent self-hosted instance under the MIT license is strongly recommended.
            </P>
          </section>

          <section>
            <H2 id="termination">9. Suspension & termination</H2>
            <P>
              You may close your account at any time and export your full dataset. LinkForge reserves
              the right to suspend or terminate accounts that violate these terms, with reasonable prior
              notice provided where practical. Upon account closure, your public bio page will become
              inaccessible.
            </P>
          </section>

          <section>
            <H2 id="liability">10. Warranty & liability</H2>
            <P>
              The service is provided &ldquo;as is&rdquo; without warranties of any kind, whether express
              or implied. To the maximum extent permitted by applicable law, LinkForge and its maintainers
              shall not be held liable for any indirect, incidental, special, or consequential damages,
              including loss of data, profits, or business opportunities. Regular data backups remain the
              sole responsibility of the user.
            </P>
          </section>

          <section>
            <H2 id="law">11. Governing law</H2>
            <P>
              These terms are governed by and construed in accordance with applicable laws. In the
              event of a controversy, parties shall first endeavor in good faith to resolve the dispute
              informally before pursuing judicial relief.
            </P>
          </section>

          <section>
            <H2 id="changes">12. Changes & contact</H2>
            <P>
              Terms may be amended from time to time. When revisions take place, the "Last updated"
              timestamp will be updated. For legal inquiries or questions:{" "}
              <a href="mailto:legal@linkforge.app" className="text-violet-300 hover:underline">
                legal@linkforge.app
              </a>
            </P>
          </section>
        </div>

        <div className="mt-14 flex flex-wrap gap-3 border-t border-white/5 pt-8">
          <Link href="/privacy" className="text-sm text-violet-300 hover:underline">
            Privacy Policy →
          </Link>
          <Link href="/" className="text-sm text-zinc-500 hover:text-white">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
