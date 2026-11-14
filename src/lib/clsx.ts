type ClassValue = string | number | null | false | undefined | ClassValue[] | Record<string, boolean | undefined | null>;

/** Tiny class-name joiner — no dependency needed for what we use it for. */
export function clsx(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string" || typeof input === "number") {
      out.push(String(input));
    } else if (Array.isArray(input)) {
      const nested = clsx(...input);
      if (nested) out.push(nested);
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) if (value) out.push(key);
    }
  }
  return out.join(" ");
}
