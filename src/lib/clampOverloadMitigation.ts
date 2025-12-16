import type { AppliedCorrection } from '../types/appliedCorrection'

type MitigateResult = {
  result: any
  warningsAdded: string[]
  appliedCorrections: AppliedCorrection[]
}

/**
 * result: calculation result object
 * context: may contain defectId and severity
 * pressSpecs: press limits
 *
 * Rules:
 * - If clampUtilization_pct > 95% and defect != short_shot/incomplete_fill:
 *    - reduce pack_bar by 10-20% (severity 'high' -> 20, 'medium'->15, else 10)
 *    - if still high, reduce injectionPressure_bar by 5-10% (same severity mapping)
 * - If defect is short_shot or incomplete_fill: only warning, no changes
 */
export function mitigateClampOverload(result: any, context?: any, pressSpecs?: any): MitigateResult {
  const warnings: string[] = []
  const applied: AppliedCorrection[] = []

  const util = Number(result?.clampUtilization_pct ?? 0)
  if (!Number.isFinite(util) || util <= 85) return { result, warningsAdded: [], appliedCorrections: [] }

  const defectId = context?.defectId ?? null
  const severity = context?.severity ?? null

  const shortShotIds = ['short_shot', 'incomplete_fill']
  if (defectId && shortShotIds.includes(String(defectId))) {
    warnings.push('Press may be undersized for selected defect; no auto-correction applied')
    return { result, warningsAdded: warnings, appliedCorrections: [] }
  }

  if (util > 95) {
    // determine percent reductions by severity
    const severityMap: any = { high: 20, medium: 15 }
    const packPct = severityMap[severity] ?? 10
    const injPct = Math.max(5, Math.round(packPct / 2))

    if (typeof result.pack_bar === 'number' && result.pack_bar > 0) {
      const before = result.pack_bar
      result.pack_bar = Math.max(0, Math.round(result.pack_bar * (1 - packPct / 100)))
      applied.push({
        id: `clampMitigation:pack_bar`,
        type: 'clampMitigation',
        target: 'pack_bar',
        action: result.pack_bar < before ? 'decrease' : 'set',
        before,
        after: result.pack_bar,
        delta: (result.pack_bar - before),
        unit: 'bar',
        reason: 'reduce clamp overload',
        source: 'clampOverloadMitigation',
      })
    }

    if (typeof result.injectionPressure_bar === 'number' && result.injectionPressure_bar > 0) {
      const before2 = result.injectionPressure_bar
      result.injectionPressure_bar = Math.max(0, Math.round(result.injectionPressure_bar * (1 - injPct / 100)))
      applied.push({
        id: `clampMitigation:injectionPressure_bar`,
        type: 'clampMitigation',
        target: 'injectionPressure_bar',
        action: result.injectionPressure_bar < before2 ? 'decrease' : 'set',
        before: before2,
        after: result.injectionPressure_bar,
        delta: (result.injectionPressure_bar - before2),
        unit: 'bar',
        reason: 'reduce clamp overload',
        source: 'clampOverloadMitigation',
      })
    }

    warnings.push('Auto-correction: reduced packing/injection pressure to lower clamp demand')
  }

  // util 85-95% -> only warnings
  if (util > 85 && util <= 95) {
    warnings.push('Clamp utilization between 85% and 95%: consider larger press or part rework')
  }

  return { result, warningsAdded: warnings, appliedCorrections: applied }
}

export default { mitigateClampOverload }
