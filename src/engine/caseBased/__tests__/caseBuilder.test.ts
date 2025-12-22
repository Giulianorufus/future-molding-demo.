import { buildCaseFromProductionRow } from "../buildCaseFromProductionRow";

const snap: any = { projectName: "P", input: {}, output: {} };

test("buildCaseFromProductionRow maps fields and computes scrapRate_pct", () => {
  const row: any = {
    recipeFingerprint: "fp-123",
    materialId: "ABS",
    pressId: "arburg-100t",
    producedQty: 90,
    scrapQty: 10,
    defect: "short_shot",
    defects: ["flash", " flash "],
    cycleTime_s: 22.5,
    notes: "ok-ish",
  };

  const c = buildCaseFromProductionRow({
    row,
    snapshot: snap,
    createdAt: "2025-12-22T00:00:00.000Z",
    idSeed: "t",
  });

  expect(c.id).toBe("t:fp-123:2025-12-22T00:00:00.000Z");
  expect(c.recipeFingerprint).toBe("fp-123");
  expect(c.materialId).toBe("ABS");
  expect(c.pressId).toBe("arburg-100t");

  expect(c.outcome?.scrapRate_pct).toBeCloseTo(10, 6);
  expect(c.outcome?.defects?.sort()).toEqual(["flash", "short_shot"].sort());
  expect(c.outcome?.cycleTime_s).toBe(22.5);
});
