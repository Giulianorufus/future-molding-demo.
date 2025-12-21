import type { ProfileBuildInput } from "./profileTypes";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function materialDifficulty(materialId?: string): number {
  const m = (materialId ?? "").toUpperCase();

  let d = 15;
  if (m.includes("PP")) d = 10;
  else if (m.includes("ABS")) d = 15;
  else if (m.includes("PC")) d = 35;
  else if (m.includes("PA66")) d = 35;
  else if (m.includes("PA6")) d = 30;

  if (m.includes("GF60")) d += 25;
  else if (m.includes("GF30")) d += 15;

  return clamp(d, 0, 60);
}

function thicknessVariabilityScore(avg?: number, min?: number, max?: number): number {
  if (!avg || !min || !max) return 10;
  const varRatio = (max - min) / Math.max(avg, 0.1);
    return clamp(varRatio * 20, 0, 20);
}

function utilizationScore(u?: number): number {
  if (u === undefined) return 0;
  if (u >= 0.90) return 25;
  if (u >= 0.80) return 18;
  if (u >= 0.70) return 10;
  if (u >= 0.55) return 6;
  return 0;
}

export function computePieceComplexityScore(input: ProfileBuildInput): number {
  const dMat = materialDifficulty(input.materialId);
  const dThk = thicknessVariabilityScore(
    input.thicknessAvg_mm,
    input.thicknessMin_mm,
    input.thicknessMax_mm
  );

  const dShot = utilizationScore(input.shotUtilization);
  const dSpd  = utilizationScore(input.speedUtilization);
  const dPrs  = utilizationScore(input.pressureUtilization);

  const score = 10 + dMat + dThk + dShot + dSpd + dPrs;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function chooseInjectionSteps(score: number): number {
  if (score <= 25) return 2;
  if (score <= 55) return 3;
  if (score <= 80) return 4;
  return 5;
}

export function choosePackingSteps(score: number): number {
  if (score <= 25) return 1;
  if (score <= 55) return 2;
  if (score <= 80) return 3;
  return 4;
}

export function chooseSwitchoverPercent(input: ProfileBuildInput, score: number): number {
  let sw = 97.5;
  if ((input.pressureUtilization ?? 0) >= 0.85) sw -= 1.0;
  const m = (input.materialId ?? "").toUpperCase();
  const difficult = m.includes("PC") || m.includes("PA");
  if (difficult && score >= 70) sw += 0.7;
  sw = Math.max(95.0, Math.min(99.0, sw));
  return Math.round(sw * 10) / 10;
}
