import { create } from 'zustand'
import { calcolaParametri, type CalculationInput, type CalculationResult } from '../core/calcEngine'
import { logInput, logOutput } from '../core/log'
import { useDrawingStore } from './drawingStore'
import { usePressStore } from './pressStore'
import { useMaterialStore } from './materialStore'

export type ParametriState = {
  lastInput: CalculationInput | null
  result: CalculationResult | null
  isCalculating: boolean
  error: string | null
  ricalcola: (input: CalculationInput) => Promise<void>
  reset: () => void
}

export const useParametriStore = create<ParametriState>((set) => ({
  lastInput: null,
  result: null,
  isCalculating: false,
  error: null,
  async ricalcola(input) {
    set({ isCalculating: true, error: null })
    try {
      try { logInput?.(input) } catch (_) {}
      const res = calcolaParametri(input as any) as CalculationResult
      try { logOutput?.(res) } catch (_) {}
      set({ lastInput: input, result: res, isCalculating: false })
    } catch (err: any) {
      set({ error: String(err?.message ?? err), isCalculating: false })
    }
  },
  reset() {
    set({ lastInput: null, result: null, isCalculating: false, error: null })
  },
}))

// Orchestrazione sicura: sottoscrivi le store rilevanti e richiama `ricalcola` in modo
// debounced e idempotente quando gli input cambiano. Non eseguiamo la sottoscrizione
// durante SSR (controllo window) e la eseguiamo una sola volta.
if (typeof window !== 'undefined') {
  let orchestrationInitialized = (useParametriStore as any)._orchestrationInitialized
  if (!orchestrationInitialized) {
    ;(useParametriStore as any)._orchestrationInitialized = true

    let timer: ReturnType<typeof setTimeout> | null = null
    const debounceMs = 250

    function buildInputFromStores(): CalculationInput {
      const d = useDrawingStore.getState()
      const p = usePressStore.getState()
      const m = useMaterialStore.getState()

      const pressEntry = p?.selectedPressId ? (p.catalog?.[p.selectedPressId] ?? null) : null
      const materialEntry = m?.selectedMaterialId ? (m.catalog?.[m.selectedMaterialId] ?? null) : null

      return {
        volumeCm3: d?.volumeCm3 ?? 0,
        shotVolumeCm3: undefined,
        press: pressEntry
          ? {
              id: p.selectedPressId,
              tonnellaggio: pressEntry.tonnellaggio,
              screwDiameters: pressEntry.screwDiameters || [],
              maxPressureBar: pressEntry.maxPressureBar,
              maxSpeedMmPerS: pressEntry.maxSpeedMmPerS,
            }
          : null,
        material: materialEntry
          ? {
              id: m.selectedMaterialId,
              densityGPerCm3: materialEntry.densityGPerCm3,
              recommendedTemperatureC: materialEntry.recommendedTemperatureC,
            }
          : null,
      }
    }

    function inputsEqual(a: CalculationInput | null, b: CalculationInput | null): boolean {
      try {
        return JSON.stringify(a) === JSON.stringify(b)
      } catch (_) {
        return false
      }
    }

    async function scheduleRecalc() {
      if (timer) clearTimeout(timer)
      timer = setTimeout(async () => {
        timer = null
        const input = buildInputFromStores()
        const current = useParametriStore.getState().lastInput
        if (inputsEqual(current, input)) return
        try {
          await useParametriStore.getState().ricalcola(input)
        } catch (e) {
          // swallow; ricalcola already sets error
        }
      }, debounceMs)
    }

    // Subscribe to stores; debounce guards against too-frequent calls
    useDrawingStore.subscribe(() => scheduleRecalc())
    usePressStore.subscribe(() => scheduleRecalc())
    useMaterialStore.subscribe(() => scheduleRecalc())
  }
}

export default useParametriStore
