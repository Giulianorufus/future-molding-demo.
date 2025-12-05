// Compatibility shim: forward to canonical parametri store under src/stores
import { useParametriStore as useParametriStoreCanonical } from "@/stores/parametriStore";

export const useParametriStore = useParametriStoreCanonical;
export type ParametriState = import("@/stores/parametriStore").ParametriState;

export default useParametriStore;
