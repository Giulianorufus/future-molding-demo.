import type { PackingStep, ProfileBuildInput } from "./profileTypes";
import { computePieceComplexityScore, choosePackingSteps } from "./computePieceComplexity";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

function materialTimeFactor(materialId?: string): number {
  const m = (materialId ?? "").toUpperCase();
  let f = 1.1;
  if (m.includes("PP")) f = 1.0;
  else if (m.includes("ABS")) f = 1.1;
  else if (m.includes("PC")) f = 1.4;
  else if (m.includes("PA6")) f = 1.3;
  else if (m.includes("PA66")) f = 1.35;

  if (m.includes("GF30")) f *= 1.1;
  if (m.includes("GF60")) f *= 1.2;

  return clamp(f, 0.9, 1.8);
}

function estimateHoldingTime_s(thkAvg_mm?: number, materialId?: string): number {
  const t = thkAvg_mm ?? 2.5;
  const base = 2.0;
  const byThk = Math.max(0, (t - 2.0)) * 1.2;
  const total = (base + byThk) * materialTimeFactor(materialId);
  return clamp(total, 2.0, 18.0);
}

function splitTimes(total: number, n: number): number[] {
  if (n === 1) return [total];
  if (n === 2) return [total * 0.35, total * 0.65];
  if (n === 3) return [total * 0.20, total * 0.55, total * 0.25];
  return [total * 0.15, total * 0.45, total * 0.25, total * 0.15];
}

function pressureLevels(peak: number, n: number): number[] {
  if (n === 1) return [peak * 0.65];
  if (n === 2) return [peak * 0.78, peak * 0.55];
  if (n === 3) return [peak * 0.82, peak * 0.60, peak * 0.45];
  return [peak * 0.85, peak * 0.62, peak * 0.45, peak * 0.32];
}

export function buildPackingProfile(input: ProfileBuildInput): {
  complexityScore: number;
  packingSteps: number;
  packingProfile: PackingStep[];
  holdingTimeTotal_s: number;
} {
  const score = computePieceComplexityScore(input);
  const n = choosePackingSteps(score);

  const total = estimateHoldingTime_s(input.thicknessAvg_mm, input.materialId);
  const times = splitTimes(total, n);
  const levels = pressureLevels(input.peakInjectionPressure_bar, n);

  const maxP = input.maxInjectionPressure_bar;

  const packingProfile: PackingStep[] = times.map((t, idx) => {
    const p = round1(clamp(levels[idx], 0, maxP));
    return { step: idx + 1, pressure_bar: p, time_s: round1(t) };
  });

  return {
    complexityScore: score,
    packingSteps: n,
    packingProfile,
    holdingTimeTotal_s: round1(total),
  };
}
