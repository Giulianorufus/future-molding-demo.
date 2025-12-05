import { create } from 'zustand'

export type DrawingState = {
  glbUrl: string | null
  volumeCm3: number | null
  surfaceCm2: number | null
  boundingBox: { x: number; y: number; z: number } | null
  previewUrl: string | null
  isLoading: boolean
  error: string | null
  setResult: (payload: Partial<Omit<DrawingState, 'setResult'>>) => void
  // compatibility helpers (legacy callers)
  setGlbUrl?: (url: string | null) => void
  setModelUrl?: (url: string | null) => void
  reset: () => void
}

export const useDrawingStore = create<DrawingState>((set) => ({
  glbUrl: null,
  volumeCm3: null,
  surfaceCm2: null,
  boundingBox: null,
  previewUrl: null,
  isLoading: false,
  error: null,
  setResult(payload) {
    set((s) => ({ ...s, ...payload }))
  },
  setGlbUrl: (url: string | null) => set((s) => ({ ...s, glbUrl: url })),
  setModelUrl: (url: string | null) => set((s) => ({ ...s, previewUrl: url, glbUrl: url })),
  reset() {
    set({
      glbUrl: null,
      volumeCm3: null,
      surfaceCm2: null,
      boundingBox: null,
      previewUrl: null,
      isLoading: false,
      error: null,
    })
  },
}))

export default useDrawingStore
