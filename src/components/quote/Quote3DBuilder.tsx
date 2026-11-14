"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import * as THREE from "three";

import { Card, Pill, Row } from "@/components/ui";
import { ModelDropzone } from "./ModelDropzone";
import { Field, OptionGrid, NumberStepper, RangeControl, CheckboxList, ColorSwatches } from "./controls";
import { QuoteForm, type QuotePayload } from "./QuoteForm";
import { measureGeometry, type LoadedModel, type UnitId } from "@/lib/mesh";
import { quote3D, qualitiesFor, getMaterial, type Quote3DOptions } from "@/lib/quote-3d";
import { thb, thbPrecise, grams, hours, mm, cm3 } from "@/lib/format";
import {
  MATERIALS, INFILL_OPTIONS, FINISHING_3D, TURNAROUND, PROCESSES, VAT,
  type MaterialId,
} from "~/config/pricing";
import type { ViewMode } from "./ModelViewer";

const ModelViewer = dynamic(() => import("./ModelViewer").then((m) => m.ModelViewer), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-white/[0.03]" />,
});

const UNITS: { value: UnitId; name: string }[] = [
  { value: "mm", name: "mm" },
  { value: "cm", name: "cm" },
  { value: "in", name: "inch" },
];

export function Quote3DBuilder() {
  const t = useTranslations("quote");
  const tm = useTranslations("materials");
  const tq = useTranslations("quality");
  const tf = useTranslations("finishing3d");
  const tt = useTranslations("turnaround");
  const tc = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [loaded, setLoaded] = useState<LoadedModel | null>(null);
  const [unit, setUnit] = useState<UnitId>("mm");
  const [view, setView] = useState<ViewMode>("solid");

  const [materialId, setMaterialId] = useState<MaterialId>("pla");
  const [qualityId, setQualityId] = useState("standard");
  const [infill, setInfill] = useState(0.2);
  const [quantity, setQuantity] = useState(1);
  const [scalePercent, setScalePercent] = useState(100);
  const [color, setColor] = useState<string>(MATERIALS[0].colors[0]);
  const [finishingIds, setFinishingIds] = useState<string[]>(["support-removal"]);
  const [turnaroundId, setTurnaroundId] = useState("standard");

  const material = getMaterial(materialId);
  const process = PROCESSES[material.process];
  const qualities = useMemo(() => qualitiesFor(material.process), [material.process]);

  // Switching process invalidates the layer height and the colour choice
  useEffect(() => {
    if (!qualities.some((q) => q.id === qualityId)) setQualityId(qualities[0].id);
  }, [qualities, qualityId]);

  useEffect(() => {
    if (!material.colors.includes(color)) setColor(material.colors[0]);
  }, [material, color]);

  // Re-measure when the customer tells us the file was in cm or inches
  const stats = useMemo(
    () => (loaded ? measureGeometry(loaded.geometry, unit) : null),
    [loaded, unit],
  );

  const options: Quote3DOptions = {
    materialId, qualityId, infill, quantity, scalePercent, finishingIds, turnaroundId,
  };

  const quote = useMemo(() => (stats ? quote3D(stats, options) : null), [stats, JSON.stringify(options)]);

  // Free the GPU buffers when a new file replaces the old one
  useEffect(() => {
    const geo = loaded?.geometry;
    return () => { geo?.dispose(); };
  }, [loaded]);

  const quality = qualities.find((q) => q.id === qualityId) ?? qualities[0];
  const layerHeightInUnits = useMemo(() => {
    const mmPerUnit = unit === "mm" ? 1 : unit === "cm" ? 10 : 25.4;
    return quality.layerHeightMm / mmPerUnit;
  }, [quality.layerHeightMm, unit]);

  /* ---------------------------------------------------------------- */

  if (!loaded || !stats || !quote) {
    return (
      <div className="mx-auto max-w-2xl">
        <ModelDropzone
          unit={unit}
          onLoaded={(f, model) => { setFile(f); setLoaded(model); }}
        />
      </div>
    );
  }

  const payload: QuotePayload = {
    kind: "3d",
    file,
    summary: {
      total: quote.total,
      lines: [
        { label: t("options.material"), value: tm(`${materialId}.name`) },
        { label: t("options.quality"), value: `${quality.layerHeightMm} mm` },
        ...(material.process === "fdm"
          ? [{ label: t("options.infill"), value: `${Math.round(infill * 100)}%` }]
          : []),
        { label: t("options.colour"), value: color },
        { label: t("options.quantity"), value: String(quantity) },
        { label: t("model.scale"), value: `${scalePercent}%` },
        { label: t("options.finishing"), value: finishingIds.map((id) => tf(`${id}.name`)).join(", ") || "—" },
        { label: t("options.turnaround"), value: tt(`${turnaroundId}.name`) },
        { label: t("breakdown.weight"), value: grams(quote.weightGrams * quantity) },
        { label: t("breakdown.printTime"), value: hours(quote.printHours * quantity) },
        {
          label: t("model.dimensions"),
          value: `${mm(quote.size.x)} × ${mm(quote.size.y)} × ${mm(quote.size.z)} mm`,
        },
      ],
    },
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      {/* ---------------- left: preview + options ---------------- */}
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
            <ModelViewer
              geometry={loaded.geometry}
              layerHeightInUnits={layerHeightInUnits}
              mode={view}
              accent={material.process === "sla" ? "magenta" : "cyan"}
            />

            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
              <div className="pointer-events-auto flex gap-1 rounded-xl border border-line-strong bg-ink/70 p-1 backdrop-blur-md">
                {(["solid", "wireframe", "layers"] as ViewMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setView(m)}
                    data-selected={view === m}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:text-paper data-[selected=true]:bg-white/10 data-[selected=true]:text-paper"
                  >
                    {t(`model.view${m[0].toUpperCase()}${m.slice(1)}` as "model.viewSolid")}
                  </button>
                ))}
              </div>

              <div className="pointer-events-auto max-w-[45%] truncate rounded-lg border border-line-strong bg-ink/70 px-2.5 py-1.5 text-xs text-muted backdrop-blur-md">
                {file?.name}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
            {[
              { label: t("model.dimensions"), value: `${mm(quote.size.x)}×${mm(quote.size.y)}×${mm(quote.size.z)}`, unit: "mm" },
              { label: t("model.volume"), value: cm3(quote.volumeCm3), unit: "cm³" },
              { label: t("breakdown.weight"), value: grams(quote.weightGrams), unit: "" },
              { label: t("model.triangles"), value: stats.triangles.toLocaleString("en-US"), unit: "" },
            ].map((item) => (
              <div key={item.label} className="bg-surface px-4 py-3">
                <p className="text-[0.6875rem] uppercase tracking-wide text-muted-2">{item.label}</p>
                <p className="mt-1 font-display text-sm font-bold tabular-nums">
                  {item.value}
                  {item.unit && <span className="ml-1 text-xs font-normal text-muted-2">{item.unit}</span>}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* warnings */}
        {quote.warnings.length > 0 && (
          <Card className="border-amber-400/25 bg-amber-400/[0.06] p-5">
            <h3 className="font-display text-sm font-bold text-amber-300">{t("warnings.title")}</h3>
            <ul className="mt-2.5 space-y-2">
              {quote.warnings.map((w) => (
                <li key={w.code} className="flex gap-2.5 text-sm leading-relaxed text-amber-100/85">
                  <span aria-hidden="true" className="mt-0.5 shrink-0 text-amber-400">!</span>
                  {t(`warnings.${w.code}`, (w.values ?? {}) as never)}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* file & size */}
        <Card className="p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("model.units")} hint={t("model.unitsHint")}>
              <OptionGrid
                name={t("model.units")}
                columns={3}
                value={unit}
                onChange={setUnit}
                options={UNITS}
              />
            </Field>

            <Field label={t("model.scale")}>
              <RangeControl
                label={t("model.scale")}
                min={25}
                max={300}
                step={5}
                value={scalePercent}
                onChange={setScalePercent}
                format={(v) => `${v}%`}
              />
              {scalePercent !== 100 && (
                <button
                  type="button"
                  onClick={() => setScalePercent(100)}
                  className="mt-2 text-xs text-cyan underline decoration-dotted underline-offset-4"
                >
                  {t("model.resetScale")}
                </button>
              )}
            </Field>
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <ModelDropzone
              compact
              unit={unit}
              onLoaded={(f, model) => { setFile(f); setLoaded(model); }}
            />
          </div>
        </Card>

        {/* options */}
        <Card className="space-y-6 p-5 md:p-6">
          <Field label={t("options.material")}>
            <OptionGrid
              name={t("options.material")}
              columns={3}
              value={materialId}
              onChange={(v) => setMaterialId(v)}
              options={MATERIALS.map((m) => ({
                value: m.id,
                name: tm(`${m.id}.name`),
                detail: m.process === "sla" ? "Resin" : "FDM",
                meta: thbPrecise(m.pricePerGram),
              }))}
            />
          </Field>

          <Field label={t("options.colour")} hint={t("options.colourHint")}>
            <ColorSwatches colors={material.colors} value={color} onChange={setColor} />
          </Field>

          <Field label={t("options.quality")}>
            <OptionGrid
              name={t("options.quality")}
              columns={2}
              value={qualityId}
              onChange={setQualityId}
              options={qualities.map((q) => ({
                value: q.id,
                name: tq(`${q.id}.name`),
                detail: tq(`${q.id}.detail`),
              }))}
            />
          </Field>

          {material.process === "fdm" && (
            <Field label={t("options.infill")} hint={t("options.infillHint")}>
              <OptionGrid
                name={t("options.infill")}
                columns={3}
                value={infill}
                onChange={setInfill}
                options={INFILL_OPTIONS.map((o) => ({ value: o.value, name: `${o.id}%` }))}
              />
            </Field>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("options.quantity")}>
              <NumberStepper
                label={t("options.quantity")}
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={999}
              />
            </Field>

            <Field label={t("options.process")}>
              <div className="flex h-full items-center gap-2 rounded-xl border border-line-strong bg-white/[0.03] px-3.5 py-2.5">
                <Pill tone={material.process === "sla" ? "magenta" : "cyan"}>
                  {material.process === "sla" ? "Resin / SLA" : "FDM"}
                </Pill>
                <span className="text-xs text-muted-2">
                  {process.buildVolume.x}×{process.buildVolume.y}×{process.buildVolume.z} mm
                </span>
              </div>
            </Field>
          </div>

          <Field label={t("options.finishing")}>
            <CheckboxList
              name={t("options.finishing")}
              values={finishingIds}
              onChange={setFinishingIds}
              options={FINISHING_3D.filter((f) => f.id !== "none").map((f) => ({
                value: f.id,
                name: tf(`${f.id}.name`),
                detail: tf(`${f.id}.detail`),
                meta: `+${thb(f.price)}`,
              }))}
            />
          </Field>

          <Field label={t("options.turnaround")}>
            <OptionGrid
              name={t("options.turnaround")}
              columns={3}
              value={turnaroundId}
              onChange={setTurnaroundId}
              options={TURNAROUND.map((o) => ({
                value: o.id,
                name: tt(`${o.id}.name`),
                detail: tt(`${o.id}.detail`),
              }))}
            />
          </Field>
        </Card>

        <QuoteForm payload={payload} />
      </div>

      {/* ---------------- right: the price ---------------- */}
      <div className="lg:sticky lg:top-24">
        <Card className="overflow-hidden">
          <div className="relative border-b border-line p-5">
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-2">{t("breakdown.title")}</p>
              <p className="brand-text mt-2 font-display text-[2.6rem] font-bold leading-none tabular-nums">
                {thb(quote.total)}
              </p>
              <p className="mt-2 text-xs text-muted-2">
                {quantity > 1 && `${thb(quote.total / quantity)} ${t("breakdown.perUnit").toLowerCase()} · `}
                {VAT.enabled && !VAT.inclusive ? tc("vat") + " " + tc("included").toLowerCase() : ""}
              </p>
            </div>
          </div>

          <div className="space-y-0.5 p-5">
            <Row label={`${t("breakdown.material")} (${grams(quote.weightGrams)})`} value={thb(quote.perUnit.material)} />
            <Row label={`${t("breakdown.machine")} (${hours(quote.printHours)})`} value={thb(quote.perUnit.machine)} />
            <div className="rule-fade my-2" />
            <Row label={t("breakdown.perUnit")} value={thb(quote.perUnit.total)} strong />
            {quantity > 1 && <Row label={t("breakdown.quantity", { count: quantity })} value={thb(quote.productionTotal)} muted />}
            {quote.quantityDiscount > 0 && (
              <Row
                label={t("breakdown.discount", { percent: Math.round(quote.quantityDiscountRate * 100) })}
                value={`− ${thb(quote.quantityDiscount)}`}
              />
            )}
            {quote.finishing > 0 && <Row label={t("breakdown.finishing")} value={thb(quote.finishing)} />}
            <Row label={t("breakdown.setup")} value={thb(quote.setupFee)} />
            {quote.rushSurcharge > 0 && <Row label={t("breakdown.rush")} value={thb(quote.rushSurcharge)} />}
            {quote.minimumTopUp > 0 && <Row label={t("breakdown.minimum")} value={thb(quote.minimumTopUp)} muted />}

            <div className="rule-fade my-2" />
            <Row label={tc("subtotal")} value={thb(quote.subtotal)} />
            {quote.vat > 0 && <Row label={tc("vat")} value={thb(quote.vat)} muted />}
            <Row label={tc("total")} value={thb(quote.total)} accent strong />
          </div>

          <div className="grid grid-cols-2 gap-px border-t border-line bg-line">
            <div className="bg-surface px-4 py-3">
              <p className="text-[0.6875rem] uppercase tracking-wide text-muted-2">{t("breakdown.layers")}</p>
              <p className="mt-1 font-display text-sm font-bold tabular-nums">{quote.layers.toLocaleString("en-US")}</p>
            </div>
            <div className="bg-surface px-4 py-3">
              <p className="text-[0.6875rem] uppercase tracking-wide text-muted-2">{t("breakdown.leadTime")}</p>
              <p className="mt-1 font-display text-sm font-bold tabular-nums">
                {quote.leadTimeDays} {tc("businessDays")}
              </p>
            </div>
          </div>

          <p className="border-t border-line bg-ink-2/60 p-4 text-[0.6875rem] leading-relaxed text-muted-2">
            {t("breakdown.estimate")}
          </p>
        </Card>
      </div>
    </div>
  );
}
