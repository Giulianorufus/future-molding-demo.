import type { CalculationResult } from '../../core/calcEngine'

export type OperatorInjectionPhase = {
  step: number
  flowCm3s: number
  endPercentOfShot: number | null
}

export type OperatorRecipeView = {
  shotVolumeCm3: number | null
  vpVolumeCm3: number | null
  vpPercentOfShot: number | null
  vpTimeMs: number | null
  injectionFlowCm3s: number | null
  injectionPressureBar: number | null
  injectionPhases: OperatorInjectionPhase[]
  holdingPressureBar: number | null
  holdingTimeSec: number | null
  screwRpm: number | null
  plastificationTimeSec: number | null
  backPressureBar: number | null
  coolingTimeMs: number | null
  requiredClampTon: number | null
  screwDiameterMm: number | null
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function injectionPhases(value: unknown, vpAvailable: boolean): OperatorInjectionPhase[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((entry: unknown): OperatorInjectionPhase[] => {
    const phase = record(entry)
    const step = positiveNumber(phase?.step)
    const flow = positiveNumber(phase?.speed_cm3_s)
    if (step === null || flow === null) return []

    const endBy = record(phase?.endBy)
    const endPercent = endBy?.kind === 'volumePercent'
      ? positiveNumber(endBy.value)
      : null

    return [{
      step,
      flowCm3s: flow,
      // Senza geometria confermata la percentuale può riferirsi ai soli pezzi.
      endPercentOfShot: vpAvailable && endPercent !== null && endPercent <= 100
        ? endPercent
        : null,
    }]
  })
}

/** Adatta i risultati esistenti alla scheda operatore senza ricalcolare la ricetta. */
export function buildOperatorRecipeView(result: CalculationResult): OperatorRecipeView {
  const unified = record(result.unified)
  const vpVolume = positiveNumber(result.vpSwitchVolumeCm3)
  const shotVolume = positiveNumber(result.shotVolumeCm3)

  return {
    shotVolumeCm3: shotVolume,
    vpVolumeCm3: vpVolume,
    vpPercentOfShot: vpVolume !== null ? positiveNumber(result.vpSwitchPercentOfShot) : null,
    vpTimeMs: vpVolume !== null ? positiveNumber(result.switchoverMs) : null,
    injectionFlowCm3s: positiveNumber(result.injectionFlowCm3s),
    injectionPressureBar: positiveNumber(result.pressureBar),
    injectionPhases: injectionPhases(unified?.injectionProfile, vpVolume !== null),
    holdingPressureBar: positiveNumber(unified?.packPressione),
    holdingTimeSec: positiveNumber(unified?.packTempo),
    screwRpm: positiveNumber(unified?.velocitaVite),
    plastificationTimeSec: positiveNumber(unified?.tempoDosatura),
    backPressureBar: positiveNumber(unified?.contropressione),
    coolingTimeMs: positiveNumber(result.times?.coolingMs),
    requiredClampTon: positiveNumber(result.tonnellaggioRequired),
    screwDiameterMm: positiveNumber(result.screwDiameterMm),
  }
}
