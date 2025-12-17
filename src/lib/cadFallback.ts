export type CadAnalysisResult = {
  ok: boolean;
  source: "occt" | "fallback";
  volume_cm3: number;
  projectedArea_cm2: number;
  thickness_mm: { min: number; max: number; avg: number };
  warnings: string[];
  assumptions: string[];
};

export function cadFallbackResult(reason: unknown): CadAnalysisResult {
  const reasonMsg =
    reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "unknown error";

  // Conservative stable defaults
  const thicknessAvg = 2.0; // mm
  const areaProj = 50.0; // cm^2
  const volume = 10.0; // cm^3

  return {
    ok: false,
    source: "fallback",
    volume_cm3: volume,
    projectedArea_cm2: areaProj,
    thickness_mm: { min: 1.0, max: 3.0, avg: thicknessAvg },
    warnings: [
      `CAD/STEP analysis failed; using fallback geometry. Reason: ${reasonMsg}`,
    ],
    assumptions: [
      "Fallback geometry used (default thickness/area/volume).",
      "Results may be conservative; re-run with a valid STEP/OCCT analysis for higher accuracy.",
    ],
  };
}

export default { cadFallbackResult };
