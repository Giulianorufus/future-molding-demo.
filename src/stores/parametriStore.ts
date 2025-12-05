import { create } from 'zustand'
import { calcolaParametri, type CalculationInput, type CalculationResult } from '../core/calcEngine'
import { logInput, logOutput } from '../core/log'

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
      logInput(input)
      const res = calcolaParametri(input)
      logOutput(res)
      set({ lastInput: input, result: res, isCalculating: false })
    } catch (err: any) {
      set({ error: String(err?.message ?? err), isCalculating: false })
    }
  },
  reset() {
    set({ lastInput: null, result: null, isCalculating: false, error: null })
  },
}))

export default useParametriStore
