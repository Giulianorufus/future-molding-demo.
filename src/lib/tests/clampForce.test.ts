import { computeClampForce } from "../clampForce";

describe("computeClampForce", () => {
  it("computes clamp force kN from area cm2 and pressure bar", () => {
    // area 100 cm², pressure 400 bar, SF 1.0 => 400 kN
    const r = computeClampForce({ projectedArea_cm2: 100, cavityPressure_bar: 400, safetyFactor: 1.0 });
    expect(r.clampForceRequired_kN).toBeCloseTo(400, 6);
  });

  it("computes clamp pressure in g/cm2", () => {
    const r = computeClampForce({ projectedArea_cm2: 100, cavityPressure_bar: 400, safetyFactor: 1.0 });
    expect(r.clampPressureRequired_g_cm2).toBeGreaterThan(400000);
    expect(r.clampPressureRequired_g_cm2).toBeLessThan(420000);
  });

  it("handles zero area safely", () => {
    const r = computeClampForce({ projectedArea_cm2: 0, cavityPressure_bar: 400 });
    expect(r.clampForceRequired_kN).toBe(0);
    expect(r.clampPressureRequired_g_cm2).toBe(0);
  });
});
