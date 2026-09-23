import type { PressSpecs } from './pressData'
import type { AppliedCorrection } from '../types/appliedCorrection'

type ApplyResult = {
  resultClamped: any
  warningsAdded: string[]
  clampedFields: string[]
  appliedCorrections: AppliedCorrection[]
}

export function applyPressLimits(result: any, pressSpecs?: PressSpecs | null): ApplyResult {
  const warnings: string[] = []
  const clamped: string[] = []
  const appliedCorrections: AppliedCorrection[] = []
  if (!pressSpecs) return { resultClamped: result, warningsAdded: [], clampedFields: [], appliedCorrections: [] }

  // injection pressure
  const maxP = (pressSpecs as any).maxInjectionPressure_bar ?? (pressSpecs as any).maxPressureBar
  const pressureField = typeof result.injectionPressure_bar === 'number' ? 'injectionPressure_bar'
    : typeof result.computedInjectionPressure_bar === 'number' ? 'computedInjectionPressure_bar'
    : typeof result.pressioneIniezione === 'number' ? 'pressioneIniezione' : null
  if (pressureField && Number.isFinite(maxP)) {
    if (result[pressureField] > maxP) {
      const before = result[pressureField]
      result[pressureField] = maxP
      warnings.push(`Clamped injectionPressure_bar to press max (${maxP} bar)`)
      clamped.push('injectionPressure_bar')
      appliedCorrections.push({
        id: `pressLimit:injectionPressure_bar`,
        type: 'pressLimit',
        target: pressureField,
        action: 'clamp',
        before,
        after: maxP,
        delta: maxP - before,
        unit: 'bar',
        reason: 'press max',
        source: 'pressLimits',
      })
    }
  }

  // pack / packing pressure
  if (typeof result.pack_bar === 'number' && Number.isFinite(maxP)) {
    if (result.pack_bar > maxP) {
      const before = result.pack_bar
      result.pack_bar = maxP
      warnings.push(`Clamped packing pressure to press max (${maxP} bar)`)
      clamped.push('pack_bar')
      appliedCorrections.push({
        id: `pressLimit:pack_bar`,
        type: 'pressLimit',
        target: 'pack_bar',
        action: 'clamp',
        before,
        after: maxP,
        delta: maxP - before,
        unit: 'bar',
        reason: 'press max',
        source: 'pressLimits',
      })
    }
  }

  // injection speed (cm3/s)
  const maxSpeed = (pressSpecs as any).maxInjectionSpeed_cm3s ?? (pressSpecs as any).maxSpeedCm3s
  const speedField = typeof result.injectionSpeed_cm3s === 'number' ? 'injectionSpeed_cm3s'
    : typeof result.injectionSpeedCm3s === 'number' ? 'injectionSpeedCm3s' : null
  if (speedField && Number.isFinite(maxSpeed)) {
    if (result[speedField] > maxSpeed) {
      const before = result[speedField]
      result[speedField] = maxSpeed
      warnings.push(`Clamped injectionSpeed_cm3s to press max (${maxSpeed} cm3/s)`)
      clamped.push('injectionSpeed_cm3s')
      appliedCorrections.push({
        id: `pressLimit:injectionSpeed_cm3s`,
        type: 'pressLimit',
        target: speedField,
        action: 'clamp',
        before,
        after: maxSpeed,
        delta: maxSpeed - before,
        unit: 'cm3/s',
        reason: 'press max',
        source: 'pressLimits',
      })
    }
  }

  // shot volume (allow check both shotVolume_cm3 and vp_cm3)
  const maxShot = (pressSpecs as any).maxShot_cm3 ?? (pressSpecs as any).shotVolumeCm3
  const shotFields = ['shotVolume_cm3', 'shotVolumeCm3', 'vp_cm3', 'vpVolumeCm3']
  for (const f of shotFields) {
    if (typeof result[f] === 'number' && Number.isFinite(maxShot)) {
      if (result[f] > maxShot) {
        const before = result[f]
        result[f] = maxShot
        warnings.push(`Calculated ${f} exceeds press max (${maxShot} cm3) — clamped`)
        clamped.push(f)
        appliedCorrections.push({
          id: `pressLimit:${f}`,
          type: 'pressLimit',
          target: f,
          action: 'clamp',
          before,
          after: maxShot,
          delta: maxShot - before,
          unit: 'cm3',
          reason: 'press max',
          source: 'pressLimits',
        })
      }
    }
  }

  return { resultClamped: result, warningsAdded: warnings, clampedFields: clamped, appliedCorrections }
}

export default { applyPressLimits }
