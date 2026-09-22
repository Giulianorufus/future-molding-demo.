import type { KnowledgeCaseRecord, SimilarCase } from './types'

export interface ISimilarityEngine {
  scoreCase(candidate: KnowledgeCaseRecord, probe: Partial<KnowledgeCaseRecord>): { total: number; contributions: Record<string, number> }
  findSimilar(cases: KnowledgeCaseRecord[], probe: Partial<KnowledgeCaseRecord>, topN?: number): SimilarCase[]
}

export const defaultWeights = {
  material: 30,
  geometry: 25,
  thickness: 15,
  press: 10,
  screw: 10,
  weight: 5,
  temperature: 5,
}

function numericSimilarity(a?: number | null, b?: number | null) {
  if (a == null || b == null) return 0
  const max = Math.max(Math.abs(a), Math.abs(b), 1)
  const diff = Math.abs(a - b)
  const s = Math.max(0, 1 - diff / max)
  return s
}

function extractMetaValue(rec: KnowledgeCaseRecord, key: string) {
  try {
    return (rec.metadata as any)?.[key]
  } catch (_) {
    return undefined
  }
}

export class SimilarityEngine implements ISimilarityEngine {
  constructor(public readonly weights = defaultWeights) {}

  scoreCase(candidate: KnowledgeCaseRecord, probe: Partial<KnowledgeCaseRecord>) {
    const w = this.weights
    const contributions: Record<string, number> = {}
    // material
    contributions.material = probe.materialId && candidate.materialId && probe.materialId === candidate.materialId ? 1 : 0

    // geometry (hash equality)
    contributions.geometry = probe.geometryHash && candidate.geometryHash && probe.geometryHash === candidate.geometryHash ? 1 : 0

    // thickness
    contributions.thickness = numericSimilarity(candidate.thicknessMm ?? undefined, probe.thicknessMm ?? undefined)

    // press (machineId)
    contributions.press = probe.machineId && candidate.machineId && probe.machineId === candidate.machineId ? 1 : 0

    // screw (fallback to metadata.screwId)
    const candScrew = extractMetaValue(candidate, 'screwId')
    const probeScrew = extractMetaValue(probe as any, 'screwId')
    contributions.screw = probeScrew && candScrew && probeScrew === candScrew ? 1 : 0

    // weight (metadata.shotWeight_g)
    const candWeight = Number(extractMetaValue(candidate, 'shotWeight_g')) || undefined
    const probeWeight = Number(extractMetaValue(probe as any, 'shotWeight_g')) || undefined
    contributions.weight = numericSimilarity(candWeight, probeWeight)

    // temperature (metadata.meltTempC)
    const candTemp = Number(extractMetaValue(candidate, 'meltTempC')) || undefined
    const probeTemp = Number(extractMetaValue(probe as any, 'meltTempC')) || undefined
    contributions.temperature = numericSimilarity(candTemp, probeTemp)

    // compute weighted total (0..100)
    const totalWeight = Object.values(w).reduce((a, b) => a + b, 0)
    let acc = 0
    acc += contributions.material * w.material
    acc += contributions.geometry * w.geometry
    acc += contributions.thickness * w.thickness
    acc += contributions.press * w.press
    acc += contributions.screw * w.screw
    acc += contributions.weight * w.weight
    acc += contributions.temperature * w.temperature

    const total = Math.round((acc / totalWeight) * 100)
    return { total, contributions }
  }

  findSimilar(cases: KnowledgeCaseRecord[], probe: Partial<KnowledgeCaseRecord>, topN = 10) {
    const scored = cases.map((c) => {
      const s = this.scoreCase(c, probe)
      const similar: SimilarCase = {
        id: c.id,
        recipeFingerprint: c.recipeId ?? null,
        pressId: c.machineId ?? null,
        materialId: c.materialId ?? null,
        similarityScore: s.total,
        summary: `case ${c.id}`,
        metadata: { contributions: s.contributions },
      }
      return { candidate: c, similar }
    })

    scored.sort((a, b) => b.similar.similarityScore - a.similar.similarityScore)
    return scored.slice(0, topN).map((s) => s.similar)
  }
}

export default SimilarityEngine
