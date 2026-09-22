import type { Diagnosis, KnowledgeContext, Recommendation, SimilarCase } from './types'

export async function recommend(
  diagnosis: Diagnosis[],
  context: KnowledgeContext,
  similarCases: SimilarCase[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = []

  if (diagnosis.some((item) => item.id === 'defect-root-cause')) {
    recommendations.push({
      id: 'adjust-defect-parameters',
      target: 'processParameters',
      action: 'investigate',
      reason: 'Rivedere i parametri di processo in presenza di un difetto identificato.',
      priority: 80,
    })
  }

  if (context.recipeFingerprint && similarCases.length > 0) {
    recommendations.push({
      id: 'confirm-similar-case-practice',
      target: 'baseline',
      action: 'validate',
      reason: 'Confronta la ricetta con casi simili per migliorare la coerenza delle decisioni.',
      priority: 50,
    })
  }

  return recommendations
}
