"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Card, Row } from "@/components/ui";
import { Field, OptionGrid, NumberStepper, Toggle, CheckboxList } from "./controls";
import { DocumentDropzone } from "./DocumentDropzone";
import { QuoteForm, type QuotePayload } from "./QuoteForm";
import { quotePrint, type QuotePrintOptions } from "@/lib/quote-print";
import { thb, thbPrecise } from "@/lib/format";
import {
  PAPER_STOCKS, FINISHING_PRINT, PRINT_TURNAROUND, VAT,
  type PaperSize, type ColorMode,
} from "~/config/pricing";

export function QuotePrintBuilder() {
  const t = useTranslations("quote");
  const tp = useTranslations("quote.print");
  const tsum = useTranslations("quote.print.summary");
  const tst = useTranslations("paperStocks");
  const tfp = useTranslations("finishingPrint");
  const tpt = useTranslations("printTurnaround");
  const tc = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [size, setSize] = useState<PaperSize>("a4");
  const [colorMode, setColorMode] = useState<ColorMode>("bw");
  const [pages, setPages] = useState(10);
  const [copies, setCopies] = useState(1);
  const [duplex, setDuplex] = useState(false);
  const [paperStockId, setPaperStockId] = useState("plain-80");
  const [isCopyJob, setIsCopyJob] = useState(false);
  const [boundOriginal, setBoundOriginal] = useState(false);
  const [scanToFile, setScanToFile] = useState(false);
  const [finishingIds, setFinishingIds] = useState<string[]>([]);
  const [turnaroundId, setTurnaroundId] = useState("standard");

  const options: QuotePrintOptions = {
    size, colorMode, pages, copies, duplex, paperStockId,
    finishingIds, turnaroundId, isCopyJob, boundOriginal, scanToFile,
  };

  const quote = useMemo(() => quotePrint(options), [JSON.stringify(options)]);

  const savingPercent =
    quote.baseUnitPrice > 0
      ? Math.round((1 - quote.unitPrice / quote.baseUnitPrice) * 100)
      : 0;

  // Lamination is size specific, so only offer the one that matches
  const finishingOptions = FINISHING_PRINT.filter((f) => {
    if (f.id === "none") return false;
    if (f.id === "laminate-a4") return size === "a4";
    if (f.id === "laminate-a3") return size === "a3";
    return true;
  });

  const payload: QuotePayload = {
    kind: "print",
    file,
    summary: {
      total: quote.total,
      lines: [
        { label: tp("sizeLabel"), value: size.toUpperCase() },
        { label: tp("colourLabel"), value: colorMode === "bw" ? tp("bw") : tp("colour") },
        { label: tp("pages"), value: String(pages) },
        { label: tp("copies"), value: String(copies) },
        { label: tp("duplex"), value: duplex ? "✓" : "—" },
        { label: tp("stock"), value: tst(`${paperStockId}.name`) },
        { label: tsum("sides"), value: String(quote.totalSides) },
        { label: tsum("sheets"), value: String(quote.sheets) },
        { label: tp("finishing"), value: finishingIds.map((id) => tfp(`${id}.name`)).join(", ") || "—" },
        { label: tp("turnaround"), value: tpt(`${turnaroundId}.name`) },
        ...(isCopyJob ? [{ label: tp("isCopy"), value: "✓" }] : []),
        ...(scanToFile ? [{ label: tp("scan"), value: "✓" }] : []),
      ],
    },
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="space-y-6">
        <Card className="space-y-6 p-5 md:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={tp("sizeLabel")}>
              <OptionGrid
                name={tp("sizeLabel")}
                value={size}
                onChange={setSize}
                options={[
                  { value: "a4" as PaperSize, name: "A4", detail: "210 × 297 mm" },
                  { value: "a3" as PaperSize, name: "A3", detail: "297 × 420 mm" },
                ]}
              />
            </Field>

            <Field label={tp("colourLabel")}>
              <OptionGrid
                name={tp("colourLabel")}
                value={colorMode}
                onChange={setColorMode}
                options={[
                  { value: "bw" as ColorMode, name: tp("bw") },
                  { value: "color" as ColorMode, name: tp("colour") },
                ]}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={tp("pages")} hint={tp("pagesHint")}>
              <NumberStepper label={tp("pages")} value={pages} onChange={setPages} min={1} max={5000} />
            </Field>
            <Field label={tp("copies")}>
              <NumberStepper label={tp("copies")} value={copies} onChange={setCopies} min={1} max={2000} />
            </Field>
          </div>

          <Field label={tp("stock")}>
            <OptionGrid
              name={tp("stock")}
              columns={3}
              value={paperStockId}
              onChange={setPaperStockId}
              options={PAPER_STOCKS.map((s) => ({
                value: s.id,
                name: tst(`${s.id}.name`),
                detail: tst(`${s.id}.detail`),
                meta: s.multiplier === 1 ? undefined : `×${s.multiplier}`,
              }))}
            />
          </Field>

          <div className="space-y-2.5">
            <Toggle checked={duplex} onChange={setDuplex} label={tp("duplex")} hint={tp("duplexHint")} />
            <Toggle checked={isCopyJob} onChange={setIsCopyJob} label={tp("isCopy")} hint={tp("isCopyHint")} />
            {isCopyJob && (
              <Toggle checked={boundOriginal} onChange={setBoundOriginal} label={tp("bound")} />
            )}
            <Toggle checked={scanToFile} onChange={setScanToFile} label={tp("scan")} />
          </div>

          <Field label={tp("finishing")}>
            <CheckboxList
              name={tp("finishing")}
              values={finishingIds}
              onChange={setFinishingIds}
              options={finishingOptions.map((f) => ({
                value: f.id,
                name: tfp(`${f.id}.name`),
                detail: tfp(`${f.id}.detail`),
                meta: `+${thbPrecise(f.price)}`,
              }))}
            />
          </Field>

          <Field label={tp("turnaround")}>
            <OptionGrid
              name={tp("turnaround")}
              columns={3}
              value={turnaroundId}
              onChange={setTurnaroundId}
              options={PRINT_TURNAROUND.map((o) => ({
                value: o.id,
                name: tpt(`${o.id}.name`),
                detail: tpt(`${o.id}.detail`),
              }))}
            />
          </Field>

          <Field label={tp("uploadDoc")}>
            <DocumentDropzone file={file} onChange={setFile} />
          </Field>
        </Card>

        <QuoteForm payload={payload} />
      </div>

      {/* ---------------- the price ---------------- */}
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
                {thbPrecise(quote.unitPrice)} {tc("perSide")}
                {savingPercent > 0 && ` · ${tsum("saving", { percent: savingPercent })}`}
              </p>
            </div>
          </div>

          <div className="space-y-0.5 p-5">
            <Row label={tsum("sides")} value={quote.totalSides.toLocaleString("en-US")} muted />
            <Row label={tsum("sheets")} value={quote.sheets.toLocaleString("en-US")} muted />
            <Row label={tsum("rate")} value={thbPrecise(quote.unitPrice)} muted />
            <div className="rule-fade my-2" />

            <Row label={tsum("printing")} value={thb(quote.printing)} />
            {quote.duplexSaving > 0 && (
              <Row label={tsum("duplexSaving")} value={`− ${thb(quote.duplexSaving)}`} />
            )}
            {quote.copyHandling > 0 && <Row label={tsum("copyHandling")} value={thb(quote.copyHandling)} />}
            {quote.scanning > 0 && <Row label={tsum("scanning")} value={thb(quote.scanning)} />}
            {quote.finishing > 0 && <Row label={tsum("finishing")} value={thb(quote.finishing)} />}
            {quote.rushSurcharge > 0 && <Row label={tsum("rush")} value={thb(quote.rushSurcharge)} />}
            {quote.minimumTopUp > 0 && <Row label={tsum("minimum")} value={thb(quote.minimumTopUp)} muted />}

            <div className="rule-fade my-2" />
            <Row label={tc("subtotal")} value={thb(quote.subtotal)} />
            {VAT.enabled && quote.vat > 0 && <Row label={tc("vat")} value={thb(quote.vat)} muted />}
            <Row label={tc("total")} value={thb(quote.total)} accent strong />
          </div>

          <div className="border-t border-line bg-surface px-4 py-3">
            <p className="text-[0.6875rem] uppercase tracking-wide text-muted-2">{tsum("ready")}</p>
            <p className="mt-1 font-display text-sm font-bold tabular-nums">
              {quote.leadTimeHours} {tc("hours")}
            </p>
          </div>

          <p className="border-t border-line bg-ink-2/60 p-4 text-[0.6875rem] leading-relaxed text-muted-2">
            {t("breakdown.estimate")}
          </p>
        </Card>
      </div>
    </div>
  );
}
