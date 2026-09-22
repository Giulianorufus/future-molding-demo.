import type { KnowledgeRepository, KnowledgeStatistics, StatisticsFilter, OperationResult, KnowledgeError } from './types'

export async function analyzeStatistics(
  repository: KnowledgeRepository,
  filter?: StatisticsFilter
): Promise<OperationResult<KnowledgeStatistics>> {
  try {
    const statistics = await repository.getStatistics(filter)
    return { success: true, data: statistics }
  } catch (cause) {
    const error: KnowledgeError = {
      code: 'statistics-fetch-failed',
      message: String(cause instanceof Error ? cause.message : 'Unknown error'),
      metadata: { filter },
    }
    return {
      success: false,
      error,
    }
  }
}
