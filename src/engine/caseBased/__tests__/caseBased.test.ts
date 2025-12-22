import type { CaseRecord, CaseQuery } from "../caseTypes";
import { findSimilarCases } from "../recommend";

// snapshot minimo: il tipo RecipeSnapshot esiste già, qui basta un oggetto coerente “any-safe” per test
const snap: any = { projectName: "P", input: {}, output: {} };

function mkCase(partial: Partial<CaseRecord> & { id: string; createdAt: string }): CaseRecord {
  return {
    id: partial.id,
    createdAt: partial.createdAt,
    recipeSnapshot: partial.recipeSnapshot ?? snap,
    recipeFingerprint: partial.recipeFingerprint,
    materialId: partial.materialId,
    pressId: partial.pressId,
    screwDiameter_mm: partial.screwDiameter_mm,
    geometryHash: partial.geometryHash,
    projectedArea_cm2: partial.projectedArea_cm2,
    shotVolume_cm3: partial.shotVolume_cm3,
    outcome: partial.outcome,
  };
}

test("findSimilarCases ranks by strongest matches and is deterministic", () => {
  const cases: CaseRecord[] = [
    mkCase({
      id: "A",
      createdAt: "2025-12-20T10:00:00.000Z",
      materialId: "ABS",
      pressId: "arburg-100t",
      screwDiameter_mm: 30,
      recipeFingerprint: "fp-1",
      geometryHash: "geo-1",
      shotVolume_cm3: 50,
      projectedArea_cm2: 40,
    }),
    mkCase({
      id: "B",
      createdAt: "2025-12-21T10:00:00.000Z",
      materialId: "ABS",
      pressId: "arburg-100t",
      screwDiameter_mm: 30,
      recipeFingerprint: "fp-1",
      geometryHash: "geo-1",
      shotVolume_cm3: 52,
      projectedArea_cm2: 41,
    }),
    mkCase({
      id: "C",
      createdAt: "2025-12-22T10:00:00.000Z",
      materialId: "PP",
      pressId: "arburg-100t",
      screwDiameter_mm: 30,
      recipeFingerprint: "fp-1",
      geometryHash: "geo-1",
      shotVolume_cm3: 50,
      projectedArea_cm2: 40,
    }),
    mkCase({
      id: "D",
      createdAt: "2025-12-19T10:00:00.000Z",
      materialId: "ABS",
      pressId: "arburg-80t",
      screwDiameter_mm: 25,
      recipeFingerprint: "fp-2",
      geometryHash: "geo-2",
      shotVolume_cm3: 200,
      projectedArea_cm2: 120,
    }),
  ];

  const query: CaseQuery = {
    materialId: "ABS",
    pressId: "arburg-100t",
    screwDiameter_mm: 30,
    recipeFingerprint: "fp-1",
    geometryHash: "geo-1",
    shotVolume_cm3: 50,
    projectedArea_cm2: 40,
  };

  const top = findSimilarCases(query, cases, 3);

  // B dovrebbe battere A per createdAt più recente a parità quasi totale (score molto vicino/uguale)
  expect(top[0].caseId).toBe("B");
  expect(top[1].caseId).toBe("A");

  // C ha materiale diverso, quindi deve stare dietro
  expect(top[2].caseId).toBe("C");

  // determinismo: stessa chiamata, stesso ordine
  const top2 = findSimilarCases(query, cases, 3);
  expect(top2.map((x) => x.caseId)).toEqual(top.map((x) => x.caseId));
});
