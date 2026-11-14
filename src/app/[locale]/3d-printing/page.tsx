import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PageHero } from "@/components/PageHero";
import { Section, SectionHead, Card, Pill, Arrow } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd, servicesJsonLd } from "@/lib/seo";
import { thbPrecise } from "@/lib/format";
import { MATERIALS, PROCESSES } from "~/config/pricing";

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.printing3d" });
  return buildMetadata({
    locale: locale as Locale, path: "/3d-printing",
    title: t("title"), description: t("description"),
  });
}

export default async function Printing3DPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tn = await getTranslations({ locale, namespace: "nav" });
  const tm = await getTranslations({ locale, namespace: "meta.printing3d" });

  return (
    <>
      <Content />
      <JsonLd
        data={[
          breadcrumbJsonLd(locale as Locale, [
            { name: tn("home"), path: "" },
            { name: tn("printing3d"), path: "/3d-printing" },
          ]),
          servicesJsonLd(locale as Locale, [
            { name: tm("title"), description: tm("description"), path: "/3d-printing" },
          ]),
        ]}
      />
    </>
  );
}

const GUIDELINES = ["wall", "hole", "overhang", "text", "clearance", "size"] as const;

function RatingBar({ value, tone }: { value: number; tone: "cyan" | "magenta" | "violet" }) {
  const colors = { cyan: "bg-cyan", magenta: "bg-magenta", violet: "bg-violet" };
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-1.5 w-2.5 rounded-full ${n <= value ? colors[tone] : "bg-white/12"}`}
        />
      ))}
    </span>
  );
}

function Content() {
  const t = useTranslations("printing3d");
  const tm = useTranslations("materials");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;

  return (
    <>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} subtitle={t("hero.subtitle")} />

      {/* ---------------- processes ---------------- */}
      <Section aurora>
        <SectionHead title={t("processes.title")} />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {(["fdm", "sla"] as const).map((id) => (
            <Card key={id} className="flex flex-col p-7 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl font-bold">{t(`processes.${id}.name`)}</h3>
                  <p className="mt-1 text-sm text-cyan">{t(`processes.${id}.tagline`)}</p>
                </div>
                <Pill tone={id === "sla" ? "magenta" : "cyan"}>
                  {id === "sla" ? "Resin" : "Filament"}
                </Pill>
              </div>

              <p className="mt-5 flex-1 text-[0.9375rem] leading-relaxed text-muted">
                {t(`processes.${id}.description`)}
              </p>

              <p className="mt-5 rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-sm text-paper/90">
                {t(`processes.${id}.bestFor`)}
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
                {([1, 2, 3, 4] as const).map((n) => (
                  <div key={n} className="bg-surface px-4 py-3">
                    <dt className="text-[0.6875rem] uppercase tracking-wide text-muted-2">
                      {t(`processes.${id}.spec${n}`)}
                    </dt>
                    <dd className="mt-1 font-display text-sm font-bold">
                      {t(`processes.${id}.spec${n}Value`)}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------------- materials ---------------- */}
      <Section className="border-y border-line bg-ink-2/40">
        <SectionHead title={t("materialsTable.title")} subtitle={t("materialsTable.subtitle")} />

        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line-strong">
                {[
                  t("materialsTable.colMaterial"), t("materialsTable.colProcess"),
                  t("materialsTable.colPrice"), t("materialsTable.colStrength"),
                  t("materialsTable.colDetail"), t("materialsTable.colHeat"),
                ].map((heading) => (
                  <th key={heading} className="pb-3 pr-4 font-display text-xs font-semibold uppercase tracking-[0.12em] text-muted-2">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATERIALS.map((material) => (
                <tr key={material.id} className="border-b border-line transition-colors hover:bg-white/[0.03]">
                  <td className="py-4 pr-4">
                    <p className="font-display text-sm font-bold">{tm(`${material.id}.name`)}</p>
                    <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-2">
                      {(material.tags[locale] ?? material.tags.en).join(" · ")}
                    </p>
                  </td>
                  <td className="py-4 pr-4">
                    <Pill tone={material.process === "sla" ? "magenta" : "cyan"}>
                      {material.process === "sla" ? "Resin" : "FDM"}
                    </Pill>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="font-display text-sm font-bold tabular-nums">
                      {thbPrecise(material.pricePerGram)}
                    </span>
                    <span className="ml-1 text-xs text-muted-2">/g</span>
                  </td>
                  <td className="py-4 pr-4"><RatingBar value={material.ratings.strength} tone="cyan" /></td>
                  <td className="py-4 pr-4"><RatingBar value={material.ratings.detail} tone="magenta" /></td>
                  <td className="py-4 pr-4"><RatingBar value={material.ratings.heat} tone="violet" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-5 text-xs text-muted-2">
          {tc("vat")} · {PROCESSES.fdm.buildVolume.x}×{PROCESSES.fdm.buildVolume.y}×
          {PROCESSES.fdm.buildVolume.z} mm (FDM) · {PROCESSES.sla.buildVolume.x}×
          {PROCESSES.sla.buildVolume.y}×{PROCESSES.sla.buildVolume.z} mm (Resin)
        </p>
      </Section>

      {/* ---------------- design guidelines ---------------- */}
      <Section>
        <SectionHead title={t("guidelines.title")} subtitle={t("guidelines.subtitle")} />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDELINES.map((key) => (
            <Card key={key} interactive className="p-5">
              <h3 className="font-display text-base font-bold">{t(`guidelines.items.${key}.title`)}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone="cyan">{t(`guidelines.items.${key}.fdm`)}</Pill>
                <Pill tone="magenta">{t(`guidelines.items.${key}.sla`)}</Pill>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {t(`guidelines.items.${key}.note`)}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------------- CTA ---------------- */}
      <Section aurora className="overflow-hidden pb-28">
        <Card className="relative px-6 py-14 text-center md:px-16">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative">
            <h2 className="font-display text-[clamp(1.75rem,4vw,2.6rem)] font-bold">{t("cta.title")}</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted">{t("cta.subtitle")}</p>
            <Link href="/quote" className="btn btn-primary mt-8">
              {t("cta.button")}
              <Arrow />
            </Link>
          </div>
        </Card>
      </Section>
    </>
  );
}
