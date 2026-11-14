import { useLocale, useTranslations } from "next-intl";
import { Card, Pill } from "./ui";
import { thbPrecise } from "@/lib/format";
import type { Material } from "~/config/pricing";
import type { Locale } from "@/i18n/routing";

export function MaterialCard({ material }: { material: Material }) {
  const t = useTranslations("materials");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;

  const tags = material.tags[locale] ?? material.tags.en;

  return (
    <Card interactive className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">{t(`${material.id}.name`)}</h3>
          <Pill tone={material.process === "sla" ? "magenta" : "cyan"}>
            {material.process === "sla" ? "Resin" : "FDM"}
          </Pill>
        </div>
        <div className="shrink-0 text-right">
          <p className="brand-text font-display text-xl font-bold leading-none">
            {thbPrecise(material.pricePerGram)}
          </p>
          <p className="mt-1 text-[0.6875rem] text-muted-2">{tc("perGram")}</p>
        </div>
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
        {t(`${material.id}.description`)}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Pill key={tag}>{tag}</Pill>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        {material.colors.map((color) => (
          <span
            key={color}
            className="h-4 w-4 rounded-full border border-white/20"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </Card>
  );
}
