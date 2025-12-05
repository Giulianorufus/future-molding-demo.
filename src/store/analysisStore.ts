// src/store/analysisStore.ts
// Compatibility shim: re-export the canonical `parametriStore` from `src/stores`.
// This file exists only to avoid breaking legacy imports of `@/store/analysisStore`.
// No logic or state should live here — the single source of truth is in `src/stores`.

import { useParametriStore as useParametriStoreCanonical } from "@/stores/parametriStore";

export const useAnalysisStore = useParametriStoreCanonical;
export type AnalysisStore = ReturnType<typeof useParametriStoreCanonical>;