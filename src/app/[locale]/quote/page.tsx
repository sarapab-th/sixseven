import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { PageHero } from "@/components/PageHero";
import { QuoteTabs } from "@/components/quote/QuoteTabs";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.quote" });
  return buildMetadata({
    locale: locale as Locale,
    path: "/quote",
    title: t("title"),
    description: t("description"),
  });
}

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { locale } = await params;
  const { type } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "quote" });
  const tn = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />

      <div className="container-x py-10 md:py-14">
        <QuoteTabs initial={type === "print" ? "print" : "3d"} />
      </div>

      <JsonLd
        data={breadcrumbJsonLd(locale as Locale, [
          { name: tn("home"), path: "" },
          { name: tn("quote"), path: "/quote" },
        ])}
      />
    </>
  );
}
