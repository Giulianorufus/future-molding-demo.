import type { KnowledgeContext, KnowledgeRepository, SimilarCase, SimilarCaseQuery, OperationResult, KnowledgeError } from './types'

export async function matchCases(
  context: KnowledgeContext,
  repository: KnowledgeRepository
): Promise<OperationResult<SimilarCase[]>> {
  const query: SimilarCaseQuery = {
    recipeFingerprint: context.recipeFingerprint ?? null,
    pressId: context.input.pressId ?? null,
    materialId: context.input.materialId ?? null,
    defectId: context.defectContext?.defectId ?? null,
    severity: context.defectContext?.severity ?? null,
  }

  try {
    const similarCases = await repository.findSimilarCases(query)
    return { success: true, data: similarCases }
  } catch (cause) {
    const error: KnowledgeError = {
      code: 'match-cases-failed',
      message: String(cause instanceof Error ? cause.message : 'Unknown error'),
      metadata: { query },
    }
    return { success: false, error }
  }
}
