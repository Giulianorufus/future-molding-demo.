import RankingEngine from '../rankingEngine'
import type { SimilarCase, KnowledgeCaseRecord, KnowledgeExperimentRecord } from '../types'

describe('RankingEngine', () => {
  test('ranks by combined score', () => {
    const engine = new RankingEngine()
    const now = new Date().toISOString()

    const candidates: Array<{ similar: SimilarCase; caseRecord?: KnowledgeCaseRecord; experiments?: KnowledgeExperimentRecord[] }> = [
      { similar: { id: 'a', similarityScore: 90, summary: 'a' } as any, caseRecord: { id: 'a', createdAtISO: now, outcomeId: 'out1' } as any, experiments: [{ id: 'e1', caseId: 'a', attemptNumber: 1, modifiedParameters: {}, outcomeStatus: 'SUCCESS', createdAtISO: now } as any] },
      { similar: { id: 'b', similarityScore: 80, summary: 'b' } as any, caseRecord: { id: 'b', createdAtISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(), outcomeId: 'out2' } as any, experiments: [{ id: 'e2', caseId: 'b', attemptNumber: 1, modifiedParameters: {}, outcomeStatus: 'FAILED', createdAtISO: now } as any] },
    ]

    const ranked = engine.rank(candidates)
    expect(ranked[0].similar.id).toBe('a')
  })
})
