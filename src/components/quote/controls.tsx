"use client";

import type { ReactNode } from "react";
import { clsx } from "@/lib/clsx";

export function Field({
  label, hint, children, className,
}: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <span className="label">{label}</span>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-muted-2">{hint}</p>}
    </div>
  );
}

export interface Option<T> {
  value: T;
  name: string;
  detail?: string;
  disabled?: boolean;
  /** Shown on the right-hand side, e.g. a price */
  meta?: string;
}

export function OptionGrid<T extends string | number>({
  options, value, onChange, columns = 2, name,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: 1 | 2 | 3;
  name: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={clsx(
        "grid gap-2",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-2 sm:grid-cols-3",
      )}
    >
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          disabled={option.disabled}
          data-selected={option.value === value}
          onClick={() => onChange(option.value)}
          className="option"
        >
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-display text-sm font-semibold leading-tight">{option.name}</span>
            {option.meta && <span className="shrink-0 text-xs tabular-nums text-cyan">{option.meta}</span>}
          </span>
          {option.detail && (
            <span className="text-[0.6875rem] leading-snug text-muted-2">{option.detail}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function NumberStepper({
  value, onChange, min = 1, max = 9999, step = 1, label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)));

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-line-strong bg-white/5">
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        aria-label={`${label} −`}
        className="w-11 shrink-0 text-lg text-muted transition-colors hover:bg-white/5 hover:text-paper disabled:opacity-30"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        aria-label={label}
        onChange={(e) => onChange(clamp(Number(e.target.value) || min))}
        className="w-full border-x border-line-strong bg-transparent py-2.5 text-center tabular-nums text-paper outline-none [appearance:textfield] focus:bg-cyan/5 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        aria-label={`${label} +`}
        className="w-11 shrink-0 text-lg text-muted transition-colors hover:bg-white/5 hover:text-paper disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}

export function RangeControl({
  value, onChange, min, max, step, format, label,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  label: string;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="font-display text-sm font-bold tabular-nums text-cyan">{format(value)}</span>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function Toggle({
  checked, onChange, label, hint,
}: { checked: boolean; onChange: (checked: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line-strong bg-white/[0.03] p-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.06]">
      <span className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="block h-5 w-9 rounded-full bg-white/15 transition-colors peer-checked:bg-cyan peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-paper">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-relaxed text-muted-2">{hint}</span>}
      </span>
    </label>
  );
}

export function CheckboxList({
  options, values, onChange, name,
}: {
  options: Option<string>[];
  values: string[];
  onChange: (values: string[]) => void;
  name: string;
}) {
  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label={name}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={values.includes(option.value)}
          data-selected={values.includes(option.value)}
          onClick={() => toggle(option.value)}
          className="option"
        >
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-display text-sm font-semibold leading-tight">{option.name}</span>
            {option.meta && <span className="shrink-0 text-xs tabular-nums text-cyan">{option.meta}</span>}
          </span>
          {option.detail && (
            <span className="text-[0.6875rem] leading-snug text-muted-2">{option.detail}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function ColorSwatches({
  colors, value, onChange,
}: { colors: readonly string[]; value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={color}
          aria-pressed={color === value}
          onClick={() => onChange(color)}
          style={{ backgroundColor: color }}
          className={clsx(
            "h-8 w-8 rounded-full border-2 transition-all",
            color === value
              ? "scale-110 border-cyan shadow-[0_0_14px_-2px_#00e5ff]"
              : "border-white/20 hover:scale-105 hover:border-white/50",
          )}
        />
      ))}
    </div>
  );
}
