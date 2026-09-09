"use client";

// =============================================================================
// 📱 HeroPhone3D + CursorGlow — landing hero 3D tilt + cursor tracker
// - Mouse-driven 3D tilt (lerped rAF) + idle sway + moving glare + depth layers
// - Touch devices par tilt off (static + float animation rehta hai)
// - CursorGlow: fixed radial glow jo cursor follow karta hai (desktop only)
// Pure additive — existing hero content same hai, sirf wrapper upgraded.
// =============================================================================
import { Cloud, Database, HardDrive } from "lucide-react";
import { useEffect, useRef } from "react";

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

const MINI_LINKS = [
  { t: "GitHub — @SudhirDevOps1", c: "bg-emerald-400" },
  { t: "LinkForge", c: "bg-violet-400" },
  { t: "Blog & Portfolio", c: "bg-sky-400" },
];

export function HeroPhone3D() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
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
      tryy = Math.max(-0.6, Math.min(0.6, px)) * 20;
      trx = Math.max(-0.6, Math.min(0.6, -py)) * 15;
      active = true;
    };
    const onLeave = () => {
      active = false;
      trx = 0;
      tryy = 0;
    };
    const tick = () => {
      t += 0.022;
      const swayX = active ? 0 : Math.sin(t) * 2.5;
      const swayY = active ? 0 : Math.cos(t * 0.75) * 3.5;
      rx += (trx + swayX - rx) * 0.075;
      ry += (tryy + swayY - ry) * 0.075;
      if (cardRef.current) {
        cardRef.current.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      }
      if (glareRef.current) {
        const heat = Math.min(0.16, Math.abs(ry) * 0.008 + 0.05);
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
    <div ref={wrapRef} className="relative mx-auto w-fit" style={{ perspective: "1300px" }}>
      <div
        ref={cardRef}
        className="relative"
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      >
        {/* Live CSS phone mockup (koi image asset nahi — kabhi 404 nahi) */}
        <div
          role="img"
          aria-label="LinkForge bio page running on a phone"
          className="relative z-[2] mx-auto w-[280px] rounded-[40px] border border-white/20 bg-[#0b0b14] p-2.5 shadow-[0_50px_120px_-30px_rgba(139,92,246,.55)] sm:w-[300px]"
          style={{ transform: "translateZ(46px)" }}
        >
          <div className="rounded-[32px] bg-gradient-to-b from-violet-950/60 via-[#101019] to-[#0b0b14] px-4 pb-5 pt-3">
            <div className="mx-auto h-5 w-24 rounded-full bg-black/70" />
            <div className="mx-auto mt-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-violet-400/70 bg-violet-500/15 text-xl font-bold text-violet-200">
              S
            </div>
            <p className="mt-2 text-center text-sm font-bold text-white">Sudhir Singh</p>
            <p className="mx-auto mt-1 max-w-[200px] text-center text-[10px] leading-snug text-zinc-400">
              BCA Student · Full-Stack Developer
            </p>
            <div className="mt-3 space-y-2">
              {MINI_LINKS.map((l) => (
                <div
                  key={l.t}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
                >
                  <span className={`h-6 w-6 shrink-0 rounded-lg ${l.c}/20`} />
                  <span className="truncate text-[11px] font-semibold text-zinc-100">{l.t}</span>
                  <span className="ml-auto text-[10px] text-violet-300">→</span>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-3 flex items-center justify-center gap-2">
              <span className="rounded-lg border border-white/10 px-2.5 py-1 text-[10px] text-zinc-300">
                Share
              </span>
              <span className="rounded-lg border border-white/10 px-2.5 py-1 text-[10px] text-zinc-300">
                QR
              </span>
            </div>
          </div>
        </div>
        {/* Moving glare */}
        <div
          aria-hidden
          ref={glareRef}
          className="pointer-events-none absolute inset-0 z-[3] rounded-[40px]"
          style={{ transform: "translateZ(47px)" }}
        />
        {/* Floating provider chips — depth layers (translateZ alag element par,
            taaki animate-float transform override na kare) */}
        <div className="absolute -left-24 top-16 z-[3] hidden sm:block">
          <div style={{ transform: "translateZ(90px)" }}>
            <div className="animate-float rounded-2xl glass px-4 py-3 text-xs font-semibold">
              <Database className="mb-1 h-4 w-4 text-violet-300" />
              Neon · Turso · D1
            </div>
          </div>
        </div>
        <div className="absolute -right-24 top-40 z-[3] hidden sm:block">
          <div style={{ transform: "translateZ(70px)" }}>
            <div
              className="animate-float rounded-2xl glass px-4 py-3 text-xs font-semibold"
              style={{ animationDelay: "1.4s" }}
            >
              <HardDrive className="mb-1 h-4 w-4 text-fuchsia-300" />
              B2 · R2 · S3
            </div>
          </div>
        </div>
        <div className="absolute -left-20 bottom-20 z-[3] hidden sm:block">
          <div style={{ transform: "translateZ(110px)" }}>
            <div
              className="animate-float rounded-2xl glass px-4 py-3 text-xs font-semibold"
              style={{ animationDelay: "2.6s" }}
            >
              <Cloud className="mb-1 h-4 w-4 text-indigo-300" />
              Vercel · CF · Netlify
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
