import { applyDefectAutoRecalc } from "../defectEngine";

describe("defects auto recalc - idempotent + dedupe", () => {
  test("applying same defect twice does not stack (same output)", () => {
    const base: any = { injectionSpeed_cm3_s: 100, holdingPressureBar: 800, coolingTime_s: 20 };

    const a = applyDefectAutoRecalc({ baseInput: base, defectId: "flash", severity: "medium" as any });
    const b = applyDefectAutoRecalc({ baseInput: base, defectId: "flash", severity: "medium" as any });

    expect(a.patchedInput).toEqual(b.patchedInput);
    expect(a.appliedCorrections.map((c) => c.id)).toEqual(b.appliedCorrections.map((c) => c.id));
    expect(a.audit.length).toBeGreaterThan(0);
  });

  test("severity changes magnitude but still deterministic", () => {
    const base: any = { holdingPressureBar: 800 };

    const low = applyDefectAutoRecalc({ baseInput: base, defectId: "flash", severity: "low" as any });
    const high = applyDefectAutoRecalc({ baseInput: base, defectId: "flash", severity: "high" as any });

    expect(low.patchedInput.holdingPressureBar).not.toEqual(high.patchedInput.holdingPressureBar);
  });
});
