import { create } from "zustand";
import type { CadAnalysisResult } from "@/cad/types";
import type { CalcOutput } from "@/core/calcTypes";
import type { DefectId } from "@/core/defects";

type ModelState = {
  file: File | null;
  viewerUrl: string | null;
  analysis: CadAnalysisResult | null;
  calculated: CalcOutput | null;
  selectedMachineId: string | null;
  selectedMaterialId: string | null;
  selectedDefectId: DefectId | null;

  setFile: (file: File | null) => void;
  setViewerUrl: (url: string | null) => void;
  setAnalysis: (analysis: CadAnalysisResult | null) => void;
  setCalculated: (calc: CalcOutput | null) => void;
  setMachine: (id: string | null) => void;
  setMaterial: (id: string | null) => void;
  setDefect: (id: DefectId | null) => void;
  reset: () => void;
};

export const useModelStore = create<ModelState>((set, get) => ({
  file: null,
  viewerUrl: null,
  analysis: null,
  calculated: null,
  selectedMachineId: null,
  selectedMaterialId: null,
  selectedDefectId: null,

  setFile: (file) => set({ file, calculated: null }),
  setViewerUrl: (viewerUrl) => {
    try {
      const prev = get().viewerUrl;
      if (prev && prev !== viewerUrl) {
        try { URL.revokeObjectURL(prev); } catch (_) {}
      }
    } catch (_) {}
    set({ viewerUrl });
  },
  setAnalysis: (analysis) => set({ analysis }),
  setCalculated: (calculated) => set({ calculated }),
  setMachine: (selectedMachineId) => set({ selectedMachineId }),
  setMaterial: (selectedMaterialId) => set({ selectedMaterialId }),
  setDefect: (selectedDefectId) => set({ selectedDefectId }),

  reset: () =>
    set({
      file: null,
      viewerUrl: null,
      analysis: null,
      calculated: null,
      selectedMachineId: null,
      selectedMaterialId: null,
      selectedDefectId: null,
    }),
}));
