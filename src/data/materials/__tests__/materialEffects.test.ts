import materialCatalog from "../materialCatalog";
import { computeMaterialEffects } from "../materialEffects";

describe("materialEffects deterministic", () => {
  test("same input -> same output multipliers and stable lists", () => {
    for (const m of materialCatalog) {
      const a = computeMaterialEffects(m);
      const b = computeMaterialEffects(m);
      expect(a.multipliers).toEqual(b.multipliers);
      expect(a.assumptions).toEqual(b.assumptions);
      expect(a.warnings).toEqual(b.warnings);
    }
  });
});
