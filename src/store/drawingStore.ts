// Compatibility shim: re-export the canonical drawing store
// The single source of truth is `src/stores/drawingStore.ts`.
// This file only forwards the canonical hook to avoid breaking legacy imports.

import { useDrawingStore as useDrawingStoreCanonical } from "@/stores/drawingStore";

export const useDrawingStore = useDrawingStoreCanonical;
export type DrawingState = import("@/stores/drawingStore").DrawingState;

export default useDrawingStore;
