import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Sarabun } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import "../globals.css";
import { routing, type Locale } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, localBusinessJsonLd, websiteJsonLd } from "@/lib/seo";
import { site } from "~/config/site";

/* Both faces carry Thai and Latin, so headings and body text stay
   consistent whichever language the visitor is reading. */
const chakra = Chakra_Petch({
  subsets: ["latin", "thai"],
  weight: ["500", "600", "700"],
  variable: "--font-chakra",
  display: "swap",
});

const sarabun = Sarabun({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sarabun",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#050507",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "meta.home" });

  return {
    ...buildMetadata({
      locale: locale as Locale,
      title: t("title"),
      description: t("description"),
    }),
    title: {
      default: `${site.name} — ${t("title")}`,
      template: `%s · ${site.name}`,
    },
    applicationName: site.name,
    keywords:
      locale === "th"
        ? ["พิมพ์ 3 มิติ", "3D printing กรุงเทพ", "ร้านปริ้นงาน", "ถ่ายเอกสาร", "พิมพ์ A3", "พิมพ์ A4", "สั่งพิมพ์ 3D", "เรซิน", "เข้าเล่มวิทยานิพนธ์"]
        : ["3D printing Bangkok", "3D print service Thailand", "resin printing", "A3 printing", "photocopying Bangkok", "STL quote", "rapid prototyping"],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${chakra.variable} ${sarabun.variable}`}
      // globals.css sets `scroll-behavior: smooth`; this tells Next the smooth
      // scrolling is deliberate so it keeps it during route transitions
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </NextIntlClientProvider>

        <JsonLd data={[localBusinessJsonLd(locale as Locale), websiteJsonLd(locale as Locale)]} />
      </body>
    </html>
  );
}
