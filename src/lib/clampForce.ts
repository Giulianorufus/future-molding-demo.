// src/lib/clampForce.ts

export type ClampForceInput = {
  projectedArea_cm2: number; // area proiettata (cm²)
  cavityPressure_bar: number; // pressione cavità stimata (bar)
  safetyFactor?: number; // default 1.10
};

export type ClampForceResult = {
  projectedArea_cm2: number;
  cavityPressure_bar: number;
  safetyFactor: number;
  clampForceRequired_kN: number; // kN richiesti
  clampForceRequired_ton: number; // ton richiesti (metric ton-force)
  clampPressureRequired_g_cm2: number; // g/cm² richiesti
};

export type ClampStatus = "ok" | "borderline" | "fail";

const N_PER_KN = 1000;
const KN_PER_TONF = 9.80665; // kN per ton-force
// gram per kN (approx): 1 kN -> (1/9.80665) kgf -> *1000 g
const G_PER_KN = 1000 / 0.00980665; // ≈101971.621

/**
 * 1 bar = 0.1 N/mm²
 * 1 cm² = 100 mm²
 * Forza N = bar*0.1 * cm²*100 = bar*10*cm²
 * Forza kN = (bar*10*cm²)/1000 = bar*0.01*cm²
 */
export function computeClampForce(args: {
  projectedArea_cm2: number;
  cavityPressure_bar: number;
  safetyFactor?: number;
}): ClampForceResult {
  const area = Math.max(0, Number(args.projectedArea_cm2) || 0);
  const pBar = Math.max(0, Number(args.cavityPressure_bar) || 0);
  const sf = Number.isFinite(args.safetyFactor as number) ? (args.safetyFactor as number) : 1.1;

  // F_kN = p(bar) * area(cm2) * 0.01 * sf
  const clampForceRequired_kN = area > 0 ? pBar * area * 0.01 * sf : 0;

  const clampForceRequired_ton = clampForceRequired_kN / KN_PER_TONF;

  const clampPressureRequired_g_cm2 =
    area > 0 ? (clampForceRequired_kN * G_PER_KN) / area : 0;

  return {
    projectedArea_cm2: area,
    cavityPressure_bar: pBar,
    safetyFactor: sf,
    clampForceRequired_kN,
    clampForceRequired_ton,
    clampPressureRequired_g_cm2,
  };
}

/** Stima area proiettata da bbox XY (mm) -> cm² (approssimazione “da reparto”). */
export function estimateProjectedAreaFromBbox_mm(bbox?: { x: number; y: number }): number {
  if (!bbox) return 0;
  const x = Math.max(0, bbox.x);
  const y = Math.max(0, bbox.y);
  return (x * y) / 100; // mm² -> cm²
}

export function estimateProjectedAreaFromBbox3_mm(bbox?: { x: number; y: number; z: number }): number {
  if (!bbox) return 0;
  const x = Math.max(0, bbox.x);
  const y = Math.max(0, bbox.y);
  const z = Math.max(0, bbox.z);

  // asse di chiusura = dimensione minima (spessore)
  // area proiettata = prodotto delle altre due
  let area_mm2 = 0;

  if (x <= y && x <= z) area_mm2 = y * z;
  else if (y <= x && y <= z) area_mm2 = x * z;
  else area_mm2 = x * y;

  return area_mm2 / 100; // mm² -> cm²
}
