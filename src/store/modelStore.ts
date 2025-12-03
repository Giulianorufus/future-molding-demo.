// Deprecated modelStore shim — re-export parametriStore as the single source of truth.
// Kept for compatibility during migration; prefer `useParametriStore` directly.
import { useParametriStore } from "./parametriStore";

export const useModelStore = useParametriStore;
export type ModelState = ReturnType<typeof useParametriStore>;
