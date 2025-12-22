import { useCaseStore } from '../../stores/caseStore';

// Provide a lightweight mock of localStorage so tests run in Node environment
function createMockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  } as unknown as Storage;
}

describe('caseStore persistence', () => {
  beforeAll(() => {
    const g: any = globalThis as any;
    if (!g.localStorage) {
      const mock = createMockLocalStorage();
      // provide both globalThis.localStorage and globalThis.window.localStorage
      g.localStorage = mock;
      g.window = g.window || {};
      g.window.localStorage = mock;
    }
  });

  beforeEach(() => {
    (globalThis as any).localStorage.clear();
    const { clearCases } = useCaseStore.getState();
    clearCases();
  });

  test('bulkAddCases saves to localStorage and can be read back', () => {
    const now = new Date().toISOString();
    const cases = [
      { id: 'c-1', createdAt: now, recipeFingerprint: 'fp1', materialId: 'M1', pressId: 'P1', screwDiameter_mm: 20, geometryHash: undefined, projectedArea_cm2: undefined, shotVolume_cm3: undefined, recipeSnapshot: {}, outcome: { producedQty: 1, scrapQty: 0, scrapRate_pct: 0 } },
    ];

    useCaseStore.getState().bulkAddCases(cases as any);

    const raw = (globalThis as any).localStorage.getItem('fm_cases_v1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].id).toBe('c-1');
  });
});
