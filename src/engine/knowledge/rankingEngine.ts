import type { SimilarCase, KnowledgeExperimentRecord, KnowledgeCaseRecord } from './types'

export interface IRankingEngine {
  rank(candidates: Array<{ similar: SimilarCase; caseRecord?: KnowledgeCaseRecord; experiments?: KnowledgeExperimentRecord[] }>): Array<{ similar: SimilarCase; score: number }>
}

const outcomeMultiplier = (status?: string | null) => {
  switch (status) {
    case 'SUCCESS':
      return 1.2
    case 'PARTIAL_SUCCESS':
      return 1.0
    case 'NOT_TESTED':
      return 0.95
    case 'FAILED':
      return 0.6
    default:
      return 1.0
  }
}

function recencyFactor(createdAtISO?: string | null) {
  if (!createdAtISO) return 1
  const then = Date.parse(createdAtISO)
  if (Number.isNaN(then)) return 1
  const days = (Date.now() - then) / (1000 * 60 * 60 * 24)
  const lambda = 0.02 // decay speed
  return Math.exp(-lambda * days)
}

export class RankingEngine implements IRankingEngine {
  rank(candidates: Array<{ similar: SimilarCase; caseRecord?: KnowledgeCaseRecord; experiments?: KnowledgeExperimentRecord[] }>) {
    // compute score as product: normalizedSimilarity * outcome * recency * confidence
    const scored = candidates.map((c) => {
      const sim = (c.similar.similarityScore ?? 0) / 100
      const outcome = outcomeMultiplier((c.caseRecord as any)?.outcomeId ?? (c.caseRecord as any)?.outcomeId ?? null)
      const rec = recencyFactor((c.caseRecord as any)?.createdAtISO ?? null)
      // confidence: take average confidenceAfter across experiments if available
      let confidence = 1
      if (c.experiments && c.experiments.length) {
        const confs = c.experiments.map((e) => e.confidenceAfter ?? e.confidenceBefore ?? 0).filter((v) => typeof v === 'number')
        if (confs.length) confidence = Math.max(0.01, Math.min(1, confs.reduce((a, b) => a + (b as number), 0) / confs.length))
      }
      const score = sim * outcome * rec * confidence
      return { similar: c.similar, score }
    })

    scored.sort((a, b) => b.score - a.score)
    return scored
  }
}

export default RankingEngine
