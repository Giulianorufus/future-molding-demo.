import type { CadAnalysisResult } from "../types";

/**
 * Clean temporary STEP/IGES loader used to replace the corrupted file.
 * Returns a safe fallback result so TypeScript/tests can proceed.
 */
export async function loadStepWithOcctAndAnalyze(file: File): Promise<CadAnalysisResult> {
  return {
    format: "step",
    volumeCm3: null,
    areaApproxCm2: null,
    thicknessAvgMm: null,
    bbox: { x: 0, y: 0, z: 0 },
    viewerUrl: URL.createObjectURL(file),
  };
}

export default loadStepWithOcctAndAnalyze;
