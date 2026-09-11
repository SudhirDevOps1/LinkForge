"use client";

// =============================================================================
// 📱 HeroPhone3D + CursorGlow + ParticleField — Futuristic Landing Visuals
// - Interactive 3D phone canvas with dynamic tilt and moving glare
// - Concentric rotating cybernetic halo rings
// - Holographic floating HUD panels showcasing core enterprise features
// - ParticleField: Lightweight starfield canvas (zero-dependency, DPR-capped)
// =============================================================================
import {
  CheckCircle2,
  Cloud,
  Database,
  Fingerprint,
  Globe,
  HardDrive,
  Link2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { BrandIcon } from "../icons";

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let x = -600;
    let y = -600;
    let tx = x;
    let ty = y;
    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const tick = () => {
      x += (tx - x) * 0.1;
      y += (ty - y) * 0.1;
      if (ref.current) {
        ref.current.style.transform = `translate(${x - 260}px, ${y - 260}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 z-[4] hidden h-[520px] w-[520px] rounded-full opacity-20 blur-[130px] md:block"
      style={{
        background:
          "radial-gradient(circle, rgba(139,92,246,.55), rgba(217,70,239,.18) 45%, transparent 68%)",
      }}
    />
  );
}

/** Lightweight interactive starfield for deep hero background */
export function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let mx = 0;
    let my = 0;
    let visible = true;
    const DPR = Math.min(1.5, window.devicePixelRatio || 1);
    const N = window.innerWidth < 640 ? 55 : 110;
    const stars = Array.from({ length: N }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.4,
      s: 0.0002 + Math.random() * 0.0009,
      tw: Math.random() * Math.PI * 2,
      violet: Math.random() < 0.3,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * DPR));
      canvas.height = Math.max(1, Math.floor(h * DPR));
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(canvas);

    let t = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.y -= s.s;
        if (s.y < -0.02) {
          s.y = 1.02;
          s.x = Math.random();
        }
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.4 + s.tw));
        const px = (s.x + mx * 0.03 * s.r) * w;
        const py = s.y * h + my * 12 * s.r;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.violet
          ? `rgba(167,139,250,${(0.55 * tw).toFixed(3)})`
          : `rgba(226,232,240,${(0.4 * tw).toFixed(3)})`;
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      io.disconnect();
    };
  }, []);

  return (
    <canvas
      aria-hidden
      ref={ref}
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-80"
    />
  );
}

const PHONE_LINKS = [
  {
    title: "GitHub — @SudhirDevOps1",
    subtitle: "Open Source • 142★",
    brand: "github",
    tile: "bg-white/10 text-white",
    tag: "Active",
    tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    title: "WebAuthn Passkey Login",
    subtitle: "Biometric FIDO2 • Touch ID",
    brand: "passkey",
    tile: "bg-violet-500/20 text-violet-300",
    tag: "Hardware 2FA",
    tagColor: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  },
  {
    title: "Daily Engineering Notes",
    subtitle: "Serverless S3 Blog • Zero DB",
    brand: "globe",
    tile: "bg-sky-500/20 text-sky-300",
    tag: "Live Post",
    tagColor: "text-sky-300 bg-sky-500/10 border-sky-500/20",
  },
  {
    title: "1:1 System Design Mentorship",
    subtitle: "Creator Store • Direct UPI",
    brand: "store",
    tile: "bg-emerald-500/20 text-emerald-300",
    tag: "0% Commission",
    tagColor: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  },
] as const;

const TECH_PILLS = [
  { name: "Neon", icon: Database, color: "text-violet-400" },
  { name: "Turso", icon: Database, color: "text-cyan-400" },
  { name: "D1", icon: Database, color: "text-indigo-400" },
  { name: "Supabase", icon: Database, color: "text-emerald-400" },
  { name: "Backblaze B2", icon: HardDrive, color: "text-fuchsia-400" },
  { name: "Cloudflare R2", icon: HardDrive, color: "text-amber-400" },
  { name: "AWS S3", icon: HardDrive, color: "text-orange-400" },
  { name: "Vercel", icon: Cloud, color: "text-white" },
] as const;

export function HeroPhone3D() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    let raf = 0;
    let t = 0;
    let rx = 0;
    let ry = 0;
    let trx = 0;
    let tryy = 0;
    let active = false;

    const onMove = (e: PointerEvent) => {
      if (!fine) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tryy = Math.max(-0.6, Math.min(0.6, px)) * 14;
      trx = Math.max(-0.6, Math.min(0.6, -py)) * 10;
      active = true;
    };
    const onLeave = () => {
      active = false;
      trx = 0;
      tryy = 0;
    };
    const tick = () => {
      t += 0.022;
      const swayX = active ? 0 : Math.sin(t) * 1.8;
      const swayY = active ? 0 : Math.cos(t * 0.75) * 2.4;
      rx += (trx + swayX - rx) * 0.075;
      ry += (tryy + swayY - ry) * 0.075;
      if (cardRef.current) {
        cardRef.current.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      }
      if (glareRef.current) {
        const heat = Math.min(0.18, Math.abs(ry) * 0.009 + 0.06);
        glareRef.current.style.background = `linear-gradient(${118 + ry * 5}deg, transparent 32%, rgba(255,255,255,${heat.toFixed(3)}) 48%, transparent 66%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-5xl py-8">
      {/* Dynamic keyframe styles for high-tech HUD float and cyber rotations */}
      <style>{`
        @keyframes lf-cyber-spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes lf-cyber-spin-reverse {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to { transform: translate(-50%, -50%) rotate(0deg); }
        }
        @keyframes lf-hud-float-a {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes lf-hud-float-b {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(8px); }
        }
      `}</style>

      {/* Futuristic Concentric Cybernetic Rings (Behind phone) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[580px] w-[580px] -translate-x-1/2 -translate-y-1/2 opacity-35 sm:h-[680px] sm:w-[680px]"
      >
        {/* Outer dashed ring */}
        <div
          className="absolute left-1/2 top-1/2 h-[520px] w-[520px] rounded-full border border-dashed border-violet-500/30"
          style={{ animation: "lf-cyber-spin-slow 60s linear infinite" }}
        />
        {/* Inner high-contrast tech ring */}
        <div
          className="absolute left-1/2 top-1/2 h-[380px] w-[380px] rounded-full border border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.12)]"
          style={{ animation: "lf-cyber-spin-reverse 45s linear infinite" }}
        />
        {/* Ambient reactor core glow */}
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 blur-[100px]" />
      </div>

      {/* Floating Holographic HUD Panels (Left Side on Desktop) */}
      <div className="pointer-events-none absolute left-2 top-16 z-20 hidden w-64 lg:block xl:left-8">
        {/* HUD Card 1: ALTCHA PoW Defense */}
        <div
          className="group rounded-2xl border border-white/10 bg-[#0c0c14]/80 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all"
          style={{ animation: "lf-hud-float-a 6s ease-in-out infinite" }}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">ALTCHA PoW Shield</p>
              </div>
              <p className="text-xs font-semibold text-white">Bot Attack Neutralized</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
            SHA-256 cryptographic verification. Zero tracking cookies.
          </p>
          <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-zinc-500 font-mono">
            <span>Latency: 110ms</span>
            <span className="text-emerald-400 font-medium">100% Verified</span>
          </div>
        </div>

        {/* HUD Card 2: Multi-Dialect DB */}
        <div
          className="mt-6 rounded-2xl border border-white/10 bg-[#0c0c14]/80 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          style={{ animation: "lf-hud-float-b 7s ease-in-out infinite" }}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-400">
              <Database className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Multi-Dialect Drizzle</p>
              <p className="text-xs font-semibold text-white">Neon & Turso Edge</p>
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1">
            <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[9px] text-zinc-300">21 Tables</span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[9px] text-zinc-300">Auto-Migrate</span>
            <span className="rounded-md bg-emerald-500/10 text-emerald-300 px-2 py-0.5 font-mono text-[9px]">98% Saved</span>
          </div>
        </div>
      </div>

      {/* Floating Holographic HUD Panels (Right Side on Desktop) */}
      <div className="pointer-events-none absolute right-2 top-16 z-20 hidden w-64 lg:block xl:right-8">
        {/* HUD Card 3: Hardware Passkeys */}
        <div
          className="rounded-2xl border border-white/10 bg-[#0c0c14]/80 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          style={{ animation: "lf-hud-float-b 6.5s ease-in-out infinite" }}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Fingerprint className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">FIDO2 / WebAuthn</p>
              <p className="text-xs font-semibold text-white">Biometric Passkey</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
            Touch ID • Face ID • Windows Hello. Phishing-resistant zero-password login.
          </p>
          <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-zinc-500 font-mono">
            <span>Standard: RFC 6238</span>
            <span className="text-cyan-400 font-medium">Encrypted</span>
          </div>
        </div>

        {/* HUD Card 4: Object Storage Blog */}
        <div
          className="mt-6 rounded-2xl border border-white/10 bg-[#0c0c14]/80 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          style={{ animation: "lf-hud-float-a 7.5s ease-in-out infinite" }}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-400">
              <HardDrive className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-400">Object Storage Vault</p>
              <p className="text-xs font-semibold text-white">Serverless Daily Blog</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
            Posts written to Backblaze B2 & Cloudflare R2 with dual-manifest auto-healing.
          </p>
          <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-zinc-500 font-mono">
            <span>TTFB: 38ms</span>
            <span className="text-fuchsia-400 font-medium">Zero-Cache Stall</span>
          </div>
        </div>
      </div>

      {/* 3D Interactive Phone Wrapper */}
      <div ref={wrapRef} className="relative mx-auto w-fit" style={{ perspective: "1400px" }}>
        <div
          ref={cardRef}
          className="relative transition-transform duration-75"
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
        >
          {/* Phone Frame Chassis */}
          <div
            role="img"
            aria-label="LinkForge bio page running on an interactive smartphone"
            className="relative z-[2] mx-auto w-[310px] rounded-[52px] border border-zinc-500/50 bg-gradient-to-b from-zinc-700 via-[#12121a] to-[#07070b] p-[10px] shadow-[0_50px_140px_-20px_rgba(139,92,246,0.65)] sm:w-[335px]"
            style={{ transform: "translateZ(46px)" }}
          >
            {/* Side Metallic Hardware Buttons */}
            <span aria-hidden className="absolute -left-[2px] top-28 h-8 w-[3px] rounded-l-md bg-zinc-500 shadow-sm" />
            <span aria-hidden className="absolute -left-[2px] top-42 h-12 w-[3px] rounded-l-md bg-zinc-500 shadow-sm" />
            <span aria-hidden className="absolute -left-[2px] top-58 h-12 w-[3px] rounded-l-md bg-zinc-500 shadow-sm" />
            <span aria-hidden className="absolute -right-[2px] top-50 h-20 w-[3px] rounded-r-md bg-zinc-500 shadow-sm" />

            {/* High-Contrast Screen Display */}
            <div className="overflow-hidden rounded-[43px] bg-gradient-to-b from-[#120e24] via-[#0d0d16] to-[#07070d] px-4 pb-5 pt-3">
              {/* Status Bar + Interactive Dynamic Island */}
              <div className="relative flex items-center justify-between px-2 text-[11px] font-semibold text-zinc-300">
                <span className="tracking-tight">9:41</span>
                
                {/* Dynamic Island with status indicator */}
                <div className="absolute left-1/2 top-1/2 flex h-[24px] w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-between rounded-full bg-black px-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                  <span className="text-[9px] font-mono tracking-wider text-zinc-300">LINKFORGE</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                </div>

                {/* Cellular & Battery */}
                <span className="flex items-center gap-1.5">
                  <span className="flex items-end gap-[1.5px]">
                    <span className="h-[3px] w-[2.5px] rounded-sm bg-zinc-300" />
                    <span className="h-[5px] w-[2.5px] rounded-sm bg-zinc-300" />
                    <span className="h-[7px] w-[2.5px] rounded-sm bg-zinc-300" />
                    <span className="h-[9px] w-[2.5px] rounded-sm bg-zinc-300" />
                  </span>
                  <span className="h-3 w-6 rounded-[4px] border border-zinc-400/80 p-[1.5px]">
                    <span className="block h-full w-4/5 rounded-[2px] bg-emerald-400" />
                  </span>
                </span>
              </div>

              {/* Creator Avatar & Verified Checkmark */}
              <div className="relative mx-auto mt-4 h-[74px] w-[74px]">
                <div
                  className="flex h-full w-full items-center justify-center rounded-full border-[3px] text-[26px] font-extrabold text-violet-100 shadow-[0_0_35px_rgba(139,92,246,0.6)]"
                  style={{
                    borderColor: "rgba(167,139,250,0.9)",
                    background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(15,15,25,0.9) 100%)",
                  }}
                >
                  S
                </div>
                <span
                  title="Verified Creator"
                  className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white shadow-md border-2 border-[#120e24]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 fill-violet-600 text-white" />
                </span>
              </div>

              {/* Name & Bio */}
              <p className="mt-2.5 text-center text-[17px] font-bold text-white tracking-tight">Sudhir Singh</p>
              <p className="mx-auto mt-0.5 max-w-[220px] text-center text-[11px] leading-snug text-zinc-400">
                BCA Student · Full-Stack Developer
              </p>

              {/* Status Pill */}
              <div className="mx-auto mt-2 flex w-fit items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-medium text-violet-300">
                <Sparkles className="h-3 w-3 text-violet-400" />
                <span>Open for Collaborations</span>
              </div>

              {/* Interactive Phone Link Cards */}
              <div className="mt-4 space-y-2.5">
                {PHONE_LINKS.map((l) => (
                  <div
                    key={l.title}
                    className="group flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.05] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all hover:border-violet-400/30 hover:bg-white/[0.08]"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${l.tile} shadow-sm`}>
                      {l.brand === "github" ? (
                        <BrandIcon id="github" className="h-[18px] w-[18px]" />
                      ) : l.brand === "passkey" ? (
                        <Fingerprint className="h-[18px] w-[18px]" />
                      ) : l.brand === "store" ? (
                        <Zap className="h-[18px] w-[18px]" />
                      ) : (
                        <Globe className="h-[18px] w-[18px]" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-zinc-100">{l.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-zinc-400 truncate">{l.subtitle}</span>
                      </div>
                    </div>
                    <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${l.tagColor}`}>
                      {l.tag}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom Quick Action Buttons */}
              <div className="mx-auto mt-4 flex items-center justify-center gap-2">
                <span className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[11px] font-medium text-zinc-300 shadow-sm hover:text-white">
                  Share
                </span>
                <span className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[11px] font-medium text-zinc-300 shadow-sm hover:text-white">
                  QR Code
                </span>
                <span className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[11px] font-medium text-zinc-300 shadow-sm hover:text-white">
                  vCard
                </span>
              </div>

              {/* Home Indicator Bar */}
              <div className="mx-auto mt-4 h-1 w-28 rounded-full bg-white/25" />
            </div>
          </div>

          {/* Dynamic Moving Glare Overlay */}
          <div
            aria-hidden
            ref={glareRef}
            className="pointer-events-none absolute inset-0 z-[3] rounded-[52px]"
            style={{ transform: "translateZ(47px)" }}
          />
        </div>

        {/* Ambient Ground Shadow */}
        <div
          aria-hidden
          className="absolute -bottom-8 left-1/2 h-12 w-80 -translate-x-1/2 rounded-full bg-violet-600/30 blur-2xl"
        />
      </div>

      {/* Clean Technology Badge Strip (Below Phone) */}
      <div className="mt-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3.5">
          Enterprise Cloud & Database Stack
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
          {TECH_PILLS.map((p) => (
            <span
              key={p.name}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300 shadow-sm hover:border-violet-500/30 hover:bg-white/[0.06] transition-all"
            >
              <p.icon className={`h-3.5 w-3.5 ${p.color}`} />
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
