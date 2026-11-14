import { useLocale, useTranslations } from "next-intl";
import { Photo } from "./Photo";
import { Section, SectionHead } from "./ui";
import { PHOTOS } from "~/config/photos";
import type { Locale } from "@/i18n/routing";

const TILES = [
  { key: "machines", photo: "shopPrinter" },
  { key: "parts", photo: "shopParts" },
  { key: "paper", photo: "shopPaper" },
  { key: "counter", photo: "servicePrint" },
] as const;

/**
 * A band of photographs from the workshop. It is the one place on the site
 * that shows the business rather than describing it, so it sits right after
 * "how it works" — just as the visitor starts wondering who they are dealing
 * with.
 */
export function ShopStrip() {
  const t = useTranslations("home.shop");
  const locale = useLocale() as Locale;

  const wide = PHOTOS.shopWide;

  return (
    <Section className="border-t border-line">
      <SectionHead eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <div className="mt-12 grid gap-4 lg:grid-cols-12">
        {/* The hero frame — the only photo big enough to carry detail */}
        <figure className="relative lg:col-span-7">
          <Photo
            src={wide.src}
            alt={wide.alt[locale] ?? wide.alt.en}
            tint={0.35}
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="aspect-[16/10] rounded-2xl border border-line"
          >
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/90 to-transparent" />
          </Photo>
        </figure>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-2">
          {TILES.map((tile, index) => {
            const photo = PHOTOS[tile.photo];
            return (
              <figure key={tile.key} className="relative">
                <Photo
                  src={photo.src}
                  alt={photo.alt[locale] ?? photo.alt.en}
                  variant={index}
                  tint={0.5}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 24vw"
                  className="aspect-[4/3] rounded-xl border border-line"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-3.5">
                    <p className="font-display text-sm font-bold leading-tight">
                      {t(`items.${tile.key}.title`)}
                    </p>
                    <p className="mt-0.5 text-[0.6875rem] leading-snug text-muted">
                      {t(`items.${tile.key}.detail`)}
                    </p>
                  </figcaption>
                </Photo>
              </figure>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
