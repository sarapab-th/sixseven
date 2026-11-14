import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HeroCanvasLazy } from "./HeroCanvasLazy";

export function Hero() {
  const t = useTranslations("home.hero");

  const badges = [t("badge1"), t("badge2"), t("badge3")];

  return (
    <section className="relative isolate min-h-[clamp(620px,92svh,980px)] overflow-hidden">
      {/* Static fallback that the canvas paints over once it loads */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_72%_42%,#00e5ff1c,transparent_70%),radial-gradient(ellipse_50%_45%_at_88%_78%,#ff2e8818,transparent_70%)]" />

      {/* The scene lives in the right-hand column on desktop, so the headline
          always has clean space. On small screens it sits behind the text
          under a veil instead. */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
        <HeroCanvasLazy />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-2/3 bg-[linear-gradient(90deg,#050507_0%,#050507d9_38%,transparent_100%)]" />
      </div>

      {/* On phones the scene sits straight behind the copy, so the veil is
          heaviest where the text is and thins out towards the bottom. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#050507e6_0%,#050507d6_48%,#0505079c_100%)] lg:hidden" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />

      <div className="container-x relative flex min-h-[clamp(620px,92svh,980px)] items-center pb-20 pt-32">
        <div className="max-w-2xl">
          <p className="eyebrow">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_10px_2px_#00e5ff]" />
            {t("eyebrow")}
          </p>

          <h1 className="mt-5 font-display text-[clamp(2.6rem,7.2vw,4.75rem)] font-bold leading-[1.04] tracking-tight">
            {/* The split goes on the white line only — over gradient-clipped
                text the shadow shows through the transparent fill and muddies it */}
            <span className="chroma-strong">{t("title")}</span>
            <br />
            <span className="brand-text">{t("titleAccent")}</span>
          </h1>

          <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-muted">
            {t("subtitle")}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/quote" className="btn btn-primary">
              {t("ctaPrimary")}
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/gallery" className="btn btn-ghost">
              {t("ctaSecondary")}
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {badges.map((badge) => (
              <li key={badge} className="flex items-center gap-2 text-sm text-muted-2">
                <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-cyan" aria-hidden="true">
                  <path
                    d="M3 8.5 L6.5 12 L13 4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {badge}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center md:flex">
        <span className="flex flex-col items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.3em] text-muted-2">
          {t("scrollHint")}
          <span className="relative block h-9 w-px overflow-hidden bg-white/10">
            <span className="animate-scan absolute inset-x-0 top-0 h-3 bg-cyan" />
          </span>
        </span>
      </div>
    </section>
  );
}
