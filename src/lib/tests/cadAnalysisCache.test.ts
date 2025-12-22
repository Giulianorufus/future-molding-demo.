import { clearCadAnalysisCache, getCadAnalysisCached, setCadAnalysisCached } from "../cadAnalysisCache";

describe("cadAnalysisCache", () => {
  beforeEach(() => clearCadAnalysisCache());

  test("set/get returns cached value", () => {
    const key = "cad:.step:abc";
    const value = { ok: true, n: 1 };

    expect(getCadAnalysisCached<typeof value>(key)).toBeUndefined();
    setCadAnalysisCached(key, value);

    const got = getCadAnalysisCached<typeof value>(key);
    expect(got).toEqual(value);
  });

  test("LRU keeps most recent entries (evicts older)", () => {
    // MAX_ENTRIES è 20: inserisco 25 e verifico che i primi spariscono
    for (let i = 0; i < 25; i++) {
      setCadAnalysisCached(`k${i}`, { i });
    }
    expect(getCadAnalysisCached<any>("k0")).toBeUndefined();
    expect(getCadAnalysisCached<any>("k1")).toBeUndefined();
    expect(getCadAnalysisCached<any>("k4")).toBeUndefined(); // almeno i primi 5 via
    expect(getCadAnalysisCached<any>("k24")).toEqual({ i: 24 });
  });
});
