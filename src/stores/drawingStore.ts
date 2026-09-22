import { create } from 'zustand'

export type DrawingState = {
  glbUrl: string | null
  viewerUrl: string | null
  volumeCm3: number | null
  surfaceCm2: number | null
  boundingBox: { x: number; y: number; z: number } | null
  mesh?: { positions: Float32Array | number[]; indices?: Uint32Array | number[]; bbox_mm?: { x: number; y: number; z: number } | null } | null
  previewUrl: string | null
  isLoading: boolean
  error: string | null
  // Conversion tracking for STEP/IGES → GLB
  conversionStatus?: 'idle' | 'converting' | 'ready' | 'error'
  conversionMessage?: string
  conversionId?: string | null
  setResult: (payload: Partial<Omit<DrawingState, 'setResult'>>) => void
  // compatibility helpers (legacy callers)
  setGlbUrl?: (url: string | null) => void
  setModelUrl?: (url: string | null) => void
  setViewerUrl?: (url: string | null) => void
  reset: () => void
}

export const useDrawingStore = create<DrawingState>((set) => ({
  glbUrl: null,
  viewerUrl: null,
  volumeCm3: null,
  surfaceCm2: null,
  boundingBox: null,
  previewUrl: null,
  isLoading: false,
  error: null,
  conversionStatus: 'idle',
  conversionMessage: undefined,
  conversionId: null,
  setResult(payload) {
    set((s) => ({
      ...s,
      ...payload,
      viewerUrl: payload.viewerUrl ?? payload.glbUrl ?? s.viewerUrl ?? null,
    }))
  },
  setGlbUrl: (url: string | null) => set((s) => ({ ...s, glbUrl: url, viewerUrl: url ?? s.viewerUrl })),
  setModelUrl: (url: string | null) => set((s) => ({ ...s, viewerUrl: url, glbUrl: url })),
  setViewerUrl: (url: string | null) => set((s) => ({ ...s, viewerUrl: url })),
  reset() {
    set({
      glbUrl: null,
      viewerUrl: null,
      volumeCm3: null,
      surfaceCm2: null,
      boundingBox: null,
      previewUrl: null,
      isLoading: false,
      error: null,
      conversionStatus: 'idle',
      conversionMessage: undefined,
      conversionId: null,
    })
  },
}))

export default useDrawingStore
