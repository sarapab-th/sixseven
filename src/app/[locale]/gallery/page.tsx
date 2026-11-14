import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { PageHero } from "@/components/PageHero";
import { GalleryGrid } from "@/components/GalleryGrid";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.gallery" });
  return buildMetadata({
    locale: locale as Locale, path: "/gallery",
    title: t("title"), description: t("description"),
  });
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "gallery" });
  const tn = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <div className="container-x py-14 pb-28">
        <GalleryGrid />
      </div>
      <JsonLd
        data={breadcrumbJsonLd(locale as Locale, [
          { name: tn("home"), path: "" },
          { name: tn("gallery"), path: "/gallery" },
        ])}
      />
    </>
  );
}
