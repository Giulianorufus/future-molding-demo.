import { computeGateFreeze } from "../gateFreezeStudy";

describe("gate freeze study", () => {
  test("finds plateau time from weight curve", () => {
    const pts = [
      { holdingTime_s: 1, weight_g: 9.80 },
      { holdingTime_s: 2, weight_g: 9.92 },
      { holdingTime_s: 3, weight_g: 9.97 },
      { holdingTime_s: 4, weight_g: 9.985 },
      { holdingTime_s: 5, weight_g: 9.987 },
    ];
    const r = computeGateFreeze(pts, { absEps_g: 0.01, relEps: 0 });
    expect(r.method).toBe("weight_plateau");
    expect(r.recommendedHoldingTime_s).toBeGreaterThanOrEqual(3);
    expect(r.recommendedHoldingTime_s).toBeLessThanOrEqual(5);
  });

  test("falls back to proxy when weight missing", () => {
    const pts = [
      { holdingTime_s: 1, cycleTime_s: 22 },
      { holdingTime_s: 2, cycleTime_s: 22.5 },
      { holdingTime_s: 3, cycleTime_s: 22.6 },
      { holdingTime_s: 4, cycleTime_s: 22.61 },
    ];
    const r = computeGateFreeze(pts);
    expect(r.method).toBe("proxy_cycleTime");
    expect(r.recommendedHoldingTime_s).toBeGreaterThan(0);
  });
});
