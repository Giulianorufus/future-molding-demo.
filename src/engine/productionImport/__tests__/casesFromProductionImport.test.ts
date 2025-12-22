import { casesFromProductionImport } from "../casesFromProductionImport";

test("casesFromProductionImport builds cases only for rows with fingerprint/id", () => {
  const rows: any[] = [
    { recipeFingerprint: "fp-1", producedQty: 10, scrapQty: 0, defect: "flash" },
    { recipeId: "id-2", producedQty: 9, scrapQty: 1 },
    { producedQty: 1 }, // scartata
  ];

  const cases = casesFromProductionImport({ rows, createdAt: "2025-12-22T00:00:00.000Z" });
  expect(cases).toHaveLength(2);
  expect(cases[0].recipeFingerprint).toBe("fp-1");
  expect(cases[1].recipeFingerprint).toBe("id-2");
});
