import type { KnowledgeContext, Diagnosis, SimilarCase } from './types'

export async function diagnose(
  context: KnowledgeContext,
  similarCases: SimilarCase[]
): Promise<Diagnosis[]> {
  const diagnosis: Diagnosis[] = []

  const hasDefect = typeof context.defectContext?.defectId === 'string' && context.defectContext.defectId.length > 0
  if (hasDefect) {
    diagnosis.push({
      id: 'defect-root-cause',
      title: 'Cause difettose identificate',
      description: 'Il sistema ha identificato un difetto e ne valuta le possibili cause primarie.',
      score: 80,
      severity: 'medium',
      tags: ['defect', 'root-cause'],
      source: 'diagnosisEngine',
    })
  }

  if (similarCases.length > 0) {
    diagnosis.push({
      id: 'case-correlation',
      title: 'Casi simili trovati',
      description: 'Sono disponibili casi di produzione simili per validare le ipotesi e le raccomandazioni.',
      score: 60,
      severity: 'low',
      tags: ['case-based', 'correlation'],
      source: 'diagnosisEngine',
    })
  }

  return diagnosis
}
