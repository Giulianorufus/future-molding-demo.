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
  const thickness = Number(input.thickness_mm ?? 0)
  const flow = Number(input.flowLength_mm ?? 0)

  // base by family
  let base = 450
  if (family === 'pp' || family === 'pe') base = 320
  if (family === 'abs' || family === 'ps') base = 380
  if (family === 'pc' || family === 'pa') base = 600
  if (family === 'pbt') base = 480

  // L/t
  const L_over_t = thickness > 0 ? (flow > 0 ? flow / thickness : 20) : 20
  const ltExtra = Math.max(0, L_over_t - 20) * 5 // +5 bar per unit above 20

  // thickness effect (thin parts need more pressure)
  let thicknessAdjust = 0
  if (thickness > 0) {
    if (thickness < 1.5) thicknessAdjust = 50
    else if (thickness >= 3.5) thicknessAdjust = -30
  }

  let estimated = Math.round(base + ltExtra + thicknessAdjust)
  const reason = `family=${family};base=${base};L/t=${L_over_t.toFixed(1)};ltExtra=${Math.round(ltExtra)};thicknessAdj=${thicknessAdjust}`

  if (estimated < MIN_BAR) estimated = MIN_BAR
  if (estimated > MAX_BAR) estimated = MAX_BAR

  return { estimatedCavityPressure_bar: estimated, reason }
}
