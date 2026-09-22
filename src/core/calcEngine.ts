export type CalculationInput = {
  volumeCm3: number
  shotVolumeCm3?: number
  projectedAreaCm2?: number
  cavityCount?: number
  press?: {
    id: string
    tonnellaggio: number
    screwDiameters: number[]
    screwDiameterMm?: number
    maxPressureBar: number
    maxSpeedMmPerS: number
  } | null
  material?: {
    id: string
    densityGPerCm3?: number
    recommendedTemperatureC?: number
  } | null
}

export type CalculationResult = {
  tonnellaggioRequired: number
  pressureBar: number
  screwDiameterMm: number
  velocityMmPerS: number
  switchoverMs: number
  times: { injectionMs: number; coolingMs: number }
  cooling: { suggestedC: number }
}

import type { CadAnalysisMeta } from '../types/cadAnalysisMeta'

export type CalcContext = {
  defectId?: string | null
  severity?: "low" | "medium" | "high" | string | null
  cadAnalysisMeta?: CadAnalysisMeta | null
}

export function calcolaTonnellaggio(volumeCm3: number, materialDensity?: number, projectedAreaCm2?: number, materialId?: string): number {
  if (typeof projectedAreaCm2 === 'number' && projectedAreaCm2 > 0) {
    const id = String(materialId ?? '').toUpperCase()
    const pressureGcm2 = id.includes('PA') ? 500 : id.includes('PC') ? 430 : id.includes('ABS') ? 380 : 330
    return Number(((projectedAreaCm2 * pressureGcm2) / 1000).toFixed(1))
  }
  const grams = volumeCm3 * (materialDensity ?? 1)
  return Math.max(1, Number(((grams * 0.1) / 1000).toFixed(1)))
}

export function calcolaPressione(volumeCm3: number, shotVolumeCm3?: number): number {
  // Placeholder: smaller parts -> lower pressure baseline
  const base = 50
  const ratio = (shotVolumeCm3 ? shotVolumeCm3 / Math.max(1, volumeCm3) : 1)
  return Math.min(300, Math.round(base * ratio))
}

export function calcolaVelocità(pressMaxSpeed?: number): number {
  return pressMaxSpeed ? Math.round(pressMaxSpeed * 0.8) : 100
}

export function calcolaSwitchover(volumeCm3: number): number {
  // ms: smaller volume -> faster switchover
  return Math.max(5, Math.round(30 / Math.sqrt(Math.max(1, volumeCm3))))
}

export function calcolaTempi(volumeCm3: number): { injectionMs: number; coolingMs: number } {
  const injection = Math.round(Math.max(50, volumeCm3 * 2))
  const cooling = Math.round(Math.max(200, volumeCm3 * 10))
  return { injectionMs: injection, coolingMs: cooling }
}

export function calcolaRaffreddamento(materialTemp?: number): { suggestedC: number } {
  return { suggestedC: materialTemp ?? 60 }
}

export function calcolaParametri(input: CalculationInput, context?: CalcContext): CalculationResult {
  const { volumeCm3, press, material, shotVolumeCm3, projectedAreaCm2 } = input
  const ton = calcolaTonnellaggio(volumeCm3, material?.densityGPerCm3, projectedAreaCm2, material?.id)
  const pressure = calcolaPressione(volumeCm3, shotVolumeCm3)
  const screw = press?.screwDiameterMm ?? press?.screwDiameters?.[0] ?? 20
  const velocity = calcolaVelocità(press?.maxSpeedMmPerS)
  const sw = calcolaSwitchover(volumeCm3)
  const times = calcolaTempi(volumeCm3)
  const cooling = calcolaRaffreddamento(material?.recommendedTemperatureC)

  return {
    tonnellaggioRequired: ton,
    pressureBar: pressure,
    screwDiameterMm: screw,
    velocityMmPerS: velocity,
    switchoverMs: sw,
    times,
    cooling,
  }
}

export default { calcolaParametri }
