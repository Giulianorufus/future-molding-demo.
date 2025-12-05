import { create } from 'zustand'
import arburg from '@/data/pressCatalog/arburg.json'
import engel from '@/data/pressCatalog/engel.json'
import toyo from '@/data/pressCatalog/toyo.json'
import bmb from '@/data/pressCatalog/bmb.json'

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
  selectedScrewDiameter_mm: number | null
  catalog: Record<string, PressSpec>
  setCatalog: (catalog: Record<string, PressSpec>) => void
  selectPress: (id: string | null) => void
  selectScrewDiameter: (d: number | null) => void
}

const initialCatalog: Record<string, PressSpec> = {
  [arburg.id]: arburg as PressSpec,
  [engel.id]: engel as PressSpec,
  [toyo.id]: toyo as PressSpec,
  [bmb.id]: bmb as PressSpec,
}

export const usePressStore = create<PressState>((set) => ({
  selectedPressId: null,
  selectedScrewDiameter_mm: null,
  catalog: initialCatalog,
  setCatalog(catalog) {
    set({ catalog })
  },
  selectPress(id) {
    // when selecting a press, default screw diameter to the first available option
    const spec = id ? (initialCatalog[id] ?? null) : null
    const defaultDiam = spec?.screwDiameters?.[0] ?? null
    set({ selectedPressId: id, selectedScrewDiameter_mm: defaultDiam })
  },
  selectScrewDiameter(d: number | null) {
    set({ selectedScrewDiameter_mm: d })
  },
}))

export default usePressStore
