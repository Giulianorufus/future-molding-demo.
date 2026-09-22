import type {
  KnowledgeCaseRecord,
  KnowledgeExperimentRecord,
  KnowledgeOutcomeRecord,
  KnowledgeStatistics,
  StatisticsFilter,
  SimilarCaseQuery,
  ExperimentQuery,
  KnowledgeRepository,
} from '@/engine/knowledge'

export class KnowledgeService {
  constructor(private readonly repository: KnowledgeRepository) {}

  async saveCase(record: KnowledgeCaseRecord): Promise<KnowledgeCaseRecord> {
    await this.repository.saveCase(record)
    return record
  }

  async loadCase(id: string): Promise<KnowledgeCaseRecord | null> {
    return this.repository.getCaseById(id)
  }

  async findSimilarCases(query: SimilarCaseQuery) {
    return this.repository.findSimilarCases(query)
  }

  async saveOutcome(record: KnowledgeOutcomeRecord): Promise<KnowledgeOutcomeRecord> {
    await this.repository.saveOutcome(record)
    return record
  }

  async getStatistics(filter?: StatisticsFilter): Promise<KnowledgeStatistics> {
    return this.repository.getStatistics(filter)
  }

  async saveExperiment(record: KnowledgeExperimentRecord): Promise<KnowledgeExperimentRecord> {
    await this.repository.saveExperiment(record)
    return record
  }

  async listExperiments(query: ExperimentQuery): Promise<KnowledgeExperimentRecord[]> {
    return this.repository.listExperiments(query)
  }
}

export function createKnowledgeService(repository: KnowledgeRepository): KnowledgeService {
  return new KnowledgeService(repository)
}
