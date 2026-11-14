"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "./ui";
import { clsx } from "@/lib/clsx";
import { site } from "~/config/site";

export function ContactForm() {
  const t = useTranslations("quote.form");
  const ts = useTranslations("quote.success");
  const tc = useTranslations("contact");
  const locale = useLocale();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const honeypot = useRef<HTMLInputElement>(null);
  const openedAt = useRef(Date.now());

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t("errorRequired");
    if (!message.trim()) next.message = t("errorRequired");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) next.email = t("errorEmail");
    if (!email.trim() && !phone.trim()) next.contact = t("errorContact");
    if (!consent) next.consent = t("errorConsent");

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      const form = new FormData();
      form.set("kind", "contact");
      form.set("locale", locale);
      form.set("name", name.trim());
      form.set("email", email.trim());
      form.set("phone", phone.trim());
      form.set("notes", message.trim());
      form.set("total", "0");
      form.set("lines", JSON.stringify([]));
      form.set("website", honeypot.current?.value ?? "");
      form.set("elapsed", String(Date.now() - openedAt.current));

      const response = await fetch("/api/quote", { method: "POST", body: form });
      if (!response.ok) throw new Error(String(response.status));

      const data = (await response.json()) as { reference: string };
      setReference(data.reference);
    } catch {
      setErrors({ submit: t("errorSubmit") });
    } finally {
      setBusy(false);
    }
  }

  if (reference) {
    return (
      <Card className="p-7 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-cyan/40 bg-cyan/10">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-cyan" aria-hidden="true">
            <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mt-4 font-display text-xl font-bold">{ts("title")}</h3>
        <p className="mt-2 text-sm text-muted">{ts("subtitle", { ref: reference })}</p>
        <a href={site.contact.lineUrl} target="_blank" rel="noopener noreferrer" className="btn btn-line mt-6">
          {ts("lineButton")}
        </a>
      </Card>
    );
  }

  return (
    <Card className="p-5 md:p-6">
      <h2 className="font-display text-xl font-bold">{tc("formTitle")}</h2>
      <p className="mt-1.5 text-sm text-muted">{tc("formSubtitle")}</p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="c-name">{t("name")}</label>
            <input id="c-name" className={clsx("field", errors.name && "field-error")} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>
          <div>
            <label className="label" htmlFor="c-phone">{t("phone")}</label>
            <input id="c-phone" className={clsx("field", errors.contact && "field-error")} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="c-email">{t("email")}</label>
          <input id="c-email" type="email" className={clsx("field", (errors.email || errors.contact) && "field-error")} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          {errors.contact && <p className="mt-1 text-xs text-red-400">{errors.contact}</p>}
        </div>

        <div>
          <label className="label" htmlFor="c-message">{t("notes")}</label>
          <textarea id="c-message" rows={5} className={clsx("field resize-y", errors.message && "field-error")} value={message} onChange={(e) => setMessage(e.target.value)} />
          {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
        </div>

        <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-px w-px opacity-0" />

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-cyan" />
          <span className={clsx("leading-relaxed", errors.consent ? "text-red-400" : "text-muted")}>{t("consent")}</span>
        </label>

        {errors.submit && (
          <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
            {errors.submit}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
          {busy ? t("submitting") : t("submit")}
        </button>
      </form>
    </Card>
  );
}
