import { create } from "zustand";
import { getBrands, getModels, getPressSpecs } from "@/lib/pressData";

interface PressState {
  brands: string[];
  models: Record<string, string[]>;
  specs: Record<string, Record<string, any>>;
  preload: () => void;
}

export const usePressStore = create<PressState>((set) => ({
  brands: [],
  models: {},
  specs: {},
  preload: () => {
    const brands = getBrands();
    const models: Record<string, string[]> = {};
    const specs: Record<string, Record<string, any>> = {};
    brands.forEach((b) => {
      models[b] = getModels(b);
      specs[b] = {};
      models[b].forEach((m) => {
        specs[b][m] = getPressSpecs(b, m);
      });
    });
    set({ brands, models, specs });
  },
}));

// Precarica i dati all'avvio
usePressStore.getState().preload();
