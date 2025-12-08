export type DefectId = 'SHORT_SHOT' | 'BAVE' | 'RITIRO' | 'DEFORMAZIONE'

export interface ParamCorrection {
  velocitaIniezionePercent?: number
  pressioneIniezioneDeltaBar?: number
  vpPressionePercent?: number
  packPressionePercent?: number
  packTempoPercent?: number
  raffreddamentoTempoPercent?: number
}

export const defectCorrections: Record<DefectId, ParamCorrection> = {
  SHORT_SHOT: {
    velocitaIniezionePercent: +10,
    pressioneIniezioneDeltaBar: +50,
  },
  BAVE: {
    pressioneIniezioneDeltaBar: -50,
    vpPressionePercent: -10,
  },
  RITIRO: {
    packPressionePercent: +15,
    packTempoPercent: +20,
    raffreddamentoTempoPercent: +10,
  },
  DEFORMAZIONE: {
    raffreddamentoTempoPercent: +15,
  },
}

// Pure helper: apply corrections defensively to a CalculationInput-like object
export function applyDefectCorrections(base: any, defectId: DefectId | null): any {
  if (!defectId) return base
  const rules = defectCorrections[defectId]
  if (!rules) return base

  const next: any = { ...base }

  try {
    if (rules.velocitaIniezionePercent !== undefined) {
      if (typeof next.injectionSpeedCm3s === 'number') {
        next.injectionSpeedCm3s = Math.round(next.injectionSpeedCm3s * (1 + rules.velocitaIniezionePercent / 100))
      }
      if (typeof next.injectionSpeed === 'number') {
        next.injectionSpeed = Math.round(next.injectionSpeed * (1 + rules.velocitaIniezionePercent / 100))
      }
    }

    if (rules.pressioneIniezioneDeltaBar !== undefined) {
      if (typeof next.holdingPressureBar === 'number') next.holdingPressureBar = Math.round(next.holdingPressureBar + rules.pressioneIniezioneDeltaBar)
      if (typeof next.pressureBar === 'number') next.pressureBar = Math.round(next.pressureBar + rules.pressioneIniezioneDeltaBar)
    }

    if (rules.vpPressionePercent !== undefined) {
      if (typeof next.vpPressureBar === 'number') next.vpPressureBar = Math.round(next.vpPressureBar * (1 + rules.vpPressionePercent / 100))
      if (typeof next.vpPressure === 'number') next.vpPressure = Math.round(next.vpPressure * (1 + rules.vpPressionePercent / 100))
    }

    if (rules.packPressionePercent !== undefined) {
      if (typeof next.packPressureBar === 'number') next.packPressureBar = Math.round(next.packPressureBar * (1 + rules.packPressionePercent / 100))
      if (typeof next.packPressione === 'number') next.packPressione = Math.round(next.packPressione * (1 + rules.packPressionePercent / 100))
    }

    if (rules.packTempoPercent !== undefined) {
      if (typeof next.packTimeSec === 'number') next.packTimeSec = Math.round(next.packTimeSec * (1 + rules.packTempoPercent / 100))
      if (typeof next.packTempo === 'number') next.packTempo = Math.round(next.packTempo * (1 + rules.packTempoPercent / 100))
    }

    if (rules.raffreddamentoTempoPercent !== undefined) {
      if (typeof next.coolingTimeSec === 'number') next.coolingTimeSec = Math.round(next.coolingTimeSec * (1 + rules.raffreddamentoTempoPercent / 100))
      if (typeof next.raffreddamentoTempo === 'number') next.raffreddamentoTempo = Math.round(next.raffreddamentoTempo * (1 + rules.raffreddamentoTempoPercent / 100))
    }
  } catch (e) {
    // defensive: do not throw from this pure helper
  }

  return next
}

export default { defectCorrections, applyDefectCorrections }
