import type {
  KnowledgeRepository,
  KnowledgeCaseRecord,
  KnowledgeExperimentRecord,
  KnowledgeMachineRecord,
  KnowledgeMaterialRecord,
  KnowledgeRecipeRecord,
  KnowledgeDefectRecord,
  KnowledgeCorrectionRecord,
  KnowledgeOutcomeRecord,
  SimilarCase,
  SimilarCaseQuery,
  PolicyRecord,
  LearningRecord,
  KnowledgeStatistics,
  KnowledgeCaseQuery,
  ExperimentQuery,
  StatisticsFilter,
} from './types'

export class NullKnowledgeRepository implements KnowledgeRepository {
  async saveCase(_record: KnowledgeCaseRecord): Promise<void> {
    return
  }

  async getCaseById(_id: string): Promise<KnowledgeCaseRecord | null> {
    return null
  }

  async listCases(_query: KnowledgeCaseQuery): Promise<KnowledgeCaseRecord[]> {
    return []
  }

  async saveRecipe(_record: KnowledgeRecipeRecord): Promise<void> {
    return
  }

  async getRecipeById(_id: string): Promise<KnowledgeRecipeRecord | null> {
    return null
  }

  async saveMachine(_record: KnowledgeMachineRecord): Promise<void> {
    return
  }

  async getMachineById(_id: string): Promise<KnowledgeMachineRecord | null> {
    return null
  }

  async saveMaterial(_record: KnowledgeMaterialRecord): Promise<void> {
    return
  }

  async getMaterialById(_id: string): Promise<KnowledgeMaterialRecord | null> {
    return null
  }

  async saveDefect(_record: KnowledgeDefectRecord): Promise<void> {
    return
  }

  async getDefectById(_id: string): Promise<KnowledgeDefectRecord | null> {
    return null
  }

  async saveCorrection(_record: KnowledgeCorrectionRecord): Promise<void> {
    return
  }

  async getCorrectionById(_id: string): Promise<KnowledgeCorrectionRecord | null> {
    return null
  }

  async saveOutcome(_record: KnowledgeOutcomeRecord): Promise<void> {
    return
  }

  async getOutcomeById(_id: string): Promise<KnowledgeOutcomeRecord | null> {
    return null
  }

  async saveExperiment(_record: KnowledgeExperimentRecord): Promise<void> {
    return
  }

  async getExperimentById(_id: string): Promise<KnowledgeExperimentRecord | null> {
    return null
  }

  async listExperiments(_query: ExperimentQuery): Promise<KnowledgeExperimentRecord[]> {
    return []
  }

  async findSimilarCases(_query: SimilarCaseQuery): Promise<SimilarCase[]> {
    return []
  }

  async loadPolicies(_filter: Partial<Omit<PolicyRecord, 'rules'>>): Promise<PolicyRecord[]> {
    return []
  }

  async saveLearning(_record: LearningRecord): Promise<void> {
    return
  }

  async getStatistics(_filter?: StatisticsFilter): Promise<KnowledgeStatistics> {
    return {
      caseCount: 0,
      recipeCount: 0,
      machineCount: 0,
      materialCount: 0,
      defectCount: 0,
      correctionCount: 0,
      outcomeCount: 0,
      experimentCount: 0,
      policyCount: 0,
      averageConfidence: 0,
      learningRecords: 0,
      metadata: {
        source: 'null-repository',
      },
    }
  }
}

export const nullKnowledgeRepository = new NullKnowledgeRepository()

export type {
  KnowledgeRepository,
  KnowledgeCaseRecord,
  KnowledgeMachineRecord,
  KnowledgeMaterialRecord,
  KnowledgeRecipeRecord,
  KnowledgeDefectRecord,
  KnowledgeCorrectionRecord,
  KnowledgeOutcomeRecord,
  SimilarCase,
  PolicyRecord,
  LearningRecord,
  KnowledgeStatistics,
  KnowledgeCaseQuery,
  StatisticsFilter,
}
