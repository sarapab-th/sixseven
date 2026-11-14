import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 — people read these aloud

/** A short human reference like SS-261113-K7Q4 */
export function makeReference(date = new Date()): string {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  const bytes = randomBytes(4);
  let suffix = "";
  for (const byte of bytes) suffix += ALPHABET[byte % ALPHABET.length];

  return `SS-${yy}${mm}${dd}-${suffix}`;
}

/** An unguessable token used in download links. */
export function makeToken(): string {
  return randomBytes(16).toString("hex");
}
