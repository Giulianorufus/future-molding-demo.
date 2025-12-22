import { buildCaseQueryFromSnapshot } from "../buildCaseQueryFromSnapshot";

test("buildCaseQueryFromSnapshot uses press/material fields and best-effort output fields", () => {
  const snap: any = {
    meta: {},
    press: { id: "arburg-100t", screwDiameter_mm: 30 },
    material: { id: "ABS" },
    output: { shotVolume_cm3: 50, projectedArea_cm2: 40, geometryHash: "geo-1" },
  };

  const q = buildCaseQueryFromSnapshot(snap);
  expect(q.pressId).toBe("arburg-100t");
  expect(q.materialId).toBe("ABS");
  expect(q.screwDiameter_mm).toBe(30);
  expect(q.shotVolume_cm3).toBe(50);
  expect(q.projectedArea_cm2).toBe(40);
  expect(q.geometryHash).toBe("geo-1");
});
