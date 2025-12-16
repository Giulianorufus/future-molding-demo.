import type { PressSpecs } from './pressData'

type ApplyResult = {
  resultClamped: any
  warningsAdded: string[]
  clampedFields: string[]
}

export function applyPressLimits(result: any, pressSpecs?: PressSpecs | null): ApplyResult {
  const warnings: string[] = []
  const clamped: string[] = []
  if (!pressSpecs) return { resultClamped: result, warningsAdded: [], clampedFields: [] }

  // injection pressure
  const maxP = pressSpecs.maxInjectionPressure_bar
  if (typeof result.injectionPressure_bar === 'number' && Number.isFinite(maxP)) {
    if (result.injectionPressure_bar > maxP) {
      result.injectionPressure_bar = maxP
      warnings.push(`Clamped injectionPressure_bar to press max (${maxP} bar)`)
      clamped.push('injectionPressure_bar')
    }
  }

  // pack / packing pressure
  if (typeof result.pack_bar === 'number' && Number.isFinite(maxP)) {
    if (result.pack_bar > maxP) {
      result.pack_bar = maxP
      warnings.push(`Clamped packing pressure to press max (${maxP} bar)`)
      clamped.push('pack_bar')
    }
  }

  // injection speed (cm3/s)
  const maxSpeed = pressSpecs.maxInjectionSpeed_cm3s
  if (typeof result.injectionSpeed_cm3s === 'number' && Number.isFinite(maxSpeed)) {
    if (result.injectionSpeed_cm3s > maxSpeed) {
      result.injectionSpeed_cm3s = maxSpeed
      warnings.push(`Clamped injectionSpeed_cm3s to press max (${maxSpeed} cm3/s)`)
      clamped.push('injectionSpeed_cm3s')
    }
  }

  // shot volume (allow check both shotVolume_cm3 and vp_cm3)
  const maxShot = pressSpecs.maxShot_cm3
  const shotFields = ['shotVolume_cm3', 'vp_cm3']
  for (const f of shotFields) {
    if (typeof result[f] === 'number' && Number.isFinite(maxShot)) {
      if (result[f] > maxShot) {
        result[f] = maxShot
        warnings.push(`Calculated ${f} exceeds press max (${maxShot} cm3) — clamped`)
        clamped.push(f)
      }
    }
  }

  return { resultClamped: result, warningsAdded: warnings, clampedFields: clamped }
}

export default { applyPressLimits }
