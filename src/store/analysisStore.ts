// src/store/analysisStore.ts
// Alias per mantenere compatibilità, ma usiamo UN SOLO store globale.

import { useParametriStore } from "./parametriStore";

// AnalysisStore is now an alias to parametriStore for compatibility
export const useAnalysisStore = useParametriStore;
export type AnalysisStore = ReturnType<typeof useParametriStore>;