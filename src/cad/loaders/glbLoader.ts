// Deprecated GLB loader stub (neutralized during Phase A cleanup).
export async function loadGlbAndAnalyze(_: File) {
  return {
    format: "glb",
    volumeCm3: null,
    areaApproxCm2: null,
    thicknessAvgMm: null,
    bbox: { x: 0, y: 0, z: 0 },
    viewerUrl: null,
  } as any;
}

export default loadGlbAndAnalyze;
