import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Hero } from "@/components/hero/Hero";
import { Section, SectionHead, Card, Stat, Check, Arrow, Pill } from "@/components/ui";
import { MaterialCard } from "@/components/MaterialCard";
import { ShopStrip } from "@/components/ShopStrip";
import { Photo } from "@/components/Photo";
import { DriftingPartsLazy } from "@/components/scene/DriftingPartsLazy";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, servicesJsonLd } from "@/lib/seo";
import { MATERIALS } from "~/config/pricing";
import { PHOTOS } from "~/config/photos";
import { site } from "~/config/site";

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  return buildMetadata({ locale: locale as Locale, title: t("title"), description: t("description") });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <>
      <HomeContent />
      <JsonLd
        data={servicesJsonLd(locale as Locale, [
          { name: t("services.card3d.title"), description: t("services.card3d.description"), path: "/3d-printing" },
          { name: t("services.cardPrint.title"), description: t("services.cardPrint.description"), path: "/printing" },
        ])}
      />
    </>
  );
}

const USE_CASES = ["prototype", "spare", "architecture", "miniature", "jig", "thesis", "poster", "sticker"] as const;
const FEATURED_MATERIALS = ["pla", "petg", "tpu", "pa12-cf", "resin-standard", "resin-clear"] as const;

function HomeContent() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;

  return (
    <>
      <Hero />

      {/* ---------------- trust bar ---------------- */}
      <div className="border-y border-line bg-ink-2/60">
        <div className="container-x grid grid-cols-2 gap-8 py-10 sm:grid-cols-4">
          <Stat value="12,400+" label={t("trust.parts")} />
          <Stat value={t("trust.turnaroundValue")} label={t("trust.turnaround")} />
          <Stat value="9" label={t("trust.materials")} />
          <Stat value="4.9 / 5" label={t("trust.rating")} />
        </div>
      </div>

      {/* ---------------- two services ---------------- */}
      <Section aurora>
        <SectionHead
          eyebrow={tc("learnMore")}
          title={t("services.title")}
          subtitle={t("services.subtitle")}
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {([
            { key: "card3d", href: "/3d-printing", tone: "cyan" as const, photo: "service3d" as const },
            { key: "cardPrint", href: "/printing", tone: "magenta" as const, photo: "servicePrint" as const },
          ]).map(({ key, href, tone, photo }) => {
            const shot = PHOTOS[photo];
            return (
              <Card key={key} interactive className="group flex flex-col">
                <Photo
                  src={shot.src}
                  alt={shot.alt[locale] ?? shot.alt.en}
                  tint={0.5}
                  variant={tone === "cyan" ? 0 : 1}
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className="aspect-[16/9] w-full"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface via-ink/45 to-transparent" />
                  <div
                    className={`pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-40 ${
                      tone === "cyan" ? "bg-cyan/10" : "bg-magenta/10"
                    }`}
                  />
                </Photo>

                <div className="flex flex-1 flex-col p-7 md:p-9 md:pt-7">
                  <h3 className="font-display text-2xl font-bold md:text-3xl">
                    {t(`services.${key}.title`)}
                  </h3>
                  <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                    {t(`services.${key}.description`)}
                  </p>

                  <ul className="mt-6 space-y-2.5">
                    {[1, 2, 3].map((n) => (
                      <li key={n} className="flex items-start gap-2.5 text-sm text-paper/90">
                        <Check className={tone === "cyan" ? "mt-0.5 text-cyan" : "mt-0.5 text-magenta"} />
                        {t(`services.${key}.point${n}`)}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={href}
                    className="mt-8 inline-flex w-fit items-center gap-2 font-display text-sm font-semibold text-paper transition-colors hover:text-cyan"
                  >
                    {t(`services.${key}.cta`)}
                    <Arrow className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* ---------------- how it works ---------------- */}
      <Section className="border-y border-line bg-ink-2/40">
        <SectionHead eyebrow="01 — 04" title={t("how.title")} subtitle={t("how.subtitle")} />

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} className="relative">
              <Card className="h-full p-6">
                <span className="brand-text font-display text-4xl font-bold leading-none opacity-80">
                  {String(n).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold">{t(`how.step${n}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {t(`how.step${n}.description`)}
                </p>
              </Card>
              {n < 4 && (
                <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-line-strong lg:block">
                  <Arrow className="h-5 w-5" />
                </span>
              )}
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------------- inside the shop ---------------- */}
      <ShopStrip />

      {/* ---------------- materials ---------------- */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            eyebrow={t("materials.title")}
            title={t("materials.title")}
            subtitle={t("materials.subtitle")}
          />
          <Link href="/3d-printing" className="btn btn-ghost !py-2.5 text-sm">
            {t("materials.cta")}
            <Arrow />
          </Link>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_MATERIALS.map((id) => {
            const material = MATERIALS.find((m) => m.id === id);
            return material ? <MaterialCard key={id} material={material} /> : null;
          })}
        </div>
      </Section>

      {/* ---------------- bottom: use cases + CTA, over drifting parts ----------------
          One canvas spans both sections so the parts travel the whole way down
          rather than restarting at each section boundary. */}
      <div className="relative isolate overflow-hidden border-t border-line">
        <div className="absolute inset-0">
          <DriftingPartsLazy count={9} seconds={52} spread={0.78} sizeFraction={0.17} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#050507_0%,#050507a1_6%,#05050757_34%,#05050757_62%,#050507a1_88%,#050507_100%)]" />

      <Section>
        <SectionHead title={t("useCases.title")} align="center" />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {USE_CASES.map((key) => (
            <Card key={key} interactive className="p-5">
              <h3 className="font-display text-base font-bold">{t(`useCases.items.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t(`useCases.items.${key}.description`)}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ---------------- closing CTA ---------------- */}
      <Section aurora className="overflow-hidden">
        <Card className="relative px-6 py-14 text-center md:px-16 md:py-20">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative">
            <Pill tone="cyan">{tc("instantQuote")}</Pill>
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-[clamp(1.9rem,4.4vw,3rem)] font-bold leading-tight">
              {t("cta.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted">{t("cta.subtitle")}</p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/quote" className="btn btn-primary">
                {t("cta.button")}
                <Arrow />
              </Link>
              <a
                href={site.contact.lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                {t("cta.secondary")}
              </a>
            </div>
          </div>
        </Card>
      </Section>
      </div>
    </>
  );
}
