// src/lib/defectClampTuning.ts

export type DefectClampTuningInput = {
  defectId?: string | null;
  severity?: "low" | "medium" | "high" | string | null;
  baseCavityPressure_bar: number;
  baseSafetyFactor?: number;
};

export type DefectClampTuningResult = {
  tunedCavityPressure_bar: number;
  tunedSafetyFactor: number;
  reason: string;
};

function norm(s?: string | null) {
  return (s ?? "").trim().toLowerCase();
}

function severityMult(sev?: string | null) {
  const s = norm(sev);
  if (s === "high" || s === "3") return 1.0;
  if (s === "medium" || s === "2") return 0.6;
  if (s === "low" || s === "1") return 0.35;
  return 0.6; // default prudente
}

// Mapping “reparto”: aumenta clamp solo dove serve davvero (flash/bava/parting-line flash)
export function tuneClampForDefect(input: DefectClampTuningInput): DefectClampTuningResult {
  const defect = norm(input.defectId);
  const mult = severityMult(input.severity);
  const baseP = Math.max(0, input.baseCavityPressure_bar);
  const baseSF = Math.max(0.9, Math.min(2.0, input.baseSafetyFactor ?? 1.15));

  let dP = 0;
  let dSF = 0;
  let reason = "base";

  const isFlash =
    defect.includes("flash") ||
    defect.includes("bava") ||
    defect.includes("sbav") ||
    defect.includes("rebarb") ||
    defect.includes("parting") ||
    defect.includes("fuga");

  const isOverpack =
    defect.includes("overpack") ||
    defect.includes("over-pack") ||
    defect.includes("overpacking") ||
    defect.includes("sovrapp") ||
    defect.includes("overpressure") ||
    defect.includes("over-pressure");

  const isShortShot =
    defect.includes("short") ||
    defect.includes("mancante") ||
    defect.includes("incompleto") ||
    defect.includes("short_shot") ||
    defect.includes("shortshot");

  const isBurn =
    defect.includes("burn") ||
    defect.includes("bruci") ||
    defect.includes("diesel") ||
    defect.includes("combust");

  // Politica:
  // - Flash: aumenta clamp (safety factor) e un filo di pressione cavità “stimata”
  // - Overpack: aumenta clamp un po' (per sicurezza) ma NON alza pressione stimata
  // - Short shot / burn: clamp non risolve: non toccare (eviti di “sparare” tonnellaggio a caso)
  if (isFlash) {
    dSF = 0.10 * mult;          // +0.035 .. +0.10
    dP = 50 * mult;             // +17.5 .. +50 bar (more impactful for high severity)
    reason = "flash: increase clamp SF and slight cavity pressure";
  } else if (isOverpack) {
    dSF = 0.06 * mult;
    reason = "overpack: increase clamp SF slightly";
  } else if (isShortShot) {
    reason = "short shot: clamp not tuned (focus on fill/pressure/switchover)";
  } else if (isBurn) {
    reason = "burn: clamp not tuned (focus on venting/speed/temps)";
  }

  const tunedSafetyFactor = Math.max(0.9, Math.min(2.0, baseSF + dSF));
  const tunedCavityPressure_bar = Math.max(0, baseP + dP);

  return { tunedCavityPressure_bar, tunedSafetyFactor, reason };
}
