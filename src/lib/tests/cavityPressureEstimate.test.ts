import { estimateCavityPressure } from "../cavityPressureEstimate";

describe("estimateCavityPressure", () => {
  it("higher pressure for thin part with high L/t", () => {
    const r = estimateCavityPressure({ materialId: 'PP', thickness_mm: 1.2, flowLength_mm: 200, volume_cm3: 10 });
    expect(r.estimatedCavityPressure_bar).toBeGreaterThan(400);
  });

  it("lower pressure for thick part with low L/t", () => {
    const r = estimateCavityPressure({ materialId: 'PP', thickness_mm: 3.5, flowLength_mm: 50, volume_cm3: 100 });
    expect(r.estimatedCavityPressure_bar).toBeLessThan(400);
  });

  it("clamps within bounds", () => {
    const high = estimateCavityPressure({ materialId: 'PC', thickness_mm: 0.2, flowLength_mm: 2000 });
    expect(high.estimatedCavityPressure_bar).toBeLessThanOrEqual(900);
    const low = estimateCavityPressure({ materialId: 'PP', thickness_mm: 10, flowLength_mm: 10 });
    expect(low.estimatedCavityPressure_bar).toBeGreaterThanOrEqual(250);
  });

  it('uses provided thickness and clamps L/t', () => {
    const r = estimateCavityPressure({ materialId: 'PP', thickness_mm: 0.1, flowLength_mm: 5000 });
    // thickness should be clamped to 0.6mm in reason
    expect(r.reason).toMatch(/thickness_mm=0\.6/)
    const m = r.reason.match(/L\/t=(\d+\.?\d*)/)
    expect(m).not.toBeNull()
    const lt = Number(m![1])
    expect(lt).toBeLessThanOrEqual(250)
  })
});
