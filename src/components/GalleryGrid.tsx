"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, Pill } from "./ui";
import { Photo } from "./Photo";
import { clsx } from "@/lib/clsx";
import { GALLERY, type GalleryCategory } from "~/config/gallery";

type Filter = "all" | GalleryCategory;

export function GalleryGrid() {
  const t = useTranslations("gallery");
  const [filter, setFilter] = useState<Filter>("all");

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("filterAll") },
    { id: "3d", label: t("filter3d") },
    { id: "print", label: t("filterPrint") },
  ];

  const items = GALLERY.filter((item) => filter === "all" || item.category === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            aria-pressed={filter === item.id}
            className={clsx(
              "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
              filter === item.id
                ? "border-cyan/50 bg-cyan/10 text-paper"
                : "border-line-strong text-muted hover:border-white/25 hover:text-paper",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid auto-rows-[260px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Card
            key={item.id}
            interactive
            className={clsx(
              "group flex flex-col justify-end",
              item.span === "wide" && "sm:col-span-2",
              item.span === "tall" && "sm:row-span-2",
            )}
          >
            {/* Photo is itself `relative`, so it fills an absolute wrapper
                rather than being handed a conflicting position class */}
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
              <Photo
                src={item.image}
                alt={t(`items.${item.id}.title`)}
                variant={index}
                tint={0.4}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="h-full w-full"
              />
            </div>

            <div className="relative bg-gradient-to-t from-ink via-ink/85 to-transparent p-5 pt-12">
              <Pill tone={item.category === "3d" ? "cyan" : "magenta"}>
                {t(`items.${item.id}.material`)}
              </Pill>
              <h3 className="mt-2.5 font-display text-lg font-bold">{t(`items.${item.id}.title`)}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {t(`items.${item.id}.description`)}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-8 rounded-xl border border-dashed border-line-strong bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-muted-2">
        {t("placeholder")}
      </p>
    </div>
  );
}
