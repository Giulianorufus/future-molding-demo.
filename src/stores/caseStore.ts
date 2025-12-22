import { create } from "zustand";
import type { CaseQuery, CaseRecord, SimilarityResult } from "../engine/caseBased";
import { findSimilarCases } from "../engine/caseBased";

type CaseState = {
  cases: CaseRecord[];
  addCase: (c: CaseRecord) => void;
  bulkAddCases: (items: CaseRecord[]) => void;
  clearCases: () => void;
  findSimilar: (query: CaseQuery, topK?: number) => SimilarityResult[];
};

export const useCaseStore = create<CaseState>((set, get) => ({
  cases: [],
  addCase: (c) => set((s) => ({ cases: [c, ...s.cases] })),
  bulkAddCases: (items) => set((s) => ({ cases: [...items, ...s.cases] })),
  clearCases: () => set({ cases: [] }),
  findSimilar: (query, topK = 5) => findSimilarCases(query, get().cases, topK),
}));
