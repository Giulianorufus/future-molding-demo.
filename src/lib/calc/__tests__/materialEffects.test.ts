import { materialEffects } from "@/lib/calc/materialEffects";
import { materialCatalog } from "@/data/materialCatalog";

const byId = (id: string) => materialCatalog.find((m) => m.id === id) ?? null;

test("PC: drying + idrolisi warnings", () => {
  const fx = materialEffects(byId("pc"));
  expect(fx.warnings.join(" ")).toMatch(/essiccaz/i);
  expect(fx.warnings.join(" ")).toMatch(/idrolisi/i);
  expect(fx.assumptions.join(" ")).toMatch(/assume/i);
});

test("PA66 GF60: abrasion warnings + higher pressure multiplier", () => {
  const fx = materialEffects(byId("pa66-gf60"));
  expect(fx.warnings.join(" ")).toMatch(/abrasion|abrasione/i);
  expect(fx.multipliers.pressure).toBeGreaterThan(0);
  expect(typeof fx.multipliers.pressure).toBe("number");
});

test("PP: no drying warning", () => {
  const fx = materialEffects(byId("pp"));
  expect(fx.warnings.join(" ")).not.toMatch(/essiccaz/i);
});
