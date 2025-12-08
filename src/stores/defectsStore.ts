import { create } from 'zustand'

export type DefectId = 'SHORT_SHOT' | 'BAVE' | 'RITIRO' | 'DEFORMAZIONE' | string

export interface DefectsState {
  selectedDefectId: DefectId | null
  setSelectedDefect: (id: DefectId | null) => void
}

export const useDefectsStore = create<DefectsState>((set) => ({
  selectedDefectId: null,
  setSelectedDefect(id) {
    set({ selectedDefectId: id })
  },
}))

export default useDefectsStore
