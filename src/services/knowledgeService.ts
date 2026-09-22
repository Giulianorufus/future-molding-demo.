import { apiFetch } from './api'

export async function saveKnowledgeCase(data: any) {
  return apiFetch('knowledge/case', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function loadKnowledgeCase(id: string) {
  return apiFetch(`knowledge/case/${id}`)
}

export async function findSimilarKnowledgeCases(query: any) {
  return apiFetch('knowledge/similar', {
    method: 'POST',
    body: JSON.stringify(query),
  })
}

export async function saveKnowledgeExperiment(data: any) {
  return apiFetch('knowledge/experiment', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function saveKnowledgeOutcome(data: any) {
  return apiFetch('knowledge/outcome', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getKnowledgeStatistics(filters: any = {}) {
  const query = new URLSearchParams(filters as Record<string, string>)
  return apiFetch(`knowledge/statistics?${query.toString()}`)
}
