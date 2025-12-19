import { pressCatalog } from "./index";

test("press catalog contains Arburg 50–200t set", () => {
  const ids = new Set(pressCatalog.map(p => p.id));
  expect(ids.has("arburg-50t")).toBe(true);
  expect(ids.has("arburg-80t")).toBe(true);
  expect(ids.has("arburg-100t")).toBe(true);
  expect(ids.has("arburg-150t")).toBe(true);
  expect(ids.has("arburg-200t")).toBe(true);
});

test("each press has screws 20/25/30/35/40", () => {
  const screws = [20, 25, 30, 35, 40];
  for (const p of pressCatalog) {
    const present = new Set(p.units.map(u => u.screwDiameter_mm));
    for (const s of screws) expect(present.has(s as any)).toBe(true);
  }
});
