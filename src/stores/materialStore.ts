import { create } from 'zustand'

export type MaterialSpec = {
  id: string
  name: string
  densityGPerCm3: number
  meltIndex: number | null
  recommendedTemperatureC: number | null
}

export type MaterialState = {
  selectedMaterialId: string | null
  catalog: Record<string, MaterialSpec>
  setCatalog: (catalog: Record<string, MaterialSpec>) => void
  selectMaterial: (id: string | null) => void
}

export const useMaterialStore = create<MaterialState>((set) => ({
  selectedMaterialId: null,
  catalog: {},
  setCatalog(catalog) {
    set({ catalog })
  },
  selectMaterial(id) {
    set({ selectedMaterialId: id })
  },
}))

export default useMaterialStore
