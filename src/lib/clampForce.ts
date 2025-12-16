// src/lib/clampForce.ts

export type ClampForceInput = {
  projectedArea_cm2: number;   // area proiettata (cm²)
  cavityPressure_bar: number;  // pressione cavità stimata (bar)
  safetyFactor?: number;       // 1.0–1.4 tipico
};

export type ClampForceResult = {
  projectedArea_cm2: number;
  clampForceRequired_kN: number;        // kN richiesti
  clampPressureRequired_g_cm2: number;  // g/cm² richiesti
};

const N_PER_KN = 1000;
const N_PER_KGF = 9.80665;
const G_PER_KGF = 1000;

// 1 kN -> g (kgf*1000)
const G_PER_KN = (N_PER_KN / N_PER_KGF) * G_PER_KGF; // ~101971.621

/**
 * 1 bar = 0.1 N/mm²
 * 1 cm² = 100 mm²
 * Forza N = bar*0.1 * cm²*100 = bar*10*cm²
 * Forza kN = (bar*10*cm²)/1000 = bar*0.01*cm²
 */
export function computeClampForce({
  projectedArea_cm2,
  cavityPressure_bar,
  safetyFactor = 1.15,
}: ClampForceInput): ClampForceResult {
  const area = Math.max(0, projectedArea_cm2);
  const p = Math.max(0, cavityPressure_bar);
  const sf = Math.max(0.9, Math.min(2.0, safetyFactor));

  const clampForceRequired_kN = p * 0.01 * area * sf;
  const clampPressureRequired_g_cm2 =
    area > 0 ? (clampForceRequired_kN * G_PER_KN) / area : 0;

  return {
    projectedArea_cm2: area,
    clampForceRequired_kN,
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
