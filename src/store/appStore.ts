import { create } from 'zustand';
import { Brand, IMaterial } from '@/fm-core';

export interface ICalculationResult {
  success: boolean;
  weight: number;
  cycleTime: number;
  errors?: string[];
  injectionSpeed_cm3s?: number;
  injectionPressure_bar?: number;
  vp_cm3?: number;
  pack_bar?: number;
  pack_s?: number;
  cooling_s?: number;
  rpm?: number;
  backpressure_bar?: number;
  requiredTonnage_t?: number;
  pressAdequate?: boolean;
}

export type AnnotatedDefect = {
  id: string;
  type: string;    // uno dei 10 elencati
  x: number;       // 0..1 coord normalizzata canvas
  y: number;       // 0..1 coord normalizzata canvas
  note?: string;
};

interface AppState {
  marca: Brand | '';
  modello: string;
  selectedMaterial: IMaterial | null;
  injectionParams: {
    spessore: number;
    volumeCavita: number;
    volumeMaterozza: number;
    cushion: number;
  };
  screwDiameter: number | null;
  calculationResult: ICalculationResult | null;
  defects: AnnotatedDefect[];
  defectAdjustedParams: any | null;
  
  // Actions
  setMarca: (marca: Brand | '') => void;
  setModello: (modello: string) => void;
  setSelectedMaterial: (material: IMaterial | null) => void;
  updateParams: (params: Partial<AppState['injectionParams']>) => void;
  setCalculationResult: (result: ICalculationResult | null) => void;
  setDefectAdjustedParams: (params: any | null) => void;
  addDefect: (d: AnnotatedDefect) => void;
  removeDefect: (id: string) => void;
  clearDefects: () => void;
  setScrewDiameter: (d: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
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
  defectAdjustedParams: null,
  screwDiameter: null,
  
  setMarca: (marca) => set({ marca }),
  setModello: (modello) => set({ modello }),
  setSelectedMaterial: (material) => set({ selectedMaterial: material }),
  updateParams: (params) => set((state) => ({
    injectionParams: { ...state.injectionParams, ...params }
  })),
  setCalculationResult: (result) => set({ calculationResult: result }),
  setDefectAdjustedParams: (params) => set({ defectAdjustedParams: params }),
  setScrewDiameter: (d) => set({ screwDiameter: d }),
  addDefect: (d) => set((state) => ({ 
    defects: [...state.defects, { ...d, id: Math.random().toString(36).slice(2, 9) }] 
  })),
  removeDefect: (id) => set((state) => ({ 
    defects: state.defects.filter(x => x.id !== id) 
  })),
  clearDefects: () => set({ defects: [] }),
}));
