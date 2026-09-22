import type { KnowledgeContext, KnowledgeResult, KnowledgeRepository, LearningRecord, OperationResult, KnowledgeError } from './types'

export async function learn(
  context: KnowledgeContext,
  result: KnowledgeResult,
  repository: KnowledgeRepository
): Promise<OperationResult<void>> {
  const record: LearningRecord = {
    id: `${context.recipeFingerprint ?? 'unknown'}-${new Date().toISOString()}`,
    createdAtISO: new Date().toISOString(),
    context,
    result,
    metadata: {
      source: 'learningEngine',
    },
  }

  try {
    await repository.saveLearning(record)
    return { success: true }
  } catch (cause) {
    const error: KnowledgeError = {
      code: 'learning-save-failed',
      message: String(cause instanceof Error ? cause.message : 'Unknown error'),
      metadata: { recordId: record.id },
    }
    return { success: false, error }
  }
}
