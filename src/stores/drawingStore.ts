import { create } from 'zustand'
import type { InjectionGate } from '@/types/injectionGate'

export type DrawingState = {
  glbUrl: string | null
  viewerUrl: string | null
  volumeCm3: number | null
  surfaceCm2: number | null
  boundingBox: { x: number; y: number; z: number } | null
  cavityCount: number
  cavityCountConfirmed: boolean
  feedSystem: 'unknown' | 'hot' | 'cold'
  runnerVolumeCm3: number | null
  runnerProjectedAreaCm2: number | null
  gatePoint: { x: number; y: number; z: number } | null
  gateNormal: { x: number; y: number; z: number } | null
  gates: InjectionGate[]
  selectedGateId: string | null
  mesh?: { positions: Float32Array | number[]; indices?: Uint32Array | number[]; bbox_mm?: { x: number; y: number; z: number } | null } | null
  previewUrl: string | null
  isLoading: boolean
  error: string | null
  // Conversion tracking for STEP/IGES → GLB
  conversionStatus?: 'idle' | 'converting' | 'ready' | 'error'
  conversionMessage?: string
  conversionId?: string | null
  setResult: (payload: Partial<Omit<DrawingState, 'setResult'>>) => void
  addGate: (gate: InjectionGate) => void
  updateGate: (id: string, patch: Partial<Omit<InjectionGate, 'id'>>) => void
  removeGate: (id: string) => void
  clearGates: () => void
  selectGate: (id: string | null) => void
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
  cavityCount: 1,
  cavityCountConfirmed: false,
  feedSystem: 'unknown',
  runnerVolumeCm3: null,
  runnerProjectedAreaCm2: null,
  gatePoint: null,
  gateNormal: null,
  gates: [],
  selectedGateId: null,
  previewUrl: null,
  isLoading: false,
  error: null,
  conversionStatus: 'idle',
  conversionMessage: undefined,
  conversionId: null,
  setResult(payload) {
    set((s) => {
      const hasGatePoint = Object.prototype.hasOwnProperty.call(payload, 'gatePoint')
      let nextGates = s.gates
      let nextSelectedGateId = s.selectedGateId
      if (hasGatePoint) {
        if (payload.gatePoint === null) {
          nextGates = []
          nextSelectedGateId = null
        } else if (payload.gatePoint) {
          const legacyId = nextSelectedGateId ?? 'G1'
          const legacyGate: InjectionGate = {
            id: legacyId,
            position: payload.gatePoint,
            normal: payload.gateNormal ?? undefined,
          }
          const existing = nextGates.findIndex((gate) => gate.id === legacyId)
          nextGates = existing >= 0
            ? nextGates.map((gate, index) => index === existing ? legacyGate : gate)
            : [...nextGates, legacyGate]
          nextSelectedGateId = legacyId
        }
      }
      const hasViewerUrl = Object.prototype.hasOwnProperty.call(payload, 'viewerUrl')
      const hasGlbUrl = Object.prototype.hasOwnProperty.call(payload, 'glbUrl')
      return {
        ...s,
        ...payload,
        gates: nextGates,
        selectedGateId: nextSelectedGateId,
        viewerUrl: hasViewerUrl
          ? (payload.viewerUrl ?? null)
          : hasGlbUrl
            ? (payload.glbUrl ?? null)
            : s.viewerUrl,
      }
    })
  },
  addGate(gate) {
    set((state) => {
      const selected = state.gates.find((item) => item.id === gate.id) ?? gate
      return {
        ...state,
        gates: state.gates.some((item) => item.id === gate.id) ? state.gates : [...state.gates, gate],
        selectedGateId: gate.id,
        gatePoint: selected.position,
        gateNormal: selected.normal ?? null,
      }
    })
  },
  updateGate(id, patch) {
    set((state) => {
      const gates = state.gates.map((gate) => gate.id === id ? { ...gate, ...patch } : gate)
      const selected = gates.find((gate) => gate.id === state.selectedGateId)
      return { ...state, gates, gatePoint: selected?.position ?? null, gateNormal: selected?.normal ?? null }
    })
  },
  removeGate(id) {
    set((state) => {
      const gates = state.gates.filter((gate) => gate.id !== id)
      const selectedGateId = state.selectedGateId === id ? (gates[0]?.id ?? null) : state.selectedGateId
      const selected = gates.find((gate) => gate.id === selectedGateId)
      return { ...state, gates, selectedGateId, gatePoint: selected?.position ?? null, gateNormal: selected?.normal ?? null }
    })
  },
  clearGates() {
    set((state) => ({ ...state, gates: [], selectedGateId: null, gatePoint: null, gateNormal: null }))
  },
  selectGate(id) {
    set((state) => {
      const selected = state.gates.find((gate) => gate.id === id)
      return { ...state, selectedGateId: selected?.id ?? null, gatePoint: selected?.position ?? null, gateNormal: selected?.normal ?? null }
    })
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
      cavityCount: 1,
      cavityCountConfirmed: false,
      feedSystem: 'unknown',
      runnerVolumeCm3: null,
      runnerProjectedAreaCm2: null,
      gatePoint: null,
      gateNormal: null,
      gates: [],
      selectedGateId: null,
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
