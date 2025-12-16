import { computeClampForce } from "../clampForce";
import { estimateProjectedAreaFromBbox3_mm } from "../clampForce";

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

  it("estimates projected area from bbox using min axis as clamp axis", () => {
    // x è minimo => clamp su X => area = y*z = 50*20=1000 mm² => 10 cm²
    expect(estimateProjectedAreaFromBbox3_mm({ x: 10, y: 50, z: 20 })).toBeCloseTo(10, 6);
  });
});
