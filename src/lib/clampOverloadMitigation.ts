type MitigateResult = {
  result: any
  warningsAdded: string[]
  appliedCorrections: string[]
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
  const applied: string[] = []

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
      const old = result.pack_bar
      result.pack_bar = Math.max(0, Math.round(result.pack_bar * (1 - packPct / 100)))
      applied.push(`pack_bar:${old}->${result.pack_bar}`)
    }

    if (typeof result.injectionPressure_bar === 'number' && result.injectionPressure_bar > 0) {
      const old2 = result.injectionPressure_bar
      result.injectionPressure_bar = Math.max(0, Math.round(result.injectionPressure_bar * (1 - injPct / 100)))
      applied.push(`injectionPressure_bar:${old2}->${result.injectionPressure_bar}`)
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
