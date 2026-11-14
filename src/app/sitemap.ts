import type { MetadataRoute } from "next";
import { site } from "~/config/site";
import { routing } from "@/i18n/routing";

/** Every page, in every language, cross-linked with hreflang alternates. */
const PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/quote", priority: 0.9, changeFrequency: "monthly" },
  { path: "/3d-printing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/printing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/gallery", priority: 0.7, changeFrequency: "weekly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PAGES.flatMap((page) =>
    routing.locales.map((locale) => ({
      url: `${site.url}/${locale}${page.path}`,
      lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((alt) => [
            alt === "th" ? "th-TH" : "en-US",
            `${site.url}/${alt}${page.path}`,
          ]),
        ),
      },
    })),
  );
}
