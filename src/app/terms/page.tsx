// 📜 Terms of Service — fair, readable, enforceable
import type { Metadata } from "next";
import { ArrowLeft, ScrollText } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "LinkForge Terms of Service — acceptable use, your content, API fair use, availability, liability aur governing law.",
};

const UPDATED = "September 9, 2026";

const TOC = [
  ["service", "Service"],
  ["accounts", "Accounts"],
  ["content", "Your content"],
  ["acceptable", "Acceptable use"],
  ["domains", "Custom domains"],
  ["api", "API, webhooks & fair use"],
  ["uploads", "Uploads & storage"],
  ["availability", "Availability (no SLA)"],
  ["termination", "Suspension & termination"],
  ["liability", "Warranty & liability"],
  ["law", "Governing law"],
  ["changes", "Changes & contact"],
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
            <H2 id="service">1. Service</H2>
            <P>
              LinkForge ek open-source (MIT) link-in-bio builder hai: aap public bio
              pages banate ho, links/themes/files manage karte ho, aur privacy-first
              analytics dekhte ho. Service “as-is” provide hoti hai — free tier par
              koi uptime guarantee nahi (self-host karke aap apna SLA khud control
              kar sakte ho).
            </P>
          </section>

          <section>
            <H2 id="accounts">2. Accounts</H2>
            <List
              items={[
                "Signup ke liye valid email aur 8+ character password zaroori hai.",
                "Apne credentials ki security aapki zimmedari hai — suspicious activity par turant password badlein aur “Sign out everywhere” use karein.",
                "Ek vyakti multiple accounts bana sakta hai, lekin abuse ke liye nahi.",
                "13 saal se kam umar ke users allowed nahi.",
              ]}
            />
          </section>

          <section>
            <H2 id="content">3. Your content</H2>
            <P>
              Profiles, links, bios, uploads — <strong className="text-zinc-200">sab kuch
              100% aapka hai</strong>. Aap LinkForge ko sirf itna license dete ho: aapka
              public page duniya ko dikhane ke liye content host/display karna. Aap
              represent karte ho ki content post karne ka right aapke paas hai, aur kisi
              ke copyright/trademark ka violation nahi ho raha.
            </P>
          </section>

          <section>
            <H2 id="acceptable">4. Acceptable use</H2>
            <P>Neeche wali cheezein strictly prohibited hain:</P>
            <List
              items={[
                "Malware, phishing, scams ya deceptive links",
                "Illegal content, hate speech, harassment, ya explicit minor-related content",
                "Spam, mass account creation, ya rate limits bypass karna",
                "Doosron ke accounts/systems me unauthorized access ki koshish",
                "Service ko overload karne wale automated scraping/DDoS patterns",
                "LinkForge branding se fake affiliation dikhana",
              ]}
            />
            <P>
              Violation par content remove, account suspend ya terminate ho sakta hai —
              serious cases me authorities ko report kiya jayega.
            </P>
          </section>

          <section>
            <H2 id="domains">5. Custom domains</H2>
            <P>
              Aap apne owned domains connect kar sakte ho (CNAME setup). Aap confirm
              karte ho ki domain use karne ka adhikaar aapke paas hai. Phishing ya
              trademark-infringing domains turant disconnect kar diye jayenge.
            </P>
          </section>

          <section>
            <H2 id="api">6. API, webhooks & fair use</H2>
            <List
              items={[
                "REST API keys personal hain — share na karein, leak ho to turant revoke karein.",
                "Default limits: 100 req/min general, 60 req/min API keys. Automated heavy polling ke liye webhooks use karein.",
                "Webhook endpoints aapke hain — LinkForge delivery attempts best-effort (5s timeout, signed payloads) karta hai.",
                "Fair-use violation par keys rate-limited ya revoke ho sakti hain.",
              ]}
            />
          </section>

          <section>
            <H2 id="uploads">7. Uploads & storage</H2>
            <P>
              Allowed types: images, PDF, audio, video, docs, ZIP (max 10 MB default, har
              instance par configurable). Executables, scripts aur malicious files
              prohibited hain aur bina notice delete ho sakti hain. Self-hosted instances
              par storage limits aapke provider (B2/R2/S3/MinIO) ke hisaab se lagti hain.
            </P>
          </section>

          <section>
            <H2 id="availability">8. Availability (no SLA)</H2>
            <P>
              Hum best-effort uptime maintain karte hain, lekin koi SLA nahi dete.
              Maintenance, provider outages ya force-majeure se downtime ho sakta hai.
              Critical use-cases ke liye self-hosting recommended hai — poora codebase
              MIT license me available hai.
            </P>
          </section>

          <section>
            <H2 id="termination">9. Suspension & termination</H2>
            <P>
              Aap kabhi bhi account delete karke service chhod sakte ho (data export
              karke). Terms violation par hum content remove ya account suspend/terminate
              kar sakte hain — jahan possible hoga, pehle notice denge. Termination ke
              baad aapka public page offline ho jata hai.
            </P>
          </section>

          <section>
            <H2 id="liability">10. Warranty & liability</H2>
            <P>
              Service bina kisi warranty ke milti hai (express ya implied). Applicable law
              ki maximum limit tak, LinkForge kisi bhi indirect, incidental ya consequential
              damages ke liye liable nahi hoga — including data loss. Free service ke liye
              total liability zero hai; paid/self-hosted setups me aapke provider terms
              apply honge. Apne data ka regular export backup rakhna aapki zimmedari hai.
            </P>
          </section>

          <section>
            <H2 id="law">11. Governing law</H2>
            <P>
              Yeh terms <strong className="text-zinc-200">Bharat ke kanoon (laws of
              India)</strong> se govern honge. Disputes pehle good-faith discussion se
              solve karne ki koshish hogi; na ho to competent Indian courts ka jurisdiction hoga.
            </P>
          </section>

          <section>
            <H2 id="changes">12. Changes & contact</H2>
            <P>
              Terms update honge to “Last updated” date badlegi aur material changes par
              notice milega. Questions:{" "}
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
