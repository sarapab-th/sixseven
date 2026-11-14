import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { PageHero } from "@/components/PageHero";
import { Card, Pill } from "@/components/ui";
import { ContactForm } from "@/components/ContactForm";
import { Photo } from "@/components/Photo";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { site } from "~/config/site";
import { PHOTOS } from "~/config/photos";

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.contact" });
  return buildMetadata({
    locale: locale as Locale, path: "/contact",
    title: t("title"), description: t("description"),
  });
}

/** Day names in the visitor's own language, with no extra translation keys. */
function dayName(day: string, locale: string): string {
  const index = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(day);
  if (index === -1) return day;
  // 2024-01-07 was a Sunday, so +index lands on the right weekday
  const date = new Date(Date.UTC(2024, 0, 7 + index));
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    weekday: "short",
    timeZone: "UTC",
  }).format(date);
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "contact" });
  const tn = await getTranslations({ locale, namespace: "nav" });

  const methods = [
    {
      label: t("lineLabel"),
      value: site.contact.lineId,
      detail: t("lineValue"),
      href: site.contact.lineUrl,
      external: true,
      highlight: true,
    },
    { label: t("phoneLabel"), value: site.contact.phone, href: `tel:${site.contact.phoneRaw}` },
    { label: t("emailLabel"), value: site.contact.email, href: `mailto:${site.contact.email}` },
  ];

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />

      <div className="container-x py-14 pb-28">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
          {/* ---- details ---- */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <Photo
                src={PHOTOS.contactShop.src}
                alt={PHOTOS.contactShop.alt[locale as Locale] ?? PHOTOS.contactShop.alt.en}
                tint={0.45}
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="aspect-[16/9] w-full"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface via-ink/40 to-transparent" />
              </Photo>
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-lg font-bold">{t("reachUs")}</h2>

              <ul className="mt-4 space-y-3">
                {methods.map((method) => (
                  <li key={method.label}>
                    <a
                      href={method.href}
                      {...(method.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="flex items-start justify-between gap-4 rounded-xl border border-line-strong bg-white/[0.03] px-4 py-3.5 transition-colors hover:border-cyan/40 hover:bg-cyan/[0.06]"
                    >
                      <span className="min-w-0">
                        <span className="block text-xs uppercase tracking-wide text-muted-2">{method.label}</span>
                        <span className="mt-1 block truncate font-display text-base font-semibold text-paper">
                          {method.value}
                        </span>
                        {method.detail && <span className="mt-0.5 block text-xs text-muted">{method.detail}</span>}
                      </span>
                      {method.highlight && <Pill tone="cyan">{t("fastest")}</Pill>}
                    </a>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs leading-relaxed text-muted-2">{t("fastestDetail")}</p>
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-lg font-bold">{t("visit")}</h2>
              <address className="mt-3 not-italic leading-relaxed text-muted">
                {site.address.street}
                <br />
                {site.address.district}, {site.address.city} {site.address.postalCode}
                <br />
                {site.address.countryName}
              </address>
              <a
                href={site.address.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost mt-5 !py-2.5 text-sm"
              >
                {t("getDirections")}
              </a>
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-lg font-bold">{t("hours")}</h2>
              <dl className="mt-4 space-y-2">
                {site.hours.map((slot) => (
                  <div key={slot.days.join()} className="flex items-baseline justify-between gap-4 border-b border-line pb-2 last:border-0">
                    <dt className="text-sm text-muted">
                      {slot.days.length > 1
                        ? `${dayName(slot.days[0], locale)} – ${dayName(slot.days[slot.days.length - 1], locale)}`
                        : dayName(slot.days[0], locale)}
                    </dt>
                    <dd className="font-display text-sm font-semibold tabular-nums">
                      {slot.opens} – {slot.closes}
                    </dd>
                  </div>
                ))}
                {site.closedDays.map((day) => (
                  <div key={day} className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm text-muted">{dayName(day, locale)}</dt>
                    <dd className="text-sm text-muted-2">{t("closed")}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>

          {/* ---- form ---- */}
          <div>
            <ContactForm />
          </div>
        </div>
      </div>

      <JsonLd
        data={breadcrumbJsonLd(locale as Locale, [
          { name: tn("home"), path: "" },
          { name: tn("contact"), path: "/contact" },
        ])}
      />
    </>
  );
}
