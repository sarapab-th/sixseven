/**
 * ============================================================
 *  SIXSEVEN — PRICING CONFIGURATION
 * ============================================================
 *  EVERY price on the website comes from this one file.
 *  Change a number here and the whole site updates.
 *  All amounts are Thai Baht (THB).
 *
 *  ราคาทั้งหมดของเว็บไซต์มาจากไฟล์นี้ไฟล์เดียว
 *  แก้ตัวเลขที่นี่ ทั้งเว็บจะอัปเดตตาม (หน่วย: บาท)
 * ============================================================
 */

export const CURRENCY = "THB";
export const CURRENCY_SYMBOL = "฿";

/** Thai VAT. Set `enabled: false` if you are not VAT registered. */
export const VAT = {
  enabled: true,
  rate: 0.07,
  /** true  = the prices below already include VAT
   *  false = VAT is added on top at checkout */
  inclusive: false,
};

/* ============================================================
 *  1. 3D PRINTING
 * ============================================================ */

export type ProcessId = "fdm" | "sla";

export const PROCESSES = {
  fdm: {
    id: "fdm",
    /** Usable build volume in millimetres */
    buildVolume: { x: 256, y: 256, z: 256 },
    /** Fee added once per order to cover slicing, setup and plate prep */
    setupFee: 50,
    /** Machine time charged per hour */
    machineRatePerHour: 60,
    /** How fast the nozzle lays down plastic, in cm³ per hour.
     *  8 mm³/s ≈ 28.8 cm³/hour for a 0.4 mm nozzle. */
    volumetricRateCm3PerHour: 28.8,
    /** Extra seconds spent per layer on travel, z-hop and retraction */
    overheadSecondsPerLayer: 2.5,
    /** Perimeter wall thickness in mm — used to estimate material use */
    wallThicknessMm: 1.2,
    /** Allowance for support material and purge, as a fraction */
    supportAllowance: 0.05,
  },
  sla: {
    id: "sla",
    buildVolume: { x: 200, y: 125, z: 220 },
    setupFee: 100,
    machineRatePerHour: 120,
    /** Resin cures a whole layer at once, so time depends on layer count,
     *  not on how much resin the layer contains. */
    secondsPerLayer: 8,
    /** Resin parts are printed solid; supports add roughly this much */
    supportAllowance: 0.12,
  },
} as const;

export type MaterialId =
  | "pla" | "pla-silk" | "petg" | "abs" | "tpu" | "pa12-cf"
  | "resin-standard" | "resin-tough" | "resin-clear";

export interface Material {
  id: MaterialId;
  process: ProcessId;
  /** Grams per cubic centimetre — used to turn volume into weight */
  density: number;
  /** What you charge per gram of finished part */
  pricePerGram: number;
  /** Hex colours offered as standard, shown as swatches */
  colors: string[];
  /** Shown as small tags on the material card */
  tags: { en: string[]; th: string[] };
  /** 1–5, used for the comparison bars on the 3D printing page */
  ratings: { strength: number; detail: number; heat: number };
}

export const MATERIALS: Material[] = [
  { id: "pla",            process: "fdm", density: 1.24, pricePerGram: 4.5,
    colors: ["#F5F5F5", "#111111", "#00E5FF", "#FF2E88", "#FFD400", "#22C55E", "#EF4444", "#9B5CFF"],
    tags: { en: ["Everyday", "Cheapest", "Best detail (FDM)"], th: ["ใช้งานทั่วไป", "ราคาประหยัด", "รายละเอียดดี"] },
    ratings: { strength: 3, detail: 4, heat: 1 } },

  { id: "pla-silk",       process: "fdm", density: 1.24, pricePerGram: 6.5,
    colors: ["#D4AF37", "#C0C0C0", "#B87333", "#E6E6FA"],
    tags: { en: ["Glossy", "Display pieces"], th: ["ผิวเงา", "งานโชว์"] },
    ratings: { strength: 3, detail: 3, heat: 1 } },

  { id: "petg",           process: "fdm", density: 1.27, pricePerGram: 6.0,
    colors: ["#F5F5F5", "#111111", "#00E5FF", "#22C55E", "#EF4444"],
    tags: { en: ["Tough", "Water resistant", "Outdoor"], th: ["เหนียว", "กันน้ำ", "ใช้นอกอาคาร"] },
    ratings: { strength: 4, detail: 3, heat: 3 } },

  { id: "abs",            process: "fdm", density: 1.04, pricePerGram: 5.5,
    colors: ["#F5F5F5", "#111111", "#EF4444"],
    tags: { en: ["Heat resistant", "Machinable"], th: ["ทนความร้อน", "กลึงต่อได้"] },
    ratings: { strength: 4, detail: 3, heat: 4 } },

  { id: "tpu",            process: "fdm", density: 1.21, pricePerGram: 9.0,
    colors: ["#111111", "#F5F5F5", "#FF2E88"],
    tags: { en: ["Flexible", "Rubber-like", "Grips & seals"], th: ["ยืดหยุ่น", "คล้ายยาง", "ปะเก็น/จับยึด"] },
    ratings: { strength: 3, detail: 2, heat: 2 } },

  { id: "pa12-cf",        process: "fdm", density: 1.06, pricePerGram: 14.0,
    colors: ["#1A1A1A"],
    tags: { en: ["Engineering", "Carbon filled", "Very stiff"], th: ["งานวิศวกรรม", "ผสมคาร์บอน", "แข็งแรงสูง"] },
    ratings: { strength: 5, detail: 3, heat: 4 } },

  { id: "resin-standard", process: "sla", density: 1.10, pricePerGram: 12.0,
    colors: ["#9CA3AF", "#111111", "#F5F5F5"],
    tags: { en: ["Fine detail", "Miniatures", "Smooth"], th: ["รายละเอียดสูง", "โมเดลจิ๋ว", "ผิวเนียน"] },
    ratings: { strength: 2, detail: 5, heat: 2 } },

  { id: "resin-tough",    process: "sla", density: 1.15, pricePerGram: 16.0,
    colors: ["#334155", "#F5F5F5"],
    tags: { en: ["Impact resistant", "Functional"], th: ["ทนแรงกระแทก", "ใช้งานจริง"] },
    ratings: { strength: 4, detail: 5, heat: 2 } },

  { id: "resin-clear",    process: "sla", density: 1.12, pricePerGram: 18.0,
    colors: ["#E0F2FE"],
    tags: { en: ["Transparent", "Lenses & covers"], th: ["โปร่งใส", "เลนส์/ฝาครอบ"] },
    ratings: { strength: 2, detail: 5, heat: 2 } },
];

/**
 * Layer height options. Finer layers = slower = more expensive.
 *
 * `speedFactor`     — how fast the machine runs at this layer height.
 *                     A finer layer prints slower, which already raises the
 *                     machine-time part of the price on its own.
 * `priceMultiplier` — a small quality premium charged ON TOP of that longer
 *                     print time (tighter tolerances, more care, more
 *                     reprints). Keep it close to 1.0.
 */
export const QUALITY_TIERS = [
  { id: "draft",    layerHeightMm: 0.28, speedFactor: 1.5,  priceMultiplier: 0.95, process: "fdm" as ProcessId },
  { id: "standard", layerHeightMm: 0.20, speedFactor: 1.0,  priceMultiplier: 1.0,  process: "fdm" as ProcessId },
  { id: "fine",     layerHeightMm: 0.12, speedFactor: 0.65, priceMultiplier: 1.12, process: "fdm" as ProcessId },
  { id: "ultra",    layerHeightMm: 0.08, speedFactor: 0.45, priceMultiplier: 1.25, process: "fdm" as ProcessId },
  { id: "sla-fine", layerHeightMm: 0.05, speedFactor: 1.0,  priceMultiplier: 1.0,  process: "sla" as ProcessId },
  { id: "sla-ultra",layerHeightMm: 0.025,speedFactor: 1.0,  priceMultiplier: 1.3,  process: "sla" as ProcessId },
];

/** How hollow the inside of an FDM part is. */
export const INFILL_OPTIONS = [
  { value: 0.10, id: "10" },
  { value: 0.20, id: "20" },
  { value: 0.40, id: "40" },
  { value: 0.60, id: "60" },
  { value: 1.00, id: "100" },
];

/** Optional extras added to a 3D print job. */
export const FINISHING_3D = [
  { id: "none",        price: 0,   perPart: true },
  { id: "support-removal", price: 30,  perPart: true },
  { id: "sanding",     price: 120, perPart: true },
  { id: "primed",      price: 200, perPart: true },
  { id: "painted",     price: 450, perPart: true },
  { id: "assembly",    price: 300, perPart: false },
];

/** Discount applied once quantity reaches each threshold. */
export const QUANTITY_BREAKS = [
  { min: 1,   discount: 0 },
  { min: 5,   discount: 0.05 },
  { min: 10,  discount: 0.10 },
  { min: 25,  discount: 0.17 },
  { min: 50,  discount: 0.25 },
  { min: 100, discount: 0.32 },
];

/** Turnaround options — surcharge as a fraction of the job total. */
export const TURNAROUND = [
  { id: "standard", businessDays: 5, surcharge: 0 },
  { id: "express",  businessDays: 2, surcharge: 0.35 },
  { id: "rush",     businessDays: 1, surcharge: 0.75 },
];

/** No 3D print job is invoiced below this amount. */
export const MINIMUM_ORDER_3D = 150;

/* ============================================================
 *  2. DIGITAL PRINTING & COPYING  (A4 / A3)
 * ============================================================ */

export type PaperSize = "a4" | "a3";
export type ColorMode = "bw" | "color";

/**
 * Price per SIDE printed. Quantity tiers: the price drops once the
 * customer passes each `from` threshold.
 * ราคาต่อหน้า — ยิ่งพิมพ์เยอะ ยิ่งถูกลง
 */
export const PRINT_TIERS: Record<PaperSize, Record<ColorMode, { from: number; price: number }[]>> = {
  a4: {
    bw: [
      { from: 1,    price: 2.0 },
      { from: 50,   price: 1.5 },
      { from: 200,  price: 1.0 },
      { from: 1000, price: 0.75 },
    ],
    color: [
      { from: 1,    price: 10.0 },
      { from: 50,   price: 8.0 },
      { from: 200,  price: 6.0 },
      { from: 1000, price: 4.5 },
    ],
  },
  a3: {
    bw: [
      { from: 1,    price: 4.0 },
      { from: 50,   price: 3.0 },
      { from: 200,  price: 2.0 },
      { from: 1000, price: 1.5 },
    ],
    color: [
      { from: 1,    price: 20.0 },
      { from: 50,   price: 16.0 },
      { from: 200,  price: 12.0 },
      { from: 1000, price: 9.0 },
    ],
  },
};

/** Paper stock. `multiplier` scales the per-side price above. */
export const PAPER_STOCKS = [
  { id: "plain-80",   gsm: 80,  multiplier: 1.0 },
  { id: "premium-100",gsm: 100, multiplier: 1.3 },
  { id: "matte-120",  gsm: 120, multiplier: 1.6 },
  { id: "card-160",   gsm: 160, multiplier: 2.1 },
  { id: "card-250",   gsm: 250, multiplier: 3.0 },
  { id: "photo-200",  gsm: 200, multiplier: 4.5 },
  { id: "sticker",    gsm: 150, multiplier: 5.0 },
];

/** Double sided costs two sides but saves a little on handling. */
export const DUPLEX_DISCOUNT = 0.1;

/** Scanning / copying from a physical original. */
export const COPY_SERVICE = {
  /** Surcharge per original page that has to be placed on the glass */
  handlingPerOriginal: 1.0,
  /** Flat fee if the customer brings a bound book we must copy carefully */
  boundOriginalFee: 50,
  /** Scan to PDF/JPG, per page */
  scanPerPage: { a4: 3.0, a3: 5.0 },
};

/** Finishing for paper jobs. `per` controls how it is counted. */
export const FINISHING_PRINT = [
  { id: "none",        price: 0,   per: "order" as const },
  { id: "staple",      price: 3,   per: "set" as const },
  { id: "ring-bind",   price: 45,  per: "set" as const },
  { id: "tape-bind",   price: 60,  per: "set" as const },
  { id: "laminate-a4", price: 25,  per: "sheet" as const },
  { id: "laminate-a3", price: 45,  per: "sheet" as const },
  { id: "cut-trim",    price: 1,   per: "sheet" as const },
  { id: "fold",        price: 1.5, per: "sheet" as const },
];

/** No paper job is invoiced below this amount. */
export const MINIMUM_ORDER_PRINT = 20;

/** Same-day paper printing surcharge, as a fraction of the total. */
export const PRINT_TURNAROUND = [
  { id: "standard", hours: 24, surcharge: 0 },
  { id: "same-day", hours: 4,  surcharge: 0.3 },
  { id: "while-you-wait", hours: 1, surcharge: 0.6 },
];

/* ============================================================
 *  3. DELIVERY
 * ============================================================ */

export const DELIVERY = [
  { id: "pickup",    price: 0,   days: 0 },
  { id: "bangkok",   price: 60,  days: 1 },
  { id: "upcountry", price: 100, days: 3 },
  { id: "express",   price: 180, days: 1 },
];

/** Order value above which delivery is free. Set to null to disable. */
export const FREE_DELIVERY_OVER: number | null = 2000;
