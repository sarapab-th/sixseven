/**
 * How a quote request reaches the shop.
 *
 * Tries, in order:
 *   1. Resend      — set RESEND_API_KEY (no extra dependency, plain HTTP)
 *   2. SMTP        — set SMTP_HOST, SMTP_USER, SMTP_PASS (uses nodemailer)
 *   3. A local log — storage/quote-requests.jsonl
 *
 * Step 3 means nothing is ever silently lost while you are still setting the
 * site up: the request lands on disk even with no mail provider configured.
 */

import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { site } from "~/config/site";

export interface MailMessage {
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export type MailResult = { delivered: boolean; via: "resend" | "smtp" | "log"; error?: string };

const LOG_PATH = path.join(process.cwd(), "storage", "quote-requests.jsonl");

export async function sendToShop(message: MailMessage, record: unknown): Promise<MailResult> {
  // Always keep a local copy — it costs nothing and has saved many a lost order.
  await logLocally(record);

  const from = process.env.MAIL_FROM ?? `SixSeven Website <onboarding@resend.dev>`;
  const to = process.env.MAIL_TO ?? site.contact.orders;

  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from, to: [to], subject: message.subject,
          html: message.html, text: message.text,
          ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        }),
      });

      if (response.ok) return { delivered: true, via: "resend" };
      return { delivered: false, via: "resend", error: `Resend returned ${response.status}` };
    } catch (error) {
      return { delivered: false, via: "resend", error: String(error) };
    }
  }

  if (process.env.SMTP_HOST) {
    try {
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });

      await transport.sendMail({
        from, to, subject: message.subject,
        html: message.html, text: message.text, replyTo: message.replyTo,
      });
      return { delivered: true, via: "smtp" };
    } catch (error) {
      return { delivered: false, via: "smtp", error: String(error) };
    }
  }

  return { delivered: false, via: "log" };
}

async function logLocally(record: unknown) {
  try {
    await mkdir(path.dirname(LOG_PATH), { recursive: true });
    await appendFile(LOG_PATH, `${JSON.stringify(record)}\n`, "utf8");
  } catch (error) {
    console.error("[sixseven] could not write the quote log:", error);
  }
}
