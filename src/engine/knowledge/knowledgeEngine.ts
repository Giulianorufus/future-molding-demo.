import { diagnose } from './diagnosisEngine'
import { recommend } from './recommendationEngine'
import { assessConfidence } from './confidenceEngine'
import { learn } from './learningEngine'
import { matchCases } from './caseMatcher'
import { analyzeStatistics } from './statisticsEngine'
import { nullKnowledgeRepository } from './repository'
import type {
  KnowledgeContext,
  KnowledgeRepository,
  KnowledgeResult,
  PolicyRecord,
  KnowledgeWarning,
} from './types'

export interface KnowledgeEngineOptions {
  collectStatistics?: boolean
}

export async function inferKnowledgeRecommendations(
  context: KnowledgeContext,
  repository: KnowledgeRepository = nullKnowledgeRepository,
  options: KnowledgeEngineOptions = { collectStatistics: false }
): Promise<KnowledgeResult> {
  const startAt = new Date().toISOString()
  const warnings: KnowledgeWarning[] = []

  const similarCasesResult = await matchCases(context, repository)
  const similarCases = similarCasesResult.success ? similarCasesResult.data ?? [] : []
  if (!similarCasesResult.success && similarCasesResult.error) {
    warnings.push({
      code: similarCasesResult.error.code,
      message: similarCasesResult.error.message,
      metadata: similarCasesResult.error.metadata,
    })
  }

  const diagnosis = await diagnose(context, similarCases)
  const recommendations = await recommend(diagnosis, context, similarCases)

  let policies: PolicyRecord[] = []
  try {
    policies = await repository.loadPolicies({ recipeFingerprint: context.recipeFingerprint ?? null, materialId: context.input.materialId ?? null, pressId: context.input.pressId ?? null })
  } catch (cause) {
    warnings.push({
      code: 'policies-load-failed',
      message: String(cause instanceof Error ? cause.message : 'Unknown error'),
      metadata: {
        recipeFingerprint: context.recipeFingerprint ?? null,
        materialId: context.input.materialId ?? null,
        pressId: context.input.pressId ?? null,
      },
    })
  }

  const confidence = assessConfidence(diagnosis, similarCases, policies)

  const result: KnowledgeResult = {
    version: '0.1.0',
    diagnosis,
    recommendations,
    confidence,
    similarCases,
    warnings,
    reasoning: [
      {
        stepId: 'orchestration-start',
        description: 'Inizio orchestrazione Knowledge Engine',
        outcome: 'started',
      },
    ],
    nextActions: [],
    metadata: {
      timestampISO: startAt,
      source: 'knowledgeEngine',
      version: '0.1.0',
      engineVersion: '0.1.0',
      recipeFingerprint: context.recipeFingerprint ?? null,
      pressId: context.input.pressId ?? null,
      materialId: context.input.materialId ?? null,
    },
  }

  const learningResult = await learn(context, result, repository)
  if (!learningResult.success && learningResult.error) {
    warnings.push({
      code: learningResult.error.code,
      message: learningResult.error.message,
      metadata: learningResult.error.metadata,
    })
  }

  if (options.collectStatistics) {
    const statisticsResult = await analyzeStatistics(repository, {
      recipeFingerprint: context.recipeFingerprint ?? null,
      materialId: context.input.materialId ?? null,
      pressId: context.input.pressId ?? null,
    })
    if (statisticsResult.success && statisticsResult.data) {
      result.metadata.statistics = statisticsResult.data
    } else if (statisticsResult.error) {
      warnings.push({
        code: statisticsResult.error.code,
        message: statisticsResult.error.message,
        metadata: statisticsResult.error.metadata,
      })
    }
  }

  return result
}
