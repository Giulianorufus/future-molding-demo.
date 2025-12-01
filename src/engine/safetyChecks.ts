import { CalcInput as UserCalcInput, CalcOutput as UserCalcOutput } from "./calcTypes";

// Minimal safety enforcement layer.
// Aligns with the actual CalcOutput shape defined in `calcTypes.ts`.
export function enforceSafety(input: UserCalcInput, raw: UserCalcOutput): UserCalcOutput {
  const out: UserCalcOutput = JSON.parse(JSON.stringify(raw));
  let modified = false;

  const clampNumber = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

  if (typeof out.velIniezione === "number" && (!Number.isFinite(out.velIniezione) || out.velIniezione < 0)) {
    out.velIniezione = Math.max(0, clampNumber(out.velIniezione));
    modified = true;
  }
  if (typeof out.pressioneIniezione === "number" && (!Number.isFinite(out.pressioneIniezione) || out.pressioneIniezione < 0)) {
    out.pressioneIniezione = Math.max(0, clampNumber(out.pressioneIniezione));
    modified = true;
  }
  if (typeof out.fillTime === "number" && (!Number.isFinite(out.fillTime) || out.fillTime < 0)) {
    out.fillTime = Math.max(0, clampNumber(out.fillTime));
    modified = true;
  }

  if (typeof out.packPressione === "number" && (!Number.isFinite(out.packPressione) || out.packPressione < 0)) {
    out.packPressione = Math.max(0, clampNumber(out.packPressione));
    modified = true;
  }
  if (typeof out.packTempo === "number" && (!Number.isFinite(out.packTempo) || out.packTempo < 0)) {
    out.packTempo = Math.max(0, clampNumber(out.packTempo));
    modified = true;
  }

  // Profiles are objects with step1/step2/step3 (if present)  clamp them
  const clampSteps = (p: any | undefined) => {
    if (!p || typeof p !== "object") return;
    ["step1", "step2", "step3"].forEach((k) => {
      if (typeof p[k] === "number") {
        if (!Number.isFinite(p[k]) || p[k] < 0) {
          p[k] = Math.max(0, clampNumber(p[k]));
          modified = true;
        }
      }
    });
  };

  clampSteps(out.profiloIniezione as any);
  clampSteps(out.profiloPressione as any);
  clampSteps(out.profiloPack as any);

  if (modified) {
    const note = "Output adjusted by safetyChecks to enforce non-negative and finite values.";
    if (!Array.isArray(out.suggerimenti)) out.suggerimenti = [];
    out.suggerimenti.push(note);
  }

  return out;
}

export default enforceSafety;
