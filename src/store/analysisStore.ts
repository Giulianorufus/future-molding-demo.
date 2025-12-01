import { create } from "zustand";

export type GeoAnalysis = {
  volume_cm3: number | null;
  area_cm2: number | null;
  bbox_mm: { x: number; y: number; z: number } | null;
  thickness_mm: { min: number; mean: number; max: number } | null;
  components: number | null; // proxy #cavità se il file le contiene
  updatedAt: number | null;
  note?: string;
};

type St = {
  data: GeoAnalysis;
  set: (d: Partial<GeoAnalysis>) => void;
  clear: () => void;
};

export const useAnalysisStore = create<St>((set) => ({
  data: {
    volume_cm3: null,
    area_cm2: null,
    bbox_mm: null,
    thickness_mm: null,
    components: null,
    updatedAt: null,
    note: undefined,
  },
  set: (d) => set((s) => ({ data: { ...s.data, ...d, updatedAt: Date.now() } })),
  clear: () =>
    set({
      data: {
        volume_cm3: null,
        area_cm2: null,
        bbox_mm: null,
        thickness_mm: null,
        components: null,
        updatedAt: null,
        note: undefined,
      },
    }),
}));