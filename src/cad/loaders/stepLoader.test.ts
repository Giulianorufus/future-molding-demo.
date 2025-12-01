import { loadStepWithOcctAndAnalyze } from "./stepLoader";

// Minimal fallback test: when OCCT is not available, loader should return
// a CadAnalysisResult with viewerUrl and null numeric metrics.

test("fallback returns viewerUrl and null metrics for STEP when occt absent", async () => {
  // Create a small fake File-like object
  const blob = new Blob(["dummy"], { type: "application/octet-stream" });
  // @ts-ignore - Jest environment provides global File in JSDOM, but in node we can mock
  const file = new File([blob], "test.step", { type: "model/step" });

  const res = await loadStepWithOcctAndAnalyze(file, "step");

  expect(res).toBeTruthy();
  expect(res.format).toBe("step");
  expect(typeof res.viewerUrl).toBe("string");
  expect(res.volumeCm3).toBeNull();
  expect(res.areaApproxCm2).toBeNull();
  expect(res.thicknessAvgMm).toBeNull();
});
