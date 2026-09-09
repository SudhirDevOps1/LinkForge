"use client";

// =============================================================================
// 📱 HeroPhone3D + CursorGlow + ParticleField — landing hero visuals
// - 3D tilt (lerped rAF) + idle sway + moving glare + depth layers
// - ParticleField: halka canvas starfield (zero dependency, DPR-capped,
//   offscreen pause, reduced-motion respect) — three.js ka weight nahi
// - Touch par tilt off; content same (kuch hataya nahi)
// =============================================================================
import { Cloud, Database, Globe, HardDrive, Link2 } from "lucide-react";
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

/** Halka interactive starfield — hero background depth ke liye */
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

const MINI_LINKS = [
  { t: "GitHub — @SudhirDevOps1", brand: "github", tile: "bg-white/10 text-white" },
  { t: "LinkForge", brand: null, tile: "bg-violet-500/25 text-violet-200" },
  { t: "Blog & Portfolio", brand: "globe", tile: "bg-sky-500/20 text-sky-300" },
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
      tryy = Math.max(-0.6, Math.min(0.6, px)) * 16;
      trx = Math.max(-0.6, Math.min(0.6, -py)) * 12;
      active = true;
    };
    const onLeave = () => {
      active = false;
      trx = 0;
      tryy = 0;
    };
    const tick = () => {
      t += 0.022;
      const swayX = active ? 0 : Math.sin(t) * 2.2;
      const swayY = active ? 0 : Math.cos(t * 0.75) * 3;
      rx += (trx + swayX - rx) * 0.075;
      ry += (tryy + swayY - ry) * 0.075;
      if (cardRef.current) {
        cardRef.current.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      }
      if (glareRef.current) {
        const heat = Math.min(0.15, Math.abs(ry) * 0.008 + 0.05);
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
        {/* Phone frame */}
        <div
          role="img"
          aria-label="LinkForge bio page running on a phone"
          className="relative z-[2] mx-auto w-[252px] rounded-[44px] border border-white/25 bg-gradient-to-b from-zinc-800 via-[#101018] to-black p-[10px] shadow-[0_50px_120px_-30px_rgba(139,92,246,.6)] sm:w-[272px]"
          style={{ transform: "translateZ(46px)" }}
        >
          {/* Side buttons */}
          <span aria-hidden className="absolute -left-[2px] top-24 h-10 w-[3px] rounded-l bg-zinc-700" />
          <span aria-hidden className="absolute -left-[2px] top-40 h-14 w-[3px] rounded-l bg-zinc-700" />
          <span aria-hidden className="absolute -right-[2px] top-32 h-16 w-[3px] rounded-r bg-zinc-700" />
          {/* Screen */}
          <div className="rounded-[34px] bg-gradient-to-b from-violet-950/70 via-[#101019] to-[#0b0b14] px-4 pb-5 pt-3">
            {/* Status bar */}
            <div className="flex items-center justify-between text-[9px] font-semibold text-zinc-400">
              <span>9:41</span>
              <span className="flex items-center gap-1">
                <span className="flex items-end gap-[2px]">
                  <span className="h-[3px] w-[2px] rounded-sm bg-zinc-400" />
                  <span className="h-[5px] w-[2px] rounded-sm bg-zinc-400" />
                  <span className="h-[7px] w-[2px] rounded-sm bg-zinc-400" />
                </span>
                <span className="h-2 w-4 rounded-[3px] border border-zinc-500 p-[1px]">
                  <span className="block h-full w-3/4 rounded-[2px] bg-emerald-400" />
                </span>
              </span>
            </div>
            <div className="mx-auto mt-1.5 h-5 w-24 rounded-full bg-black/80" />
            <div
              className="mx-auto mt-3 flex h-14 w-14 items-center justify-center rounded-full border-2 text-xl font-bold"
              style={{
                borderColor: "rgba(167,139,250,.8)",
                background: "rgba(139,92,246,.15)",
                color: "#ddd6fe",
                boxShadow: "0 0 28px rgba(139,92,246,.45)",
              }}
            >
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
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${l.tile}`}
                  >
                    {l.brand === "github" ? (
                      <BrandIcon id="github" className="h-4 w-4" />
                    ) : l.brand === "globe" ? (
                      <Globe className="h-4 w-4" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                  </span>
                  <span className="truncate text-[11px] font-semibold text-zinc-100">{l.t}</span>
                  <span className="ml-auto text-[10px] text-violet-300">→</span>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-3 flex items-center justify-center gap-2">
              <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-zinc-300">
                Share
              </span>
              <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-zinc-300">
                QR
              </span>
            </div>
            <div className="mx-auto mt-3 h-1 w-24 rounded-full bg-white/20" />
          </div>
        </div>
        {/* Moving glare */}
        <div
          aria-hidden
          ref={glareRef}
          className="pointer-events-none absolute inset-0 z-[3] rounded-[44px]"
          style={{ transform: "translateZ(47px)" }}
        />
        {/* Floating provider chips — depth layers */}
        <div className="absolute -left-28 top-14 z-[3] hidden sm:block">
          <div style={{ transform: "translateZ(90px)" }}>
            <div className="animate-float rounded-2xl glass px-4 py-3 text-xs font-semibold">
              <Database className="mb-1 h-4 w-4 text-violet-300" />
              Neon · Turso · D1
            </div>
          </div>
        </div>
        <div className="absolute -right-28 top-44 z-[3] hidden sm:block">
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
        <div className="absolute -left-24 bottom-24 z-[3] hidden sm:block">
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
