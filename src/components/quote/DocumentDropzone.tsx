"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { clsx } from "@/lib/clsx";
import { extensionOf } from "@/lib/mesh";
import { site } from "~/config/site";

export function DocumentDropzone({
  file, onChange,
}: { file: File | null; onChange: (file: File | null) => void }) {
  const t = useTranslations("quote.print");
  const tu = useTranslations("quote.upload");
  const tc = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxMb = site.upload.maxFileSizeMb;

  function accept(next: File) {
    setError(null);
    const ext = extensionOf(next.name);
    if (!site.upload.documentExtensions.includes(ext as never)) {
      setError(tu("errorUnsupported", { ext: ext || "?" }));
      return;
    }
    const sizeMb = next.size / (1024 * 1024);
    if (sizeMb > maxMb) {
      setError(tu("errorTooBig", { size: sizeMb.toFixed(1), max: maxMb }));
      return;
    }
    onChange(next);
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-cyan/30 bg-cyan/[0.06] px-4 py-3">
        <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-cyan" aria-hidden="true">
          <path d="M9 2v4h4M9 2H4.5A1.5 1.5 0 0 0 3 3.5v9A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V6L9 2Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
        <span className="min-w-0 flex-1 truncate text-sm text-paper">{file.name}</span>
        <span className="shrink-0 text-xs tabular-nums text-muted-2">
          {(file.size / (1024 * 1024)).toFixed(1)} MB
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={tc("remove")}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-white/10 hover:text-paper"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const next = e.dataTransfer.files?.[0];
          if (next) accept(next);
        }}
        className={clsx(
          "cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
          dragging ? "border-cyan bg-cyan/10" : "border-line-strong bg-white/[0.03] hover:border-cyan/50",
        )}
      >
        <p className="text-sm font-medium text-paper">{t("uploadDoc")}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-2">{t("uploadDocHint")}</p>
        <input
          ref={inputRef}
          type="file"
          accept={site.upload.documentExtensions.join(",")}
          className="sr-only"
          onChange={(e) => {
            const next = e.target.files?.[0];
            if (next) accept(next);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
