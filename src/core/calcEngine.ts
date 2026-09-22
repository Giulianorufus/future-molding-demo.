/**
 * Compatibility facade for the historical core API.
 *
 * All process calculations are delegated to ../engine/calcEngine so Wizard,
 * Academy, simulation and diagnostics can share one calculation engine.
 * Keep this file free of independent molding formulas.
 */
import { calcolaParametri as calculateUnified } from '../engine/calcEngine'
import type { CadAnalysisMeta } from '../types/cadAnalysisMeta'

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
    maxShotVolumeCm3?: number
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
  unified?: unknown
}

export type CalcContext = {
  defectId?: string | null
  severity?: 'low' | 'medium' | 'high' | string | null
  cadAnalysisMeta?: CadAnalysisMeta | null
}

function toFinite(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function calcolaParametri(input: CalculationInput, _context?: CalcContext): CalculationResult {
  const press = input.press
  const material = input.material
  const screw = press?.screwDiameterMm ?? press?.screwDiameters?.[0] ?? 20

  const unifiedInput: any = {
    materialId: material?.id,
    material: {
      id: material?.id,
      density_g_cm3: material?.densityGPerCm3,
    },
    machine: {
      id: press?.id,
      nome: press?.id,
      tonnellaggio_kN: toFinite(press?.tonnellaggio) * 9.80665,
      screwDiameter_mm: screw,
      maxInjectionPressure_bar: press?.maxPressureBar,
      // Legacy catalog calls this mm/s; the compatibility boundary passes the
      // configured machine maximum through without inventing another formula.
      maxInjectionSpeed_cm3_s: press?.maxSpeedMmPerS,
      maxShotVolume_cm3: press?.maxShotVolumeCm3,
    },
    geometry: {
      volumePezzo_cm3: input.volumeCm3,
      volumeTotale_cm3: input.shotVolumeCm3 ?? input.volumeCm3,
      areaProiettata_cm2: input.projectedAreaCm2,
    },
  }

  const out: any = calculateUnified(unifiedInput)
  const fillSec = Math.max(0, toFinite(out.fillTime, 0))
  const coolingSec = Math.max(0, toFinite(out.coolingTime, 0))
  const vpCm3 = Math.max(0, toFinite(out.vp, 0))
  const flowCm3s = Math.max(0, toFinite(out.velIniezione, 0))
  const switchoverMs = flowCm3s > 0 ? Math.round((vpCm3 / flowCm3s) * 1000) : 0

  return {
    tonnellaggioRequired: Number(toFinite(out.tonnellaggio, 0).toFixed(1)),
    pressureBar: Math.round(toFinite(out.pressioneIniezione, 0)),
    screwDiameterMm: screw,
    velocityMmPerS: Math.round(flowCm3s),
    switchoverMs,
    times: {
      injectionMs: Math.max(1, Math.round(fillSec * 1000)),
      coolingMs: Math.max(1, Math.round(coolingSec * 1000)),
    },
    cooling: {
      suggestedC: Math.round(toFinite(out?.temperature?.stampo, material?.recommendedTemperatureC ?? 60)),
    },
    unified: out,
  }
}

export default { calcolaParametri }
