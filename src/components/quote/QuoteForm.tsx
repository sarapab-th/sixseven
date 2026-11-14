"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, Row } from "@/components/ui";
import { clsx } from "@/lib/clsx";
import { thb } from "@/lib/format";
import { site } from "~/config/site";

export interface QuoteLine {
  label: string;
  value: string;
}

export interface QuotePayload {
  kind: "3d" | "print";
  file: File | null;
  summary: { total: number; lines: QuoteLine[] };
}

type Errors = Partial<Record<"name" | "email" | "contact" | "consent" | "submit", string>>;

export function QuoteForm({ payload }: { payload: QuotePayload }) {
  const t = useTranslations("quote.form");
  const ts = useTranslations("quote.success");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  // Bots fill every field they find; people never see this one.
  const honeypot = useRef<HTMLInputElement>(null);
  const openedAt = useRef(Date.now());

  function validate(): boolean {
    const next: Errors = {};
    if (!name.trim()) next.name = t("errorRequired");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) next.email = t("errorEmail");
    if (!email.trim() && !phone.trim()) next.contact = t("errorContact");
    if (!consent) next.consent = t("errorConsent");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!validate()) return;

    setBusy(true);
    setErrors({});

    try {
      const form = new FormData();
      form.set("kind", payload.kind);
      form.set("locale", locale);
      form.set("name", name.trim());
      form.set("email", email.trim());
      form.set("phone", phone.trim());
      form.set("notes", notes.trim());
      form.set("total", String(Math.round(payload.summary.total)));
      form.set("lines", JSON.stringify(payload.summary.lines));
      form.set("website", honeypot.current?.value ?? "");
      form.set("elapsed", String(Date.now() - openedAt.current));
      if (payload.file) form.set("file", payload.file, payload.file.name);

      const response = await fetch("/api/quote", { method: "POST", body: form });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

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
      <Card className="relative overflow-hidden p-7 text-center md:p-10">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-cyan/40 bg-cyan/10">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-cyan" aria-hidden="true">
              <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h3 className="mt-5 font-display text-2xl font-bold">{ts("title")}</h3>
          <p className="mt-2 text-sm text-muted">{ts("subtitle", { ref: reference })}</p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-2">
            {ts("body", { contact: email.trim() || phone.trim() })}
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a href={site.contact.lineUrl} target="_blank" rel="noopener noreferrer" className="btn btn-line">
              {ts("lineButton")}
            </a>
            <button type="button" onClick={() => window.location.reload()} className="btn btn-ghost">
              {ts("again")}
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 md:p-6">
      <h3 className="font-display text-xl font-bold">{t("title")}</h3>
      <p className="mt-1.5 text-sm text-muted">{t("subtitle")}</p>

      <div className="mt-5 rounded-xl border border-line bg-white/[0.03] p-4">
        {payload.summary.lines.slice(0, 6).map((line) => (
          <Row key={line.label} label={line.label} value={line.value} muted />
        ))}
        <div className="rule-fade my-2" />
        <Row label={tc("total")} value={thb(payload.summary.total)} accent strong />
        {payload.file && (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-2">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-cyan" aria-hidden="true">
              <path d="M9 2v4h4M9 2H4.5A1.5 1.5 0 0 0 3 3.5v9A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V6L9 2Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
            {payload.file.name} · {t("attachModel")}
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="q-name">{t("name")}</label>
            <input
              id="q-name"
              className={clsx("field", errors.name && "field-error")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label className="label" htmlFor="q-phone">{t("phone")}</label>
            <input
              id="q-phone"
              className={clsx("field", errors.contact && "field-error")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              inputMode="tel"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="q-email">{t("email")}</label>
          <input
            id="q-email"
            type="email"
            className={clsx("field", (errors.email || errors.contact) && "field-error")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          {errors.contact && <p className="mt-1 text-xs text-red-400">{errors.contact}</p>}
        </div>

        <div>
          <label className="label" htmlFor="q-notes">
            {t("notes")} <span className="font-normal text-muted-2">({tc("optional")})</span>
          </label>
          <textarea
            id="q-notes"
            rows={4}
            className="field resize-y"
            placeholder={t("notesPlaceholder")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* honeypot — hidden from people, irresistible to bots */}
        <input
          ref={honeypot}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-px w-px opacity-0"
        />

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-cyan"
          />
          <span className={clsx("leading-relaxed", errors.consent ? "text-red-400" : "text-muted")}>
            {t("consent")}
          </span>
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
