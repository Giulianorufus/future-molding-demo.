import { create } from "zustand";
import type { CaseQuery, CaseRecord, SimilarityResult } from "../engine/caseBased";
import { findSimilarCases } from "../engine/caseBased";

type CaseState = {
  cases: CaseRecord[];
  addCase: (c: CaseRecord) => void;
  bulkAddCases: (items: CaseRecord[]) => void;
  clearCases: () => void;
  findSimilar: (query: CaseQuery, topK?: number) => SimilarityResult[];
  exportCases: () => string;
  importCases: (json: string, opts?: { merge?: boolean }) => void;
};

const STORAGE_KEY = "fm_cases_v1";
const STORAGE_LIMIT = 200;

function loadFromStorage(): CaseRecord[] {
  try {
    const g: any = globalThis as any;
    if (typeof g === "undefined" || !g.localStorage) return [];
    const raw = g.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as CaseRecord[];
    if (parsed && Array.isArray(parsed.cases)) return parsed.cases as CaseRecord[];
    return [];
  } catch (_e) {
    return [];
  }
}

function saveToStorage(cases: CaseRecord[]) {
  try {
    const g: any = globalThis as any;
    if (typeof g === "undefined" || !g.localStorage) return;
    const toSave = cases.slice(0, STORAGE_LIMIT);
    g.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (_e) {
    // best-effort
  }
}

export const useCaseStore = create<CaseState>((set, get) => ({
  cases: loadFromStorage(),
  addCase: (c) =>
    set((s) => {
      const next = [c, ...s.cases].slice(0, STORAGE_LIMIT);
      saveToStorage(next);
      return { cases: next };
    }),
  bulkAddCases: (items) =>
    set((s) => {
      const next = [...items, ...s.cases].slice(0, STORAGE_LIMIT);
      saveToStorage(next);
      return { cases: next };
    }),
  clearCases: () => {
    saveToStorage([]);
    set({ cases: [] });
  },
  findSimilar: (query, topK = 5) => findSimilarCases(query, get().cases, topK),
  exportCases: () => {
    const payload = { version: 1, exportedAt: new Date().toISOString(), cases: get().cases };
    return JSON.stringify(payload, null, 2);
  },
  importCases: (json, opts) => {
    try {
      const parsed = JSON.parse(json);
      const items: CaseRecord[] = Array.isArray(parsed) ? parsed : parsed?.cases ?? [];
      if (!Array.isArray(items)) return;
      const merge = opts?.merge ?? true;
      if (merge) {
        // prepend imported items (assume newest first)
        set((s) => {
          const next = [...items, ...s.cases].slice(0, STORAGE_LIMIT);
          saveToStorage(next);
          return { cases: next };
        });
      } else {
        const next = items.slice(0, STORAGE_LIMIT);
        saveToStorage(next);
        set({ cases: next });
      }
    } catch (_e) {
      // ignore invalid json
    }
  },
}));
