/**
 * 3D printing quote engine.
 *
 * Takes the measurements from `mesh.ts` plus the customer's choices and
 * produces a full price breakdown. Pure functions only — the same code runs
 * in the browser for the live quote and on the server when the request is
 * submitted, so the two can never disagree.
 */

import {
  MATERIALS, PROCESSES, QUALITY_TIERS, QUANTITY_BREAKS, TURNAROUND,
  FINISHING_3D, MINIMUM_ORDER_3D, VAT,
  type MaterialId, type ProcessId,
} from "~/config/pricing";
import type { MeshStats } from "./mesh";

export interface Quote3DOptions {
  materialId: MaterialId;
  qualityId: string;
  /** Fraction between 0 and 1 */
  infill: number;
  quantity: number;
  /** 100 = original size */
  scalePercent: number;
  finishingIds: string[];
  turnaroundId: string;
}

export interface QuoteWarning {
  code: "too-large" | "open-surface" | "very-small" | "long-print" | "high-poly";
  /** Extra values the UI interpolates into the translated message */
  values?: Record<string, string | number>;
}

export interface Quote3DResult {
  ok: boolean;
  /** Scaled bounding box in mm */
  size: { x: number; y: number; z: number };
  volumeCm3: number;
  materialVolumeCm3: number;
  weightGrams: number;
  printHours: number;
  layers: number;

  perUnit: { material: number; machine: number; total: number };
  productionTotal: number;
  quantityDiscountRate: number;
  quantityDiscount: number;
  finishing: number;
  setupFee: number;
  rushSurcharge: number;

  /** Amount added to reach the shop minimum, if any */
  minimumTopUp: number;
  subtotal: number;
  vat: number;
  total: number;

  leadTimeDays: number;
  warnings: QuoteWarning[];
}

export function getMaterial(id: MaterialId) {
  const m = MATERIALS.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown material: ${id}`);
  return m;
}

export function qualitiesFor(process: ProcessId) {
  return QUALITY_TIERS.filter((q) => q.process === process);
}

export function quantityDiscountFor(quantity: number): number {
  let rate = 0;
  for (const tier of QUANTITY_BREAKS) if (quantity >= tier.min) rate = tier.discount;
  return rate;
}

/** Does the part fit the machine in any orientation? */
function fitsBuildVolume(
  size: { x: number; y: number; z: number },
  volume: { x: number; y: number; z: number },
): boolean {
  const part = [size.x, size.y, size.z].sort((a, b) => a - b);
  const bed = [volume.x, volume.y, volume.z].sort((a, b) => a - b);
  return part[0] <= bed[0] && part[1] <= bed[1] && part[2] <= bed[2];
}

export function quote3D(stats: MeshStats, options: Quote3DOptions): Quote3DResult {
  const material = getMaterial(options.materialId);
  const process = PROCESSES[material.process];
  const quality =
    QUALITY_TIERS.find((q) => q.id === options.qualityId) ??
    qualitiesFor(material.process)[0];
  const turnaround =
    TURNAROUND.find((t) => t.id === options.turnaroundId) ?? TURNAROUND[0];

  const quantity = Math.max(1, Math.floor(options.quantity || 1));
  const s = Math.max(10, Math.min(500, options.scalePercent || 100)) / 100;

  // Scaling a solid: length × s, area × s², volume × s³
  const size = { x: stats.size.x * s, y: stats.size.y * s, z: stats.size.z * s };
  const volumeCm3 = stats.volumeCm3 * s ** 3;
  const surfaceAreaCm2 = stats.surfaceAreaCm2 * s ** 2;

  /* ---------- how much material the part actually consumes ---------- */
  let materialVolumeCm3: number;

  if (material.process === "fdm") {
    const fdm = PROCESSES.fdm;
    // Perimeter walls are printed solid regardless of infill.
    const shellVolume = Math.min(
      surfaceAreaCm2 * (fdm.wallThicknessMm / 10),
      volumeCm3 * 0.95,
    );
    const interior = Math.max(0, volumeCm3 - shellVolume);
    const infill = Math.max(0, Math.min(1, options.infill));
    materialVolumeCm3 = (shellVolume + interior * infill) * (1 + fdm.supportAllowance);
  } else {
    // Resin parts are cured solid; supports and the raft add the rest.
    materialVolumeCm3 = volumeCm3 * (1 + PROCESSES.sla.supportAllowance);
  }

  const weightGrams = materialVolumeCm3 * material.density;

  /* ---------- how long the machine is tied up ---------- */
  const layers = quality.layerHeightMm > 0 ? Math.ceil(size.z / quality.layerHeightMm) : 0;
  let printHours: number;

  if (material.process === "fdm") {
    const fdm = PROCESSES.fdm;
    const extrusionHours =
      materialVolumeCm3 / (fdm.volumetricRateCm3PerHour * quality.speedFactor);
    const overheadHours = (layers * fdm.overheadSecondsPerLayer) / 3600;
    printHours = extrusionHours + overheadHours;
  } else {
    // Resin cures a whole layer at once — height drives the time, not volume.
    printHours = (layers * PROCESSES.sla.secondsPerLayer) / 3600;
  }

  /* ---------- money ---------- */
  const materialCost = weightGrams * material.pricePerGram;
  const machineCost = printHours * process.machineRatePerHour;
  const perUnitTotal = (materialCost + machineCost) * quality.priceMultiplier;

  const productionTotal = perUnitTotal * quantity;
  const quantityDiscountRate = quantityDiscountFor(quantity);
  const quantityDiscount = productionTotal * quantityDiscountRate;

  const finishing = options.finishingIds.reduce((sum, id) => {
    const item = FINISHING_3D.find((f) => f.id === id);
    if (!item) return sum;
    return sum + (item.perPart ? item.price * quantity : item.price);
  }, 0);

  const setupFee = process.setupFee;
  const beforeRush = productionTotal - quantityDiscount + finishing + setupFee;
  const rushSurcharge = beforeRush * turnaround.surcharge;

  const rawSubtotal = beforeRush + rushSurcharge;
  const minimumTopUp = Math.max(0, MINIMUM_ORDER_3D - rawSubtotal);
  const subtotal = rawSubtotal + minimumTopUp;

  const vat = VAT.enabled && !VAT.inclusive ? subtotal * VAT.rate : 0;
  const total = subtotal + vat;

  /* ---------- things the customer should know ---------- */
  const warnings: QuoteWarning[] = [];

  if (!fitsBuildVolume(size, process.buildVolume)) {
    warnings.push({
      code: "too-large",
      values: {
        x: Math.round(process.buildVolume.x),
        y: Math.round(process.buildVolume.y),
        z: Math.round(process.buildVolume.z),
      },
    });
  }
  if (stats.isOpenSurface) warnings.push({ code: "open-surface" });
  if (volumeCm3 > 0 && volumeCm3 < 0.5) warnings.push({ code: "very-small" });
  if (printHours * quantity > 24) {
    warnings.push({ code: "long-print", values: { hours: Math.round(printHours * quantity) } });
  }
  if (stats.triangles > 900_000) {
    warnings.push({ code: "high-poly", values: { triangles: stats.triangles } });
  }

  // A long print pushes the realistic lead time out beyond the headline figure.
  const extraDays = Math.floor((printHours * quantity) / 10);
  const leadTimeDays = turnaround.businessDays + extraDays;

  return {
    ok: volumeCm3 > 0,
    size, volumeCm3, materialVolumeCm3, weightGrams, printHours, layers,
    perUnit: { material: materialCost, machine: machineCost, total: perUnitTotal },
    productionTotal, quantityDiscountRate, quantityDiscount, finishing, setupFee,
    rushSurcharge, minimumTopUp, subtotal, vat, total,
    leadTimeDays, warnings,
  };
}
