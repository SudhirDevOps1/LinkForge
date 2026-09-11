"use client";

// =============================================================================
// ⏳ CountdownCard — Real-time live ticking launch / event countdown timer
// =============================================================================
import { useEffect, useState } from "react";
import { ArrowRight, Clock, Flame, Sparkles } from "lucide-react";
import type { Link } from "@/db/schema";

interface CountdownCardProps {
  link: Link;
  accent?: string;
  textColor?: string;
  mutedColor?: string;
  iconBox?: number;
  onOpen?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeLeft(targetIso?: string | Date | null): TimeRemaining {
  if (!targetIso) {
    // Default fallback: 3 days from now
    return { days: 2, hours: 23, minutes: 59, seconds: 59, isExpired: false };
  }

  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isExpired: false };
}

export function CountdownCard({
  link,
  accent = "#f59e0b",
  textColor = "#ffffff",
  mutedColor = "#a1a1aa",
  onOpen,
}: CountdownCardProps) {
  // Target date is stored in link.expiresAt
  const targetDate = link.expiresAt || link.scheduledAt;
  const [time, setTime] = useState<TimeRemaining>(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div
      onClick={onOpen}
      className="w-full text-left cursor-pointer space-y-3"
    >
      {/* Top row: Title + Status badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shrink-0"
          >
            {time.isExpired ? <Sparkles className="h-3.5 w-3.5" /> : <Flame className="h-3.5 w-3.5" />}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm" style={{ color: textColor }}>
              {link.title}
            </p>
            {link.description && (
              <p className="truncate text-xs" style={{ color: mutedColor }}>
                {link.description}
              </p>
            )}
          </div>
        </div>

        {/* Pulsing Badge */}
        <span
          className={`shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider uppercase ${
            time.isExpired
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              : "bg-amber-500/20 text-amber-300 border-amber-500/30"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full animate-ping ${
              time.isExpired ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          <span>{time.isExpired ? "LIVE NOW" : "DROPPING IN"}</span>
        </span>
      </div>

      {/* 4-Segment Countdown Timer */}
      {!time.isExpired ? (
        <div className="grid grid-cols-4 gap-2 pt-1">
          {[
            { label: "DAYS", value: time.days },
            { label: "HOURS", value: time.hours },
            { label: "MINS", value: time.minutes },
            { label: "SECS", value: time.seconds },
          ].map((item, i) => (
            <div
              key={item.label}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm"
            >
              <span className="font-mono text-base sm:text-lg font-black tracking-tight text-white">
                {String(item.value).padStart(2, "0")}
              </span>
              <span className="text-[9px] font-bold tracking-widest text-zinc-400">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Launch is currently LIVE! Click to access now.</span>
          </div>
          <ArrowRight className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
