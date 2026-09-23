import { computeClampForce } from "../clampForce";
import { evaluateClampCapacity } from "../clampCapacity";

describe("clamp force from g/cm² model", () => {
  test("OK: required well below press capacity", () => {
    const cf = computeClampForce({ projectedArea_cm2: 140, cavityPressure_bar: 300, safetyFactor: 1.1 });
    expect(cf.clampForceRequired_kN).toBeCloseTo(462, 6);

    const cap = evaluateClampCapacity({ required_kN: cf.clampForceRequired_kN, available_kN: 800 });
    expect(cap.status).toBe("ok");
    expect(cap.usable_kN).toBe(680);
    expect(cap.utilization_pct).toBeGreaterThan(60);
    expect(cap.utilization_pct).toBeLessThan(90);
  });

  test("Borderline: 90–100% of usable capacity", () => {
    const cf = computeClampForce({ projectedArea_cm2: 140, cavityPressure_bar: 420, safetyFactor: 1.1 });
    const cap = evaluateClampCapacity({ required_kN: cf.clampForceRequired_kN, available_kN: 800 });
    expect(cap.status).toBe("borderline");
    expect(cap.utilization_pct).toBeGreaterThanOrEqual(90);
    expect(cap.utilization_pct).toBeLessThanOrEqual(100);
  });

  test("Fail: required above 85% usable capacity even below nominal", () => {
    const cf = computeClampForce({ projectedArea_cm2: 140, cavityPressure_bar: 455, safetyFactor: 1.1 });
    // 700.7 kN > 680 kN usable, but < 800 kN nominal.
    expect(cf.clampForceRequired_kN).toBeLessThan(800);
    const cap = evaluateClampCapacity({ required_kN: cf.clampForceRequired_kN, available_kN: 800 });
    expect(cap.status).toBe("fail");
    expect(cap.utilization_pct).toBeGreaterThan(100);
  });
});
