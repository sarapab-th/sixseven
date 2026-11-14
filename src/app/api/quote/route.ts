import { NextResponse } from "next/server";
import { z } from "zod";

import { makeReference } from "@/lib/reference";
import { saveUpload } from "@/lib/storage";
import { sendToShop } from "@/lib/mailer";
import { renderQuoteEmail } from "@/lib/quote-email";
import { extensionOf } from "@/lib/mesh";
import { site } from "~/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------
 * A small in-memory rate limit. It resets when the server restarts and
 * is per-instance, which is exactly right for a shop this size: it stops
 * someone hammering the form without needing Redis.
 * ------------------------------------------------------------------ */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  if (hits.size > 5000) hits.clear(); // crude ceiling so this cannot grow forever
  return recent.length > MAX_PER_WINDOW;
}

const lineSchema = z.object({
  label: z.string().max(120),
  value: z.string().max(240),
});

const schema = z.object({
  kind: z.enum(["3d", "print", "contact"]),
  locale: z.string().max(8),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().max(160).refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), "invalid email"),
  phone: z.string().trim().max(60),
  notes: z.string().trim().max(4000),
  total: z.coerce.number().min(0).max(10_000_000),
  lines: z.array(lineSchema).max(40),
});

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Could not read the form" }, { status: 400 });
  }

  // Spam traps. Both answer with a plausible reference so a bot learns nothing,
  // but nothing is stored and no mail goes out.
  const honeypot = String(form.get("website") ?? "");
  const elapsed = Number(form.get("elapsed") ?? 0);
  if (honeypot.trim() !== "" || (Number.isFinite(elapsed) && elapsed > 0 && elapsed < 1500)) {
    return NextResponse.json({ reference: makeReference() });
  }

  let data: z.infer<typeof schema>;
  try {
    data = schema.parse({
      kind: form.get("kind"),
      locale: form.get("locale"),
      name: form.get("name"),
      email: form.get("email") ?? "",
      phone: form.get("phone") ?? "",
      notes: form.get("notes") ?? "",
      total: form.get("total"),
      lines: JSON.parse(String(form.get("lines") ?? "[]")),
    });
  } catch {
    return NextResponse.json({ error: "Invalid submission" }, { status: 422 });
  }

  if (!data.email && !data.phone) {
    return NextResponse.json({ error: "A contact method is required" }, { status: 422 });
  }

  const reference = makeReference();

  /* ---------------- the attachment, if there is one ---------------- */
  let stored: Awaited<ReturnType<typeof saveUpload>> | null = null;
  const file = form.get("file");

  if (file instanceof File && file.size > 0) {
    const allowed = [...site.upload.model3dExtensions, ...site.upload.documentExtensions] as readonly string[];
    const ext = extensionOf(file.name);

    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: `File type ${ext} is not accepted` }, { status: 415 });
    }
    if (file.size > site.upload.maxFileSizeMb * 1024 * 1024) {
      return NextResponse.json({ error: "File is too large" }, { status: 413 });
    }

    try {
      const origin = new URL(request.url).origin;
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin;
      stored = await saveUpload(file, baseUrl);
    } catch (error) {
      console.error("[sixseven] upload failed:", error);
      return NextResponse.json({ error: "Could not store the file" }, { status: 500 });
    }
  }

  /* ---------------- tell the shop ---------------- */
  const payload = {
    reference,
    kind: data.kind,
    locale: data.locale,
    name: data.name,
    email: data.email,
    phone: data.phone,
    notes: data.notes,
    total: data.total,
    lines: data.lines,
    fileUrl: stored?.url,
    fileName: stored?.originalName,
    fileSizeMb: stored ? (stored.sizeBytes / (1024 * 1024)).toFixed(2) : undefined,
    receivedAt: new Date().toISOString(),
    ip,
  };

  const message = renderQuoteEmail(payload);
  const result = await sendToShop(
    { ...message, replyTo: data.email || undefined },
    payload,
  );

  if (!result.delivered) {
    // The request is safely on disk either way, so the customer still gets a
    // reference — we just make the failure loud in the server log.
    console.warn(`[sixseven] ${reference} not emailed (via ${result.via}): ${result.error ?? "no mail provider configured"}`);
  }

  return NextResponse.json({ reference });
}
