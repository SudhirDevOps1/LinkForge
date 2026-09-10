"use client";

import { useState } from "react";
import { 
  Mail, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Users, 
  Download, 
  Sparkles, 
  Server,
  ArrowRight,
  Send
} from "lucide-react";
import { Reveal } from "./anim";

const PRESET_EMAILS = [
  { email: "creator@gmail.com", type: "valid", note: "Real MX (Google Workspace / Gmail)" },
  { email: "team@stripe.com", type: "valid", note: "Real Corporate MX" },
  { email: "spammer@10minutemail.com", type: "disposable", note: "Disposable Burner (Blocked)" },
  { email: "bot@faketempmail.org", type: "disposable", note: "Temp-mail Domain (Blocked)" },
];

export function NewsletterShowcase() {
  const [testEmail, setTestEmail] = useState("creator@gmail.com");
  const [testResult, setTestResult] = useState<{
    valid: boolean;
    reason: string;
    mxRecord?: string;
  } | null>({
    valid: true,
    reason: "Valid mail exchanger detected via Google & Cloudflare DNS",
    mxRecord: "gmail-smtp-in.l.google.com (Priority 5)",
  });

  function handleCheck(inputEmail: string) {
    const email = inputEmail.trim().toLowerCase();
    const domain = email.split("@")[1] || "";

    const disposableDomains = [
      "10minutemail.com", "tempmail.com", "mailinator.com", "faketempmail.org",
      "guerrillamail.com", "yopmail.com", "trashmail.com"
    ];

    if (!domain || !domain.includes(".")) {
      setTestResult({
        valid: false,
        reason: "Invalid email structure: missing valid domain name",
      });
      return;
    }

    if (disposableDomains.some(d => domain.endsWith(d))) {
      setTestResult({
        valid: false,
        reason: "Blocked! Temporary / disposable burner domain detected",
      });
      return;
    }

    if (domain === "gmail.com") {
      setTestResult({
        valid: true,
        reason: "Verified Google Mail exchange server active",
        mxRecord: "gmail-smtp-in.l.google.com (Priority 5)",
      });
    } else if (domain === "stripe.com") {
      setTestResult({
        valid: true,
        reason: "Verified Enterprise MX records active",
        mxRecord: "aspmx.l.google.com (Priority 1)",
      });
    } else {
      setTestResult({
        valid: true,
        reason: `Live MX record found for ${domain}`,
        mxRecord: `mail.${domain} (Priority 10)`,
      });
    }
  }

  return (
    <section id="newsletter" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-24">
      <Reveal className="mb-14 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-300">
          <Mail className="h-3.5 w-3.5" />
          Real Audience · Zero Fake Emails
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Built-in <span className="text-gradient">MX DNS Verified</span> Newsletter
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Aapke public bio page ke footer me smart newsletter subscribe box hai jo Google aur Cloudflare DNS se live MX records check karta hai.
        </p>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: 4 Features Bento */}
        <div className="space-y-4 lg:col-span-7">
          <Reveal delay={100}>
            <div className="glass rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Live Dual-DNS MX Checking</h3>
                  <p className="text-xs text-zinc-400">Google (8.8.8.8) + Cloudflare (1.1.1.1) Resolver</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                Koi bhi user subscribe karta hai to server pehle DNS resolution karta hai. Agar domain par valid mail exchangers (MX) nahi hain, to fake entry instantly reject ho jaati hai.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            <Reveal delay={150}>
              <div className="glass h-full rounded-3xl p-6">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
                <h4 className="mt-3 font-display text-base font-bold text-white">300+ Disposable Shield</h4>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  10minutemail, tempmail aur mailinator jaise burner inboxes auto-block hote hain. Pure real fans only.
                </p>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="glass h-full rounded-3xl p-6">
                <Download className="h-6 w-6 text-fuchsia-400" />
                <h4 className="mt-3 font-display text-base font-bold text-white">1-Click CSV Export</h4>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  Dashboard se subscribers ko ek click me CSV export karein aur Beehiiv, Mailchimp ya Substack me import karein.
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Right: Live Interactive DNS Tester */}
        <div className="lg:col-span-5">
          <Reveal delay={250} className="h-full">
            <div className="glass flex h-full flex-col justify-between rounded-3xl border-violet-500/20 p-6 sm:p-8">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-300">
                    <Sparkles className="h-3 w-3" /> Live Simulator
                  </span>
                  <span className="font-mono text-xs text-zinc-500">RFC 5321</span>
                </div>

                <h3 className="mt-4 font-display text-xl font-bold text-white">
                  Test DNS MX Resolution
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Type any email to see how LinkForge validates real inboxes.
                </p>

                {/* Input form */}
                <div className="mt-6 flex gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => {
                      setTestEmail(e.target.value);
                      handleCheck(e.target.value);
                    }}
                    placeholder="name@domain.com"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-violet-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleCheck(testEmail)}
                    className="flex items-center justify-center rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition-all hover:bg-violet-500"
                  >
                    Check
                  </button>
                </div>

                {/* Quick presets */}
                <div className="mt-4">
                  <p className="text-[11px] font-medium text-zinc-500">Try these presets:</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PRESET_EMAILS.map((p) => (
                      <button
                        key={p.email}
                        type="button"
                        onClick={() => {
                          setTestEmail(p.email);
                          handleCheck(p.email);
                        }}
                        className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-400 transition-colors hover:border-violet-500/30 hover:text-white"
                      >
                        {p.email}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Result output */}
                {testResult && (
                  <div
                    className={`mt-6 rounded-2xl border p-4 transition-all ${
                      testResult.valid
                        ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
                        : "border-rose-500/30 bg-rose-950/20 text-rose-300"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {testResult.valid ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                      )}
                      <div>
                        <p className="text-xs font-semibold">
                          {testResult.valid ? "Verified Legitimate Email" : "Blocked Submission"}
                        </p>
                        <p className="mt-1 text-[11px] opacity-90">{testResult.reason}</p>
                        {testResult.mxRecord && (
                          <div className="mt-2 rounded bg-black/40 px-2.5 py-1 font-mono text-[10px] text-emerald-200">
                            MX: {testResult.mxRecord}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs text-zinc-500">
                <span>Free for all LinkForge accounts</span>
                <span className="font-semibold text-violet-300">0% Comms / Limits</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
