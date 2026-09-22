import type { ConfidenceResult, Diagnosis, SimilarCase, PolicyRecord } from './types'

export function assessConfidence(
  diagnosis: Diagnosis[],
  similarCases: SimilarCase[],
  policies: PolicyRecord[]
): ConfidenceResult {
  const baseValue = diagnosis.length * 20 + similarCases.length * 10 + policies.length * 10
  const value = Math.min(100, Math.max(0, baseValue))
  const tier: ConfidenceResult['tier'] = value >= 75 ? 'high' : value >= 40 ? 'medium' : 'low'

  const components = [
    {
      name: 'diagnosis',
      weight: 0.5,
      value: Math.min(100, diagnosis.length * 20),
      reason: 'Numero di diagnosi valide trovate',
    },
    {
      name: 'similarCases',
      weight: 0.3,
      value: Math.min(100, similarCases.length * 10),
      reason: 'Presenza di casi simili nel repository',
    },
    {
      name: 'policies',
      weight: 0.2,
      value: Math.min(100, policies.length * 10),
      reason: 'Policy disponibili per fingerprint o materiale',
    },
  ]

  return {
    value,
    tier,
    components,
    reason: 'Confidence calcolata dai componenti diagnostici, casi e policy.',
  }
}
