import { knowledgeCaseSchema } from '@/engine/knowledge/knowledgeCase.schema'
import { knowledgeExperimentSchema } from '@/engine/knowledge/knowledgeExperiment.schema'
import { knowledgeOutcomeSchema } from '@/engine/knowledge/knowledgeOutcome.schema'
import { knowledgeStatisticsSchema } from '@/engine/knowledge/knowledgeStatistics.schema'

describe('Knowledge Engine schemas', () => {
  test('knowledgeCaseSchema accepts a valid knowledge case record', () => {
    expect(() =>
      knowledgeCaseSchema.parse({
        id: 'case-001',
        createdAtISO: new Date().toISOString(),
      }),
    ).not.toThrow()
  })

  test('knowledgeOutcomeSchema rejects invalid status values', () => {
    expect(() =>
      knowledgeOutcomeSchema.parse({
        id: 'outcome-001',
        status: 'INVALID',
      } as any),
    ).toThrow()
  })

  test('knowledgeExperimentSchema accepts a valid experiment record', () => {
    expect(() =>
      knowledgeExperimentSchema.parse({
        id: 'exp-001',
        caseId: 'case-001',
        attemptNumber: 1,
        modifiedParameters: { speed: 72 },
        outcomeStatus: 'SUCCESS',
        createdAtISO: new Date().toISOString(),
      }),
    ).not.toThrow()
  })

  test('knowledgeStatisticsSchema accepts valid statistics payload', () => {
    expect(() =>
      knowledgeStatisticsSchema.parse({
        caseCount: 10,
        recipeCount: 3,
        machineCount: 2,
        materialCount: 4,
        defectCount: 1,
        correctionCount: 2,
        outcomeCount: 5,
        experimentCount: 6,
        policyCount: 0,
        averageConfidence: 85,
        learningRecords: 2,
      }),
    ).not.toThrow()
  })
})
