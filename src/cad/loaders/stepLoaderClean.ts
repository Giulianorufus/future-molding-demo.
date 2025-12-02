// This loader has been deprecated and neutralized as part of the Phase A cleanup.
// Kept as a stub to avoid import errors while removing duplicates.
export async function loadStepWithOcctAndAnalyze(_: File) {
  return {
    format: "step",
    volumeCm3: null,
    areaApproxCm2: null,
    thicknessAvgMm: null,
    bbox: { x: 0, y: 0, z: 0 },
    viewerUrl: null,
  } as any;
}

export default loadStepWithOcctAndAnalyze;
