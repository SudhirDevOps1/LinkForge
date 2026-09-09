"use client";

// =============================================================================
// 🧩 LinkForge UI Primitives — compact, cohesive design system
// (tailwind-based, zero heavy deps)
// =============================================================================
import { Loader2, X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";

// Re-export taaki purane `import { cn } from "@/components/ui"` kaam karte rahein
export { cn };

// ---- Button ----------------------------------------------------------------
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-violet-500 text-white hover:bg-violet-400 shadow-[0_0_24px_rgba(139,92,246,.35)] border border-violet-400/50",
  secondary: "bg-white/10 text-white hover:bg-white/15 border border-white/10",
  outline: "bg-transparent text-zinc-200 hover:bg-white/5 border border-white/15",
  ghost: "bg-transparent text-zinc-300 hover:bg-white/5 border border-transparent",
  danger: "bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-9 w-9 p-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 select-none",
        "focus-ring disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

// ---- Inputs ------------------------------------------------------------------
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 text-sm text-white",
        "placeholder:text-zinc-500 transition-colors focus-ring focus:border-violet-400/50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[88px] w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white",
        "placeholder:text-zinc-500 transition-colors focus-ring focus:border-violet-400/50 resize-y",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full appearance-none rounded-xl border border-white/10 bg-ink-800 px-3.5 text-sm text-white",
        "focus-ring cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

// ---- Card ---------------------------------------------------------------------
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("glass rounded-2xl p-5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ---- Badge ---------------------------------------------------------------------
export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "default" | "green" | "violet" | "amber" }) {
  const tones = {
    default: "bg-white/10 text-zinc-300 border-white/10",
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    violet: "bg-violet-500/15 text-violet-300 border-violet-500/25",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

// ---- Switch ---------------------------------------------------------------------
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? "toggle"}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-ring",
        checked ? "bg-violet-500" : "bg-white/15",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

// ---- Tabs -----------------------------------------------------------------------
export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: Array<{ id: string; label: string; icon?: React.ReactNode }>;
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-1.5", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all focus-ring",
            active === tab.id
              ? "bg-violet-500 text-white shadow-[0_0_18px_rgba(139,92,246,.4)]"
              : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ---- Dialog ---------------------------------------------------------------------
export function Dialog({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full rounded-t-3xl border border-white/10 bg-ink-850 p-6 shadow-2xl sm:rounded-3xl",
          wide ? "sm:max-w-2xl" : "sm:max-w-md",
          "max-h-[92vh] overflow-y-auto",
        )}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white focus-ring"
            aria-label="Close dialog"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---- Stat card -------------------------------------------------------------------
export function StatCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-white">{value}</p>
          {sub ? <p className="mt-1 text-xs text-zinc-500">{sub}</p> : null}
        </div>
        <div className="rounded-xl bg-violet-500/15 p-2.5 text-violet-300">{icon}</div>
      </div>
    </Card>
  );
}
