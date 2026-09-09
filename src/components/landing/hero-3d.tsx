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
  { t: "FormForge", brand: null, tile: "bg-emerald-500/20 text-emerald-300" },
] as const;

/** Orbit providers — teeno category chips ka content (koi naam hata nahi) */
const ORBIT_PILLS = [
  { name: "Neon", icon: Database, color: "text-violet-300" },
  { name: "Turso", icon: Database, color: "text-violet-300" },
  { name: "D1", icon: Database, color: "text-violet-300" },
  { name: "Supabase", icon: Database, color: "text-emerald-300" },
  { name: "B2", icon: HardDrive, color: "text-fuchsia-300" },
  { name: "R2", icon: HardDrive, color: "text-fuchsia-300" },
  { name: "S3", icon: HardDrive, color: "text-amber-300" },
  { name: "Vercel", icon: Cloud, color: "text-indigo-300" },
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
          className="relative z-[2] mx-auto w-[300px] rounded-[52px] border border-zinc-600/60 bg-gradient-to-b from-zinc-700 via-[#14141c] to-black p-[11px] shadow-[0_60px_130px_-30px_rgba(139,92,246,.65)] sm:w-[320px]"
          style={{ transform: "translateZ(46px)" }}
        >
          {/* Side buttons */}
          <span aria-hidden className="absolute -left-[2px] top-28 h-8 w-[3px] rounded-l-md bg-zinc-600" />
          <span aria-hidden className="absolute -left-[2px] top-44 h-12 w-[3px] rounded-l-md bg-zinc-600" />
          <span aria-hidden className="absolute -left-[2px] top-60 h-12 w-[3px] rounded-l-md bg-zinc-600" />
          <span aria-hidden className="absolute -right-[2px] top-52 h-20 w-[3px] rounded-r-md bg-zinc-600" />
          {/* Screen */}
          <div className="overflow-hidden rounded-[42px] bg-gradient-to-b from-violet-950/70 via-[#101019] to-[#0b0b14] px-4 pb-4 pt-3">
            {/* Status bar + Dynamic Island */}
            <div className="relative flex items-center justify-between px-2 text-[11px] font-semibold text-zinc-200">
              <span>9:41</span>
              <span className="absolute left-1/2 top-1/2 h-[22px] w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)]" />
              <span className="flex items-center gap-1.5">
                <span className="flex items-end gap-[2px]">
                  <span className="h-[4px] w-[3px] rounded-sm bg-zinc-200" />
                  <span className="h-[6px] w-[3px] rounded-sm bg-zinc-200" />
                  <span className="h-[8px] w-[3px] rounded-sm bg-zinc-200" />
                  <span className="h-[10px] w-[3px] rounded-sm bg-zinc-400/50" />
                </span>
                <span className="h-3 w-6 rounded-[4px] border border-zinc-400/70 p-[1.5px]">
                  <span className="block h-full w-3/4 rounded-[2px] bg-emerald-400" />
                </span>
              </span>
            </div>
            <div
              className="mx-auto mt-4 flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] text-[26px] font-bold"
              style={{
                borderColor: "rgba(167,139,250,.85)",
                background: "rgba(139,92,246,.15)",
                color: "#ddd6fe",
                boxShadow: "0 0 34px rgba(139,92,246,.5)",
              }}
            >
              S
            </div>
            <p className="mt-2.5 text-center text-[17px] font-bold text-white">Sudhir Singh</p>
            <p className="mx-auto mt-1 max-w-[220px] text-center text-[11px] leading-snug text-zinc-400">
              BCA Student · Full-Stack Developer
            </p>
            <div className="mt-4 space-y-2.5">
              {MINI_LINKS.map((l) => (
                <div
                  key={l.t}
                  className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${l.tile}`}
                  >
                    {l.brand === "github" ? (
                      <BrandIcon id="github" className="h-[18px] w-[18px]" />
                    ) : l.brand === "globe" ? (
                      <Globe className="h-[18px] w-[18px]" />
                    ) : (
                      <Link2 className="h-[18px] w-[18px]" />
                    )}
                  </span>
                  <span className="truncate text-xs font-semibold text-zinc-100">{l.t}</span>
                  <span className="ml-auto text-xs text-violet-300">→</span>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-4 flex items-center justify-center gap-2">
              <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-zinc-300">
                Share
              </span>
              <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-zinc-300">
                QR
              </span>
            </div>
            <div className="mx-auto mt-4 h-1 w-28 rounded-full bg-white/25" />
          </div>
        </div>
        {/* Moving glare */}
        <div
          aria-hidden
          ref={glareRef}
          className="pointer-events-none absolute inset-0 z-[3] rounded-[52px]"
          style={{ transform: "translateZ(47px)" }}
        />
      </div>
      {/* Ground shadow — phone ko zameen par tikata hai */}
      <div
        aria-hidden
        className="absolute -bottom-8 left-1/2 h-10 w-72 -translate-x-1/2 rounded-full bg-violet-600/25 blur-2xl"
      />
      {/* Provider orbit — scattered chips ki jagah structured 3D ring (lg+).
          Saare provider names preserved, kuch kata nahi, kuch hata nahi. */}
      <style>{`@keyframes lf-orbit { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }`}</style>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 hidden h-0 w-0 lg:block"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="relative h-0 w-0"
          style={{
            transformStyle: "preserve-3d",
            animation: "lf-orbit 32s linear infinite",
          }}
        >
          {ORBIT_PILLS.map((p, i) => (
            <div
              key={p.name}
              className="absolute left-0 top-0"
              style={{
                transform: `rotateY(${i * (360 / ORBIT_PILLS.length)}deg) translateZ(300px)`,
              }}
            >
              <div className="glass -ml-14 -mt-5 flex w-28 items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold [backface-visibility:hidden]">
                <p.icon className={`h-3.5 w-3.5 shrink-0 ${p.color}`} />
                <span className="truncate">{p.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Mobile / tablet: same providers, tidy wrap row (orbit ke bina) */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-2 lg:hidden">
        {ORBIT_PILLS.map((p) => (
          <span
            key={p.name}
            className="glass inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold"
          >
            <p.icon className={`h-3.5 w-3.5 ${p.color}`} />
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}
