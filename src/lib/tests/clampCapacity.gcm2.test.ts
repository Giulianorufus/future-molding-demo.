import { computeClampForce } from "../clampForce";
import { evaluateClampCapacity } from "../clampCapacity";

describe("clamp force from g/cm² model", () => {
  test("OK: required well below press capacity", () => {
    const cf = computeClampForce({ projectedArea_cm2: 140, cavityPressure_bar: 400, safetyFactor: 1.1 });
    // kN = 400 * 140 * 0.01 * 1.1 = 616
    expect(cf.clampForceRequired_kN).toBeCloseTo(616, 6);

    const cap = evaluateClampCapacity({ required_kN: cf.clampForceRequired_kN, available_kN: 800 });
    expect(cap.status).toBe("ok");
    expect(cap.utilization_pct).toBeGreaterThan(70);
    expect(cap.utilization_pct).toBeLessThan(90);
  });

  test("Borderline: 90–100% of press capacity", () => {
    const cf = computeClampForce({ projectedArea_cm2: 140, cavityPressure_bar: 519, safetyFactor: 1.1 });
    // kN = 520 * 140 * 0.01 * 1.1 = 800.8 -> borderline
    const cap = evaluateClampCapacity({ required_kN: cf.clampForceRequired_kN, available_kN: 800 });
    expect(cap.status).toBe("borderline");
    expect(cap.utilization_pct).toBeGreaterThanOrEqual(90);
    expect(cap.utilization_pct).toBeLessThanOrEqual(100);
  });

  test("Fail: required above press capacity", () => {
    const cf = computeClampForce({ projectedArea_cm2: 140, cavityPressure_bar: 600, safetyFactor: 1.1 });
    // kN = 924
    const cap = evaluateClampCapacity({ required_kN: cf.clampForceRequired_kN, available_kN: 800 });
    expect(cap.status).toBe("fail");
    expect(cap.utilization_pct).toBeGreaterThan(100);
  });
});
