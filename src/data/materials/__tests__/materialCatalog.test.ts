import materialCatalog from "../materialCatalog";

describe("materialCatalog basic checks", () => {
  test("ids are unique", () => {
    const ids = materialCatalog.map(m => m.id);
    const uniq = new Set(ids);
    expect(uniq.size).toBe(ids.length);
  });

  test("ranges sane and GF percent when reinforced", () => {
    for (const m of materialCatalog) {
      expect(m.temps.meltMinC).toBeLessThan(m.temps.meltMaxC);
      expect(m.shrinkMin_pct).toBeLessThanOrEqual(m.shrinkMax_pct);
      if (m.reinforcement === "GF") expect([30, 60]).toContain(m.gfPercent);
    }
  });
});
