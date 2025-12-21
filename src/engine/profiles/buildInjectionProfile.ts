import type { InjectionStep, ProfileBuildInput } from "./profileTypes";
import { computePieceComplexityScore, chooseInjectionSteps, chooseSwitchoverPercent } from "./computePieceComplexity";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

function buildMultipliers(n: number): Array<{ endVolPct: number; mult: number }> {
  if (n === 2) return [
    { endVolPct: 90,  mult: 0.90 },
    { endVolPct: 98,  mult: 0.55 },
  ];
  if (n === 3) return [
    { endVolPct: 10,  mult: 0.45 },
    { endVolPct: 90,  mult: 1.00 },
    { endVolPct: 98,  mult: 0.65 },
  ];
  if (n === 4) return [
    { endVolPct: 8,   mult: 0.40 },
    { endVolPct: 70,  mult: 1.05 },
    { endVolPct: 95,  mult: 0.75 },
    { endVolPct: 98,  mult: 0.45 },
  ];
  return [
    { endVolPct: 6,   mult: 0.35 },
    { endVolPct: 40,  mult: 0.85 },
    { endVolPct: 80,  mult: 1.10 },
    { endVolPct: 95,  mult: 0.70 },
    { endVolPct: 98,  mult: 0.40 },
  ];
}

export function buildInjectionProfile(input: ProfileBuildInput): {
  complexityScore: number;
  injectionSteps: number;
  switchover_volumePercent: number;
  injectionProfile: InjectionStep[];
} {
  const score = computePieceComplexityScore(input);
  const n = chooseInjectionSteps(score);
  const sw = chooseSwitchoverPercent(input, score);

  const target = input.targetInjectionSpeed_cm3_s;
  const maxV = input.maxInjectionSpeed_cm3_s;

  const plan = buildMultipliers(n);

  const injectionProfile: InjectionStep[] = plan.map((p, idx) => {
    const raw = target * p.mult;
    const v = round1(clamp(raw, 0, maxV));
    return {
      step: idx + 1,
      speed_cm3_s: v,
      endBy: { kind: "volumePercent", value: p.endVolPct },
    };
  });

  return {
    complexityScore: score,
    injectionSteps: n,
    switchover_volumePercent: sw,
    injectionProfile,
  };
}
