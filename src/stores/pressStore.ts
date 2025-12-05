import { create } from 'zustand'

export type PressSpec = {
  id: string
  name: string
  tonnellaggio: number
  screwDiameters: number[]
  shotVolumeCm3: number
  maxPressureBar: number
  maxSpeedMmPerS: number
}

export type PressState = {
  selectedPressId: string | null
  catalog: Record<string, PressSpec>
  setCatalog: (catalog: Record<string, PressSpec>) => void
  selectPress: (id: string | null) => void
}

export const usePressStore = create<PressState>((set) => ({
  selectedPressId: null,
  catalog: {},
  setCatalog(catalog) {
    set({ catalog })
  },
  selectPress(id) {
    set({ selectedPressId: id })
  },
}))

export default usePressStore
