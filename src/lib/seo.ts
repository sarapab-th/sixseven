import type { Metadata } from "next";
import { site } from "~/config/site";
import type { Locale } from "@/i18n/routing";

const LOCALE_TAGS: Record<Locale, string> = { th: "th-TH", en: "en-US" };

interface BuildMetadataArgs {
  locale: Locale;
  /** Path after the locale segment, e.g. "/3d-printing". Empty for home. */
  path?: string;
  title: string;
  description: string;
  /** Override the social image */
  image?: string;
}

export function buildMetadata({
  locale, path = "", title, description, image,
}: BuildMetadataArgs): Metadata {
  const url = `${site.url}/${locale}${path}`;
  const ogImage = image ?? site.ogImage;

  // Every page points at both language versions, so Google serves the right one.
  const languages: Record<string, string> = {};
  for (const l of site.locales) {
    languages[LOCALE_TAGS[l as Locale]] = `${site.url}/${l}${path}`;
  }
  languages["x-default"] = `${site.url}/${site.defaultLocale}${path}`;

  return {
    title,
    description,
    metadataBase: new URL(site.url),
    alternates: { canonical: url, languages },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: LOCALE_TAGS[locale],
      alternateLocale: site.locales.filter((l) => l !== locale).map((l) => LOCALE_TAGS[l as Locale]),
      url,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    ...(site.googleSiteVerification
      ? { verification: { google: site.googleSiteVerification } }
      : {}),
  };
}

/* ------------------------------------------------------------------
 * Structured data. Google uses this to show opening hours, ratings
 * and the service list directly in search results.
 * ------------------------------------------------------------------ */

export function localBusinessJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "ProfessionalService"],
    "@id": `${site.url}/#business`,
    name: site.legalName,
    alternateName: locale === "th" ? site.nameTh : site.name,
    url: `${site.url}/${locale}`,
    image: `${site.url}${site.ogImage}`,
    logo: `${site.url}/brand/logo.jpg`,
    email: site.contact.email,
    telephone: site.contact.phoneRaw,
    priceRange: "฿฿",
    currenciesAccepted: "THB",
    paymentAccepted: "Cash, Credit Card, Bank Transfer, PromptPay",
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.district,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.address.lat,
      longitude: site.address.lng,
    },
    openingHoursSpecification: site.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    sameAs: [site.contact.facebook, site.contact.instagram, site.contact.tiktok].filter(Boolean),
    areaServed: { "@type": "Country", name: "Thailand" },
  };
}

export function servicesJsonLd(locale: Locale, services: { name: string; description: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.name,
        description: s.description,
        url: `${site.url}/${locale}${s.path}`,
        provider: { "@id": `${site.url}/#business` },
        areaServed: { "@type": "Country", name: "Thailand" },
      },
    })),
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbJsonLd(locale: Locale, trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${site.url}/${locale}${t.path}`,
    })),
  };
}

export function websiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    url: `${site.url}/${locale}`,
    name: site.name,
    inLanguage: LOCALE_TAGS[locale],
    publisher: { "@id": `${site.url}/#business` },
  };
}
