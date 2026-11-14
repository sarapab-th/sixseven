import type { ReactNode } from "react";
import { clsx } from "@/lib/clsx";

export function Section({
  children, className, id, aurora = false,
}: { children: ReactNode; className?: string; id?: string; aurora?: boolean }) {
  return (
    <section
      id={id}
      className={clsx("relative py-20 md:py-28", aurora && "aurora overflow-hidden", className)}
    >
      <div className="container-x relative z-10">{children}</div>
    </section>
  );
}

export function SectionHead({
  eyebrow, title, subtitle, align = "left", className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <header
      className={clsx(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className={clsx("eyebrow", align === "center" && "justify-center")}>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_10px_2px_#00e5ff]" />
          {eyebrow}
        </p>
      )}
      <h2 className="chroma mt-4 font-display text-[clamp(1.85rem,4vw,2.8rem)] font-bold leading-[1.12] tracking-tight">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-muted">{subtitle}</p>}
    </header>
  );
}

export function Card({
  children, className, interactive = false,
}: { children: ReactNode; className?: string; interactive?: boolean }) {
  return (
    <div
      className={clsx(
        "panel relative overflow-hidden rounded-2xl",
        interactive && "transition-all duration-300 hover:border-cyan/35 hover:bg-white/[0.07]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "cyan" | "magenta" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium leading-none",
        tone === "neutral" && "border-line-strong bg-white/5 text-muted",
        tone === "cyan" && "border-cyan/35 bg-cyan/10 text-cyan",
        tone === "magenta" && "border-magenta/35 bg-magenta/10 text-magenta",
      )}
    >
      {children}
    </span>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <p className="brand-text font-display text-[clamp(1.8rem,4vw,2.5rem)] font-bold leading-none">
        {value}
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-2">{label}</p>
    </div>
  );
}

/** A tidy label/value row, used in every price breakdown on the site. */
export function Row({
  label, value, muted = false, strong = false, accent = false,
}: { label: ReactNode; value: ReactNode; muted?: boolean; strong?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className={clsx("text-sm", muted ? "text-muted-2" : "text-muted", strong && "font-semibold text-paper")}>
        {label}
      </span>
      <span
        className={clsx(
          "shrink-0 text-sm tabular-nums",
          accent ? "brand-text font-display text-lg font-bold" : strong ? "font-semibold text-paper" : "text-paper",
          muted && !strong && !accent && "text-muted-2",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={clsx("h-4 w-4 shrink-0", className)} aria-hidden="true">
      <path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={clsx("h-4 w-4", className)} aria-hidden="true">
      <path d="M3 8 H13 M9 4 L13 8 L9 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
