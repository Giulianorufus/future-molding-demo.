// src/lib/cavityPressureEstimate.ts
export type CavityPressureInput = {
  materialId?: string | null
  thickness_mm?: number | null
  flowLength_mm?: number | null
  volume_cm3?: number | null
}

export type CavityPressureResult = {
  estimatedCavityPressure_bar: number
  reason: string
}

const MIN_BAR = 250
const MAX_BAR = 900

function inferFamily(id?: string | null) {
  const s = (id ?? '').toLowerCase()
  if (!s) return 'generic'
  if (s.includes('pp')) return 'pp'
  if (s.includes('abs')) return 'abs'
  if (s.includes('pc')) return 'pc'
  if (s.includes('pa') || s.includes('nylon')) return 'pa'
  if (s.includes('pbt')) return 'pbt'
  if (s.includes('ps')) return 'ps'
  if (s.includes('pe')) return 'pe'
  return 'generic'
}

export function estimateCavityPressure(input: CavityPressureInput): CavityPressureResult {
  const family = inferFamily(input.materialId)
  const thicknessRaw = input.thickness_mm ?? 0
  const flow = Number(input.flowLength_mm ?? 0)

  // Guardrails for thickness (mm)
  const THICK_MIN = 0.6
  const THICK_MAX = 8
  const thicknessUsed = thicknessRaw > 0 ? Math.max(THICK_MIN, Math.min(THICK_MAX, Number(thicknessRaw))) : 0

  // base by family
  let base = 450
  if (family === 'pp' || family === 'pe') base = 320
  if (family === 'abs' || family === 'ps') base = 380
  if (family === 'pc' || family === 'pa') base = 600
  if (family === 'pbt') base = 480

  // L/t with guardrails
  let L_over_t = 20
  if (thicknessUsed > 0) {
    L_over_t = flow > 0 ? flow / thicknessUsed : 20
  } else {
    L_over_t = flow > 0 ? flow / 1.5 : 20 // fallback assume reasonable thickness
  }
  // clamp L/t to avoid extreme amplification
  L_over_t = Math.max(10, Math.min(250, L_over_t))
  const ltExtra = Math.max(0, L_over_t - 20) * 5 // +5 bar per unit above 20

  // thickness effect (thin parts need more pressure)
  let thicknessAdjust = 0
  if (thicknessUsed > 0) {
    if (thicknessUsed < 1.5) thicknessAdjust = 50
    else if (thicknessUsed >= 3.5) thicknessAdjust = -30
  }

  let estimated = Math.round(base + ltExtra + thicknessAdjust)
  const source = thicknessRaw > 0 ? 'mesh' : 'fallback'
  const reason = `source=${source};family=${family};base=${base};thickness_mm=${thicknessUsed.toFixed(1)};L/t=${L_over_t.toFixed(1)};ltExtra=${Math.round(ltExtra)};thicknessAdj=${thicknessAdjust}`

  if (estimated < MIN_BAR) estimated = MIN_BAR
  if (estimated > MAX_BAR) estimated = MAX_BAR

  return { estimatedCavityPressure_bar: estimated, reason }
}
