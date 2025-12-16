type ClampCapacity = {
  clampForceAvailable_kN: number
  usableClampForce_kN: number
  assumption?: string | null
}

/**
 * Compute clamp capacity from press specs or press tonnage.
 * - prefer pressSpecs.clampForce_kN
 * - fallback to press.tonnellaggio (assumed kN)
 * - usableClampForce_kN = available * 0.85 (operational margin)
 */
export function computeClampCapacity(pressSpecs?: any, press?: any): ClampCapacity {
  let available = 0
  if (pressSpecs && typeof pressSpecs.clampForce_kN === 'number' && pressSpecs.clampForce_kN > 0) {
    available = pressSpecs.clampForce_kN
  } else if (press && typeof press.tonnellaggio === 'number' && press.tonnellaggio > 0) {
    available = press.tonnellaggio
  }

  const usable = Math.round(available * 0.85 * 100) / 100
  const assumption = available > 0 ? 'usable clamp force assumed at 85% of nominal' : null
  return { clampForceAvailable_kN: available, usableClampForce_kN: usable, assumption }
}

export default { computeClampCapacity }
