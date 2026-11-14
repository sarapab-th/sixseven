/**
 * Digital printing & copying quote engine (A4 / A3).
 *
 * Same contract as the 3D engine: pure functions, shared by the live
 * calculator in the browser and the server that receives the request.
 */

import {
  PRINT_TIERS, PAPER_STOCKS, DUPLEX_DISCOUNT, COPY_SERVICE, FINISHING_PRINT,
  MINIMUM_ORDER_PRINT, PRINT_TURNAROUND, VAT,
  type PaperSize, type ColorMode,
} from "~/config/pricing";

export interface QuotePrintOptions {
  size: PaperSize;
  colorMode: ColorMode;
  /** Pages in one copy of the document */
  pages: number;
  /** How many copies of the whole document */
  copies: number;
  duplex: boolean;
  paperStockId: string;
  finishingIds: string[];
  turnaroundId: string;
  /** The customer is bringing paper originals rather than a file */
  isCopyJob: boolean;
  /** Originals are in a bound book and need careful handling */
  boundOriginal: boolean;
  /** Also deliver scanned PDFs back to the customer */
  scanToFile: boolean;
}

export interface QuotePrintResult {
  totalSides: number;
  sheets: number;
  /** The per-side rate the customer landed on after quantity tiers */
  unitPrice: number;
  /** The rate before quantity tiers, so we can show the saving */
  baseUnitPrice: number;

  printing: number;
  duplexSaving: number;
  copyHandling: number;
  scanning: number;
  finishing: number;
  rushSurcharge: number;

  minimumTopUp: number;
  subtotal: number;
  vat: number;
  total: number;

  leadTimeHours: number;
}

/** Walk the quantity tiers and return the rate that applies. */
export function tierPrice(size: PaperSize, mode: ColorMode, sides: number): number {
  const tiers = PRINT_TIERS[size][mode];
  let price = tiers[0].price;
  for (const t of tiers) if (sides >= t.from) price = t.price;
  return price;
}

export function quotePrint(options: QuotePrintOptions): QuotePrintResult {
  const pages = Math.max(1, Math.floor(options.pages || 1));
  const copies = Math.max(1, Math.floor(options.copies || 1));

  const totalSides = pages * copies;
  const sheetsPerCopy = options.duplex ? Math.ceil(pages / 2) : pages;
  const sheets = sheetsPerCopy * copies;

  const stock = PAPER_STOCKS.find((p) => p.id === options.paperStockId) ?? PAPER_STOCKS[0];
  const turnaround =
    PRINT_TURNAROUND.find((t) => t.id === options.turnaroundId) ?? PRINT_TURNAROUND[0];

  const baseUnitPrice = PRINT_TIERS[options.size][options.colorMode][0].price * stock.multiplier;
  const unitPrice = tierPrice(options.size, options.colorMode, totalSides) * stock.multiplier;

  const printing = totalSides * unitPrice;

  // Running both sides in one pass saves handling, so a little comes back.
  const duplexSaving = options.duplex ? printing * DUPLEX_DISCOUNT : 0;

  // Paper originals have to be placed on the glass once each.
  const copyHandling = options.isCopyJob
    ? pages * COPY_SERVICE.handlingPerOriginal +
      (options.boundOriginal ? COPY_SERVICE.boundOriginalFee : 0)
    : 0;

  const scanning = options.scanToFile ? pages * COPY_SERVICE.scanPerPage[options.size] : 0;

  const finishing = options.finishingIds.reduce((sum, id) => {
    const item = FINISHING_PRINT.find((f) => f.id === id);
    if (!item) return sum;
    if (item.per === "set") return sum + item.price * copies;
    if (item.per === "sheet") return sum + item.price * sheets;
    return sum + item.price;
  }, 0);

  const beforeRush = printing - duplexSaving + copyHandling + scanning + finishing;
  const rushSurcharge = beforeRush * turnaround.surcharge;

  const rawSubtotal = beforeRush + rushSurcharge;
  const minimumTopUp = Math.max(0, MINIMUM_ORDER_PRINT - rawSubtotal);
  const subtotal = rawSubtotal + minimumTopUp;

  const vat = VAT.enabled && !VAT.inclusive ? subtotal * VAT.rate : 0;
  const total = subtotal + vat;

  return {
    totalSides, sheets, unitPrice, baseUnitPrice,
    printing, duplexSaving, copyHandling, scanning, finishing, rushSurcharge,
    minimumTopUp, subtotal, vat, total,
    leadTimeHours: turnaround.hours,
  };
}
