import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

import type { Locale } from "@/i18n/routing";
import { PageHero } from "@/components/PageHero";
import { Section, Card } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { site } from "~/config/site";

/** Grouped so the page scans quickly; order here is the order on the page. */
const GROUPS = {
  files: ["formats", "noModel", "ip"],
  printing: ["accuracy", "quoteAccuracy", "strength", "colours"],
  orders: ["lead", "delivery", "payment", "minimum", "bulk"],
  paper: ["copyBook", "scan", "paperSizes"],
} as const;

const ALL_IDS = Object.values(GROUPS).flat();

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.faq" });
  return buildMetadata({
    locale: locale as Locale, path: "/faq",
    title: t("title"), description: t("description"),
  });
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "faq" });
  const tn = await getTranslations({ locale, namespace: "nav" });

  // Google reads this and can show the answers straight in the results
  const entries = ALL_IDS.map((id) => ({
    q: t(`items.${id}.q`),
    a: t(`items.${id}.a`),
  }));

  return (
    <>
      <Content />
      <JsonLd
        data={[
          faqJsonLd(entries),
          breadcrumbJsonLd(locale as Locale, [
            { name: tn("home"), path: "" },
            { name: tn("faq"), path: "/faq" },
          ]),
        ]}
      />
    </>
  );
}

function Content() {
  const t = useTranslations("faq");

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />

      <Section className="pb-28">
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          <nav aria-label={t("title")} className="lg:sticky lg:top-24 lg:self-start">
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((group) => (
                <li key={group}>
                  <a
                    href={`#faq-${group}`}
                    className="block rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-white/5 hover:text-paper"
                  >
                    {t(`categories.${group}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-12">
            {(Object.entries(GROUPS) as [keyof typeof GROUPS, readonly string[]][]).map(
              ([group, ids]) => (
                <section key={group} id={`faq-${group}`} className="scroll-mt-28">
                  <h2 className="font-display text-xl font-bold text-cyan">
                    {t(`categories.${group}`)}
                  </h2>

                  <div className="mt-4 space-y-3">
                    {ids.map((id) => (
                      <Card key={id} className="overflow-hidden">
                        {/* <details> keeps this usable and crawlable with no JavaScript */}
                        <details className="group">
                          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 transition-colors hover:bg-white/[0.03]">
                            <h3 className="font-display text-base font-semibold leading-snug">
                              {t(`items.${id}.q`)}
                            </h3>
                            <span
                              aria-hidden="true"
                              className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line-strong text-muted transition-transform duration-200 group-open:rotate-45"
                            >
                              +
                            </span>
                          </summary>
                          <div className="border-t border-line px-5 py-4">
                            <p className="text-sm leading-relaxed text-muted">{t(`items.${id}.a`)}</p>
                          </div>
                        </details>
                      </Card>
                    ))}
                  </div>
                </section>
              ),
            )}

            <Card className="p-6">
              <p className="text-sm text-muted">{t("subtitle")}</p>
              <a
                href={site.contact.lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-line mt-4 !py-2.5 text-sm"
              >
                LINE {site.contact.lineId}
              </a>
            </Card>
          </div>
        </div>
      </Section>
    </>
  );
}
