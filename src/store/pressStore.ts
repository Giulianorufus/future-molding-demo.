// Compatibility shim: forward to canonical press store under src/stores
import { usePressStore as usePressStoreCanonical } from "@/stores/pressStore";

export const usePressStore = usePressStoreCanonical;
export type PressState = import("@/stores/pressStore").PressState;

export default usePressStore;
