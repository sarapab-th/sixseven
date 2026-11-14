import { DriftingPartsLazy } from "./scene/DriftingPartsLazy";

export function PageHero({
  eyebrow, title, subtitle,
}: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="relative overflow-hidden border-b border-line pb-12 pt-32 md:pb-16">
      <div className="aurora pointer-events-none absolute inset-0" />
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />

      {/* Finished parts drifting across the band */}
      <div className="absolute inset-0">
        <DriftingPartsLazy count={7} seconds={36} spread={0.54} sizeFraction={0.56} />
      </div>

      {/* Keeps the heading legible wherever a part happens to be. On a phone
          the heading fills the width, so the veil grades top-to-bottom instead
          of left-to-right and the parts still show through underneath. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#050507f5_0%,#050507e3_50%,#050507c7_100%)] lg:bg-[linear-gradient(100deg,#050507_0%,#050507e0_30%,#0505076b_60%,#05050730_100%)]" />

      <div className="container-x relative">
        {eyebrow && (
          <p className="eyebrow">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_10px_2px_#00e5ff]" />
            {eyebrow}
          </p>
        )}
        <h1 className="chroma-strong mt-4 max-w-3xl font-display text-[clamp(2rem,5.2vw,3.5rem)] font-bold leading-[1.08] tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{subtitle}</p>}
      </div>
    </div>
  );
}
