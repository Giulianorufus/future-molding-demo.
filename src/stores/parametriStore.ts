import { create } from 'zustand'
import { calcolaParametri } from '../core/calcEngine'
import type { CalculationResult, CalculationInput } from '../core/calcEngine'
import { getMachineInputFromArburg } from '@/data/arburgPressCatalog'
import { getMaterialInput } from '@/data/materialCatalog'
import { useDrawingStore } from './drawingStore'
import { usePressStore } from './pressStore'
import { useMaterialStore } from './materialStore'

type GeometryState = {
  volumeCm3: number | null
  thicknessAvgMm: number | null
  bbox: { x: number; y: number; z: number } | null
}

type PressSelection = {
  pressaId: string
  screwDiameter_mm: number | null
}

export interface ParametriState {
  geometry: GeometryState | null
  viewerUrl: string | null

  press: PressSelection | null
  materialId: string | null

  // legacy compatibility (used across the codebase)
  pressaId: string | null
  screwDiameter_mm: number | null
  materialeId: string | null

  calculated: CalculationResult | null
  loading: boolean
  error: string | null
  // compatibility aliases used by some components
  result?: CalculationResult | null
  isCalculating?: boolean
  // defect helpers used by Difetti pages (legacy)
  defect: string | null
  setDefect: (d: string | null) => void
  applyDefectFix: () => void

  // setters di base
  setGeometry: (geom: GeometryState | null) => void
  setViewerUrl: (url: string | null) => void
  setPress: (press: PressSelection | null) => void
  setMaterial: (materialId: string | null) => void
  // legacy setters
  setPressaId: (pressaId: string | null) => void
  setScrewDiameter: (diameter: number | null) => void
  setMaterialeId: (materialeId: string | null) => void
  reset: () => void

  // calcolo principale
  calculate: () => CalculationResult | null
  // compatibility: async calculation entrypoint
  ricalcola?: (input: CalculationInput) => Promise<CalculationResult | null>
}

export const useParametriStore = create<ParametriState>((set, get) => {
  const store: ParametriState = {
    geometry: null,
    viewerUrl: null,

    press: null,
    materialId: null,

    // legacy fields mirrored for compatibility
    pressaId: null,
    screwDiameter_mm: null,
    materialeId: null,

    calculated: null,
    loading: false,
    error: null,
    result: null,
    isCalculating: false,
    defect: null,

    setGeometry: (geom) =>
      set((state) => ({
        ...state,
        geometry: geom,
        // se cambio geometria, il calcolo precedente non è più valido
        calculated: null,
        error: null,
      })),

    setViewerUrl: (url) =>
      set((state) => ({
        ...state,
        viewerUrl: url,
      })),

    setPress: (press) =>
      set((state) => ({
        ...state,
        press,
        // keep legacy fields in sync
        pressaId: press?.pressaId ?? null,
        screwDiameter_mm: press?.screwDiameter_mm ?? null,
        // cambio pressa → invalido calcolo precedente
        calculated: null,
        error: null,
      })),

    setMaterial: (materialId) =>
      set((state) => ({
        ...state,
        materialId,
        materialeId: materialId ?? null,
        // cambio materiale → invalido calcolo precedente
        calculated: null,
        error: null,
      })),

    // legacy setters: update both the structured `press` and the legacy fields
    setPressaId: (pressaId) =>
      set((state) => {
        const press = pressaId ? { pressaId, screwDiameter_mm: state.screwDiameter_mm ?? null } : null
        return {
          ...state,
          press,
          pressaId: pressaId ?? null,
          calculated: null,
          error: null,
        }
      }),

    setScrewDiameter: (diameter) =>
      set((state) => {
        const press = state.press ? { ...state.press, screwDiameter_mm: diameter } : (state.pressaId ? { pressaId: state.pressaId, screwDiameter_mm: diameter } : null)
        return {
          ...state,
          press,
          screwDiameter_mm: diameter ?? null,
          calculated: null,
          error: null,
        }
      }),

    setMaterialeId: (materialeId) =>
      set((state) => ({
        ...state,
        materialId: materialeId ?? null,
        materialeId: materialeId ?? null,
        calculated: null,
        error: null,
      })),

    setDefect: (d) => set({ defect: d }),
    applyDefectFix: () => {
      // compatibility stub: no-op by default
      try {
        const state = get()
        console.log('[ParametriStore] applyDefectFix stub called for', state.defect)
      } catch (_) {}
    },

    async ricalcola(input: CalculationInput) {
      try {
        set({ loading: true, error: null, isCalculating: true })
        // map input minimally for calcolaParametri
        const result = calcolaParametri({
          volumeCm3: input.volumeCm3,
          shotVolumeCm3: input.shotVolumeCm3,
          press: input.press ? { id: input.press.id, tonnellaggio: input.press.tonnellaggio, screwDiameters: input.press.screwDiameters, maxPressureBar: input.press.maxPressureBar, maxSpeedMmPerS: input.press.maxSpeedMmPerS } : null,
          material: input.material ? { id: input.material.id, densityGPerCm3: input.material.densityGPerCm3, recommendedTemperatureC: input.material.recommendedTemperatureC } : null,
        } as any)
        set({ calculated: result, result: result, loading: false, isCalculating: false, error: null })
        return result
      } catch (err: any) {
        set({ loading: false, isCalculating: false, error: String(err?.message ?? err), calculated: null, result: null })
        return null
      }
    },

    reset: () =>
      set({
        geometry: null,
        viewerUrl: null,
        press: null,
        materialId: null,
        calculated: null,
        loading: false,
        error: null,
      }),

    calculate: () => {
      const state = get()

      const { geometry, press, materialId } = state

      // Support legacy and new geometry shapes: prefer `volumePezzo_cm3` when present,
      // fallback to `volumeCm3` for older code.
      const pieceVolume = (geometry as any)?.volumePezzo_cm3 ?? (geometry as any)?.volumePezzo ?? geometry?.volumeCm3 ?? null

      // Validazione geometria: materozza NON obbligatoria
      if (
        !geometry ||
        typeof pieceVolume !== 'number' ||
        pieceVolume <= 0
      ) {
        const error = 'Geometria non valida: volume pezzo mancante o nullo.'
        console.warn('[ParametriStore] calculate: ' + error)
        set({ error, calculated: null })
        return null
      }

      // Normalizza volume totale anche senza materozza
      // normalise geometry into a `usedGeometry` object for the computation
      let usedGeometry: any = geometry
      try {
        const volP = Number(pieceVolume ?? 0)
        const volMater = (geometry as any)?.volumeMaterozza_cm3 ?? (geometry as any)?.volumeMaterozza ?? 0
        const normalized = {
          ...(geometry as any),
          // provide both legacy and new fields
          volumePezzo_cm3: volP,
          volumeTotale_cm3: volP + (volMater ?? 0),
          // keep a legacy numeric field expected by some callers
          volumeCm3: volP,
          thicknessAvgMm: (geometry as any)?.spessoreMedio_mm ?? (geometry as any)?.thicknessAvgMm ?? null,
        }
        // keep normalized geometry local to avoid triggering store subscribers
        // (writing normalized geometry back to the store here caused an
        // infinite update loop when callers auto-trigger `calculate()` on
        // geometry changes). Do not set() here; return normalized as usedGeometry.
        usedGeometry = normalized
      } catch (e) {
        // ignore normalisation errors, validation already passed
        usedGeometry = geometry as any
      }

      if (!press || !press.pressaId) {
        const error = 'Pressa non selezionata.'
        console.warn('[ParametriStore] calculate: ' + error)
        set({ error, calculated: null })
        return null
      }

      if (!materialId) {
        const error = 'Materiale non selezionato.'
        console.warn('[ParametriStore] calculate: ' + error)
        set({ error, calculated: null })
        return null
      }

      const machineInput = getMachineInputFromArburg(
        press.pressaId,
        press.screwDiameter_mm ?? undefined as any
      )

      if (!machineInput) {
        const error = `Pressa o vite non trovata nel catalogo Arburg (id=${press.pressaId}).`
        console.warn('[ParametriStore] calculate: ' + error)
        set({ error, calculated: null })
        return null
      }

      const materialInput = getMaterialInput(materialId)
      if (!materialInput) {
        const error = `Materiale non trovato nel catalogo (id=${materialId}).`
        console.warn('[ParametriStore] calculate: ' + error)
        set({ error, calculated: null })
        return null
      }

      try {
        set({ loading: true, error: null })

        const result = calcolaParametri({
          geometry: {
            volumeCm3: (usedGeometry as any).volumePezzo_cm3 ?? (usedGeometry as any).volumeCm3 ?? 0,
            thicknessAvgMm: (usedGeometry as any).thicknessAvgMm ?? (usedGeometry as any).spessoreMedio_mm ?? null,
            bbox: (usedGeometry as any).bbox ?? null,
          },
          machine: machineInput,
          material: materialInput,
        } as any) as CalculationResult

        set({
          calculated: result,
          loading: false,
          error: null,
        })

        console.log('[ParametriStore] calculate: OK', result)
        return result
      } catch (err: any) {
        console.error('[ParametriStore] calculate: errore', err)
        const message =
          typeof err?.message === 'string'
            ? err.message
            : 'Errore imprevisto nel calcolo parametri.'
        set({ loading: false, error: message, calculated: null })
        return null
      }
    },
  }

  // Subscribe to drawing/press/material canonical stores and orchestrate calculation here.
  // Debounce updates to avoid thrashing when multiple stores update quickly.
  setTimeout(() => {
    let debounce: ReturnType<typeof setTimeout> | null = null
    const trigger = () => {
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(() => {
        try {
          const drawing = useDrawingStore.getState()
          const press = usePressStore.getState()
          const material = useMaterialStore.getState()

          // Map external stores into our parametri state
          const newGeometry = drawing ? { volumeCm3: drawing.volumeCm3 ?? null, thicknessAvgMm: null, bbox: drawing.boundingBox ?? null } : null
          const newPress = press.selectedPressId ? { pressaId: press.selectedPressId, screwDiameter_mm: press.selectedScrewDiameter_mm ?? null } : null
          const newMaterialId = material.selectedMaterialId ?? null

          // Update our store with the canonical inputs
          set((s) => ({
            ...s,
            geometry: newGeometry,
            viewerUrl: drawing.previewUrl ?? drawing.glbUrl ?? s.viewerUrl,
            press: newPress,
            materialId: newMaterialId,
          }))

          // Trigger calculation when we have minimal valid inputs
          const current = get()
          const vol = (current.geometry as any)?.volumeCm3 ?? (current.geometry as any)?.volumePezzo_cm3 ?? null
          if (vol && typeof vol === 'number' && current.press && current.press.pressaId && current.materialId) {
            // synchronous calculate; calculate() will set loading/result
            current.calculate()
          }
        } catch (err) {
          console.warn('[ParametriStore] orchestration trigger error', err)
        }
      }, 200)
    }

    const unsubD = useDrawingStore.subscribe(trigger)
    const unsubP = usePressStore.subscribe(trigger)
    const unsubM = useMaterialStore.subscribe(trigger)

    // no explicit cleanup here: stores live for app lifetime
  }, 0)

  return store
})

export default useParametriStore
