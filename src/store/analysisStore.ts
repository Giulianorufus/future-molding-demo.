// src/store/analysisStore.ts
// Alias per mantenere compatibilità, ma usiamo UN SOLO store globale.

import { useModelStore } from "./modelStore";

export const useAnalysisStore = useModelStore;
export type AnalysisStore = ReturnType<typeof useModelStore>;