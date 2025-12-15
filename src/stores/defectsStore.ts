import { create } from 'zustand'

export type DefectSeverity = "low" | "medium" | "high"

type DefectsState = {
  selectedDefectId: string | null
  selectedSeverity: DefectSeverity
  setSelectedDefectId: (id: string | null) => void
  // backward-compat alias used by some UI/components
  setSelectedDefect?: (id: string | null) => void
  setSelectedSeverity: (s: DefectSeverity) => void
  reset: () => void
}

export const useDefectsStore = create<DefectsState>((set) => ({
  selectedDefectId: null,
  selectedSeverity: 'medium',
  setSelectedDefectId: (id) => set({ selectedDefectId: id }),
  setSelectedDefect: (id) => set({ selectedDefectId: id }),
  setSelectedSeverity: (s) => set({ selectedSeverity: s }),
  reset: () => set({ selectedDefectId: null, selectedSeverity: 'medium' }),
}))

export default useDefectsStore
