import { create } from 'zustand';
export const useAppStore = create((set) => ({
    marca: "",
    modello: "",
    selectedMaterial: null,
    injectionParams: {
        spessore: 0,
        volumeCavita: 0,
        volumeMaterozza: 0,
        cushion: 0,
    },
    calculationResult: null,
    defects: [],
    setMarca: (marca) => set({ marca }),
    setModello: (modello) => set({ modello }),
    setSelectedMaterial: (material) => set({ selectedMaterial: material }),
    updateParams: (params) => set((state) => ({
        injectionParams: { ...state.injectionParams, ...params }
    })),
    setCalculationResult: (result) => set({ calculationResult: result }),
    addDefect: (d) => set((state) => ({
        defects: [...state.defects, { ...d, id: Math.random().toString(36).slice(2, 9) }]
    })),
    removeDefect: (id) => set((state) => ({
        defects: state.defects.filter(x => x.id !== id)
    })),
    clearDefects: () => set({ defects: [] }),
}));
