"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { clsx } from "@/lib/clsx";
import { Quote3DBuilder } from "./Quote3DBuilder";
import { QuotePrintBuilder } from "./QuotePrintBuilder";

type Tab = "3d" | "print";

export function QuoteTabs({ initial = "3d" }: { initial?: Tab }) {
  const t = useTranslations("quote");
  const [tab, setTab] = useState<Tab>(initial);

  const tabs: { id: Tab; label: string }[] = [
    { id: "3d", label: t("tab3d") },
    { id: "print", label: t("tabPrint") },
  ];

  return (
    <div>
      <div role="tablist" aria-label={t("title")} className="mb-8 inline-flex rounded-xl border border-line-strong bg-white/[0.04] p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            id={`tab-${item.id}`}
            onClick={() => setTab(item.id)}
            className={clsx(
              "relative rounded-lg px-4 py-2.5 font-display text-sm font-semibold transition-colors sm:px-6",
              tab === item.id ? "text-ink" : "text-muted hover:text-paper",
            )}
          >
            {tab === item.id && (
              <span className="brand-gradient absolute inset-0 -z-10 rounded-lg" aria-hidden="true" />
            )}
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="panel-3d" aria-labelledby="tab-3d" hidden={tab !== "3d"}>
        {tab === "3d" && <Quote3DBuilder />}
      </div>
      <div role="tabpanel" id="panel-print" aria-labelledby="tab-print" hidden={tab !== "print"}>
        {tab === "print" && <QuotePrintBuilder />}
      </div>
    </div>
  );
}
