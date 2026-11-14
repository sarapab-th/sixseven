import { CURRENCY_SYMBOL } from "~/config/pricing";

/** Money, rounded to whole baht — satang are not used in print shops. */
export function thb(amount: number): string {
  const rounded = Math.round(amount);
  return `${CURRENCY_SYMBOL}${rounded.toLocaleString("en-US")}`;
}

/** Money with decimals, for per-page rates below ฿10. */
export function thbPrecise(amount: number): string {
  const decimals = amount < 10 ? 2 : 0;
  return `${CURRENCY_SYMBOL}${amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function grams(value: number): string {
  return value < 10 ? `${value.toFixed(1)} g` : `${Math.round(value)} g`;
}

export function hours(value: number): string {
  if (value < 1) return `${Math.max(1, Math.round(value * 60))} min`;
  if (value < 10) return `${value.toFixed(1)} h`;
  return `${Math.round(value)} h`;
}

export function mm(value: number): string {
  return `${value < 10 ? value.toFixed(1) : Math.round(value)}`;
}

export function cm3(value: number): string {
  return value < 10 ? value.toFixed(2) : value.toFixed(1);
}
