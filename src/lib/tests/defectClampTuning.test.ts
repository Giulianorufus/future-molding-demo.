import { tuneClampForDefect } from "../defectClampTuning";

describe("tuneClampForDefect", () => {
  it("increases SF for flash", () => {
    const r = tuneClampForDefect({
      defectId: "flash",
      severity: "high",
      baseCavityPressure_bar: 450,
      baseSafetyFactor: 1.15,
    });
    expect(r.tunedSafetyFactor).toBeGreaterThan(1.15);
    expect(r.tunedCavityPressure_bar).toBeGreaterThan(450);
  });

  it("does not tune clamp for short shot", () => {
    const r = tuneClampForDefect({
      defectId: "short_shot",
      severity: "high",
      baseCavityPressure_bar: 450,
      baseSafetyFactor: 1.15,
    });
    expect(r.tunedSafetyFactor).toBeCloseTo(1.15, 6);
    expect(r.tunedCavityPressure_bar).toBeCloseTo(450, 6);
  });
});
