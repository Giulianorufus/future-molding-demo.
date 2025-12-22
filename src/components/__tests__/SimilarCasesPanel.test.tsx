import { useCaseStore } from '../../stores/caseStore';
import { buildRecipeSnapshot } from '../../engine/recipeExport/buildRecipeSnapshot';
import { buildCaseQueryFromSnapshot } from '../../engine/caseBased';

describe('SimilarCasesPanel', () => {
  test('renders seeded similar cases (DEV seed)', () => {
    // seed store
    const now = new Date().toISOString();
    const { bulkAddCases, clearCases } = useCaseStore.getState();
    clearCases();
    bulkAddCases([
      {
        id: 'testcase-aaa',
        createdAt: now,
        recipeFingerprint: 'fp-a',
        materialId: 'MAT_A',
        pressId: 'PRESS_A',
        screwDiameter_mm: 20,
        geometryHash: undefined,
        projectedArea_cm2: undefined,
        shotVolume_cm3: undefined,
        recipeSnapshot: buildRecipeSnapshot({ projectName: 'p', input: {}, output: {} }),
        outcome: { producedQty: 100, scrapQty: 1, scrapRate_pct: 1 },
      },
      {
        id: 'testcase-bbb',
        createdAt: now,
        recipeFingerprint: 'fp-b',
        materialId: 'MAT_A',
        pressId: 'PRESS_A',
        screwDiameter_mm: 20,
        geometryHash: undefined,
        projectedArea_cm2: undefined,
        shotVolume_cm3: undefined,
        recipeSnapshot: buildRecipeSnapshot({ projectName: 'p2', input: {}, output: {} }),
        outcome: { producedQty: 200, scrapQty: 2, scrapRate_pct: 1 },
      },
    ]);

    const snapshot = buildRecipeSnapshot({ projectName: 'q', input: {}, output: {} });
    const query = buildCaseQueryFromSnapshot(snapshot);
    const results = useCaseStore.getState().findSimilar(query, 5);
    expect(results.length).toBeGreaterThanOrEqual(2);
  });
});
