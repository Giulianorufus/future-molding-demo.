import { create } from "zustand";
export const useAnalysisStore = create((set) => ({
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
    clear: () => set({
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
