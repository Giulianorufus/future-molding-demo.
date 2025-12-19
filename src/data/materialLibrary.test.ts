// src/data/materialLibrary.test.ts
import { materialLibrary, normalizeMaterialId, resolveMaterialOrFallback } from "./materialLibrary";

describe("materialLibrary", () => {
  it("has deterministic ids and version", () => {
    expect(materialLibrary.version).toBe("materials-v1");
    expect(materialLibrary.ids()).toEqual([
      "PP",
      "ABS",
      "PC",
      "PA6",
      "PA66",
      "PA6-GF30",
      "PA6-GF60",
      "PA66-GF30",
      "PA66-GF60",
    ]);
  });

  it("normalizes common ids", () => {
    expect(normalizeMaterialId("pa66gf30")).toBe("PA66-GF30");
    expect(normalizeMaterialId("PA6_GF60")).toBe("PA6-GF60");
    expect(normalizeMaterialId(" PC ")).toBe("PC");
  });

  it("resolves known material", () => {
    const { material, assumptions } = resolveMaterialOrFallback("PC");
    expect(material.id).toBe("PC");
    expect(assumptions).toEqual([]);
    expect(material.factors.pressure).toBeCloseTo(1.2, 5);
  });

  it("falls back deterministically to ABS with assumption", () => {
    const { material, assumptions } = resolveMaterialOrFallback("UNKNOWN_MAT");
    expect(material.id).toBe("ABS");
    expect(assumptions.join(" ")).toContain("fallback ABS");
  });
});
