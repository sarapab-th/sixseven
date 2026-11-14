"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { clsx } from "@/lib/clsx";
import {
  loadModelFile, extensionOf, UnsupportedFileError, EmptyModelError,
  type LoadedModel, type UnitId,
} from "@/lib/mesh";
import { site } from "~/config/site";

interface Props {
  unit: UnitId;
  onLoaded: (file: File, model: LoadedModel) => void;
  compact?: boolean;
}

export function ModelDropzone({ unit, onLoaded, compact = false }: Props) {
  const t = useTranslations("quote.upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxMb = site.upload.maxFileSizeMb;
  const accept = site.upload.model3dExtensions.join(",");

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      const ext = extensionOf(file.name);
      if (!site.upload.model3dExtensions.includes(ext as never)) {
        setError(t("errorUnsupported", { ext: ext || "?" }));
        return;
      }

      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > maxMb) {
        setError(t("errorTooBig", { size: sizeMb.toFixed(1), max: maxMb }));
        return;
      }

      setBusy(true);
      try {
        // Hand the browser a frame to paint the spinner before we block on parsing
        await new Promise((r) => setTimeout(r, 16));
        const model = await loadModelFile(file, unit);
        onLoaded(file, model);
      } catch (err) {
        if (err instanceof UnsupportedFileError) setError(t("errorUnsupported", { ext: err.extension }));
        else if (err instanceof EmptyModelError) setError(t("errorEmpty"));
        else setError(t("errorGeneric"));
      } finally {
        setBusy(false);
      }
    },
    [maxMb, onLoaded, t, unit],
  );

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); }
        }}
        role="button"
        tabIndex={0}
        aria-label={t("title")}
        aria-busy={busy}
        className={clsx(
          "group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed text-center transition-all duration-200",
          compact ? "p-6" : "p-10 md:p-14",
          dragging
            ? "border-cyan bg-cyan/10"
            : "border-line-strong bg-white/[0.03] hover:border-cyan/50 hover:bg-cyan/[0.04]",
          busy && "pointer-events-none opacity-70",
        )}
      >
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative">
          <div
            className={clsx(
              "mx-auto grid place-items-center rounded-2xl border border-line-strong bg-white/5 transition-transform duration-300",
              compact ? "h-12 w-12" : "h-16 w-16",
              dragging ? "scale-110" : "group-hover:scale-105",
            )}
          >
            {busy ? (
              <span className="block h-5 w-5 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
            ) : (
              <svg viewBox="0 0 24 24" className={clsx("text-cyan", compact ? "h-5 w-5" : "h-7 w-7")} aria-hidden="true">
                <path
                  d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
                  fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          <p className={clsx("mt-4 font-display font-bold", compact ? "text-base" : "text-xl")}>
            {busy ? t("analysing") : t("title")}
          </p>
          <p className="mt-1.5 text-sm text-muted">{t("subtitle", { max: maxMb })}</p>
          {!compact && (
            <p className="mt-0.5 text-xs text-muted-2 underline decoration-dotted underline-offset-4">
              {t("browse")}
            </p>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = ""; // allow re-picking the same file
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}

      {!compact && !error && (
        <p className="mt-3 text-center text-xs leading-relaxed text-muted-2">{t("privacy")}</p>
      )}
    </div>
  );
}
