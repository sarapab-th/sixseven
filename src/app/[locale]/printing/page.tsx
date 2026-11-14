import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PageHero } from "@/components/PageHero";
import { Section, SectionHead, Card, Arrow, Pill } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd, servicesJsonLd } from "@/lib/seo";
import { thbPrecise } from "@/lib/format";
import { PRINT_TIERS, PAPER_STOCKS, COPY_SERVICE } from "~/config/pricing";

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.digitalPrinting" });
  return buildMetadata({
    locale: locale as Locale, path: "/printing",
    title: t("title"), description: t("description"),
  });
}

export default async function PrintingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tn = await getTranslations({ locale, namespace: "nav" });
  const tm = await getTranslations({ locale, namespace: "meta.digitalPrinting" });

  return (
    <>
      <Content />
      <JsonLd
        data={[
          breadcrumbJsonLd(locale as Locale, [
            { name: tn("home"), path: "" },
            { name: tn("digitalPrinting"), path: "/printing" },
          ]),
          servicesJsonLd(locale as Locale, [
            { name: tm("title"), description: tm("description"), path: "/printing" },
          ]),
        ]}
      />
    </>
  );
}

const SERVICES = ["copy", "scan", "bind", "laminate", "stock", "finish"] as const;

function Content() {
  const t = useTranslations("digitalPrinting");
  const tst = useTranslations("paperStocks");
  const tscan = useTranslations("digitalPrinting.services.items.scan");
  const tsum = useTranslations("quote.print.summary");
  const tc = useTranslations("common");

  const thresholds = PRINT_TIERS.a4.bw.map((tier) => tier.from);

  return (
    <>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} subtitle={t("hero.subtitle")} />

      {/* ---------------- price table ---------------- */}
      <Section aurora>
        <SectionHead title={t("pricing.title")} subtitle={t("pricing.subtitle")} />

        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line-strong">
                <th className="pb-3 pr-4 font-display text-xs font-semibold uppercase tracking-[0.12em] text-muted-2">
                  {t("pricing.colQuantity")}
                </th>
                {[t("pricing.a4bw"), t("pricing.a4color"), t("pricing.a3bw"), t("pricing.a3color")].map((h) => (
                  <th key={h} className="pb-3 pr-4 font-display text-xs font-semibold uppercase tracking-[0.12em] text-muted-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {thresholds.map((from, index) => {
                const next = thresholds[index + 1];
                const range = next
                  ? `${from.toLocaleString("en-US")} – ${(next - 1).toLocaleString("en-US")}`
                  : `${from.toLocaleString("en-US")}+`;

                return (
                  <tr key={from} className="border-b border-line transition-colors hover:bg-white/[0.03]">
                    <td className="py-4 pr-4">
                      <span className="font-display text-sm font-bold tabular-nums">{range}</span>
                      <span className="ml-1.5 text-xs text-muted-2">{t("pricing.sheets")}</span>
                    </td>
                    {([
                      PRINT_TIERS.a4.bw[index], PRINT_TIERS.a4.color[index],
                      PRINT_TIERS.a3.bw[index], PRINT_TIERS.a3.color[index],
                    ]).map((tier, column) => (
                      <td key={column} className="py-4 pr-4">
                        <span className="font-display text-sm font-bold tabular-nums text-paper">
                          {thbPrecise(tier.price)}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-5 text-xs leading-relaxed text-muted-2">{t("pricing.note")}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "A4", value: thbPrecise(COPY_SERVICE.scanPerPage.a4), note: tscan("title"), key: "scan-a4" },
            { label: "A3", value: thbPrecise(COPY_SERVICE.scanPerPage.a3), note: tscan("title"), key: "scan-a3" },
            { label: "—", value: thbPrecise(COPY_SERVICE.handlingPerOriginal), note: tsum("copyHandling"), key: "handling" },
          ].map((item) => (
            <Card key={item.key} className="flex items-baseline justify-between gap-3 p-4">
              <span className="text-sm text-muted">
                {item.label !== "—" && <Pill tone="cyan">{item.label}</Pill>} {item.note}
              </span>
              <span className="brand-text font-display text-lg font-bold tabular-nums">{item.value}</span>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------------- counter services ---------------- */}
      <Section className="border-y border-line bg-ink-2/40">
        <SectionHead title={t("services.title")} />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((key) => (
            <Card key={key} interactive className="p-6">
              <h3 className="font-display text-lg font-bold">{t(`services.items.${key}.title`)}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">
                {t(`services.items.${key}.description`)}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------------- paper stocks ---------------- */}
      <Section>
        <SectionHead title={t("stocks.title")} subtitle={t("stocks.subtitle")} />

        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line-strong">
                {[t("stocks.colStock"), t("stocks.colWeight"), t("stocks.colBest"), t("stocks.colMultiplier")].map((h) => (
                  <th key={h} className="pb-3 pr-4 font-display text-xs font-semibold uppercase tracking-[0.12em] text-muted-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PAPER_STOCKS.map((stock) => (
                <tr key={stock.id} className="border-b border-line transition-colors hover:bg-white/[0.03]">
                  <td className="py-4 pr-4 font-display text-sm font-bold">{tst(`${stock.id}.name`)}</td>
                  <td className="py-4 pr-4 text-sm tabular-nums text-muted">{stock.gsm} gsm</td>
                  <td className="py-4 pr-4 text-sm text-muted">{tst(`${stock.id}.detail`)}</td>
                  <td className="py-4 pr-4">
                    <span className="font-display text-sm font-bold tabular-nums text-cyan">
                      ×{stock.multiplier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 text-xs text-muted-2">{tc("vat")}</p>
      </Section>

      {/* ---------------- CTA ---------------- */}
      <Section aurora className="overflow-hidden pb-28">
        <Card className="relative px-6 py-14 text-center md:px-16">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative">
            <h2 className="font-display text-[clamp(1.75rem,4vw,2.6rem)] font-bold">{t("cta.title")}</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted">{t("cta.subtitle")}</p>
            <Link href="/quote?type=print" className="btn btn-primary mt-8">
              {t("cta.button")}
              <Arrow />
            </Link>
          </div>
        </Card>
      </Section>
    </>
  );
}
