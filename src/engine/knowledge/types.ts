export type KnowledgeVersion = string
export type KnowledgeTimestamp = string
export type ConfidenceTier = 'low' | 'medium' | 'high' | 'unknown'
export type OutcomeStatus = 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'NOT_TESTED'

export interface KnowledgeMetadata {
  timestampISO: KnowledgeTimestamp
  source: string
  version: KnowledgeVersion
  engineVersion: KnowledgeVersion
  recipeFingerprint?: string | null
  pressId?: string | null
  materialId?: string | null
  algorithmVersion?: string | null
  materialLibraryVersion?: string | null
  pressLibraryVersion?: string | null
  notes?: string
  statistics?: KnowledgeStatistics
}

export interface KnowledgeError {
  code: string
  message: string
  metadata?: Record<string, unknown>
}

export interface OperationResult<T> {
  success: boolean
  data?: T
  error?: KnowledgeError
}

export interface AlgorithmVersions {
  algorithmVersion?: string | null
  knowledgeVersion?: string | null
  materialLibraryVersion?: string | null
  pressLibraryVersion?: string | null
}

export interface KnowledgeInput {
  volumeCm3?: number | null
  projectedAreaCm2?: number | null
  thicknessMm?: number | null
  flowLengthMm?: number | null
  pressId?: string | null
  materialId?: string | null
  defectId?: string | null
  severity?: string | null
  recipeFingerprint?: string | null
  operatorId?: string | null
  processParameters?: Record<string, number | string>
  metadata?: Record<string, unknown>
}

export interface KnowledgeOutput {
  calculatedAtISO: KnowledgeTimestamp
  rawResult: Record<string, unknown>
  summary?: string
  metadata?: Record<string, unknown>
}

export interface DefectContext {
  defectId?: string | null
  severity?: string | null
  category?: string | null
  notes?: string[]
  appliedCorrections?: Record<string, unknown>[]
}

export interface BaselineSnapshot {
  recipeFingerprint?: string | null
  materialId?: string | null
  pressId?: string | null
  profile?: Record<string, unknown>
}

export interface KnowledgeContext {
  input: KnowledgeInput
  output: KnowledgeOutput
  defectContext?: DefectContext
  baseline?: BaselineSnapshot
  recipeFingerprint?: string | null
  userNotes?: string | null
  operatorId?: string | null
  createdAtISO?: KnowledgeTimestamp
}

export interface Diagnosis {
  id: string
  title: string
  description: string
  score: number
  severity: 'low' | 'medium' | 'high'
  tags: string[]
  source: string
}

export interface Recommendation {
  id: string
  target: string
  action: 'increase' | 'decrease' | 'set' | 'validate' | 'investigate'
  value?: number | string
  reason: string
  priority: number
  metadata?: Record<string, unknown>
}

export interface ConfidenceComponent {
  name: string
  weight: number
  value: number
  reason: string
}

export interface ConfidenceResult {
  value: number
  tier: ConfidenceTier
  components: ConfidenceComponent[]
  reason: string
}

export interface SimilarCase {
  id: string
  recipeFingerprint?: string | null
  pressId?: string | null
  materialId?: string | null
  similarityScore: number
  summary: string
  metadata?: Record<string, unknown>
}

export interface ReasoningStep {
  stepId: string
  description: string
  outcome: string
  references?: string[]
  metadata?: Record<string, unknown>
}

export interface NextAction {
  id: string
  title: string
  description: string
  type: 'verify' | 'apply' | 'monitor' | 'collectData'
  target?: string
  metadata?: Record<string, unknown>
}

export interface KnowledgeWarning {
  code: string
  message: string
  metadata?: Record<string, unknown>
}

export interface KnowledgeResult {
  version: KnowledgeVersion
  diagnosis: Diagnosis[]
  recommendations: Recommendation[]
  confidence: ConfidenceResult
  similarCases: SimilarCase[]
  warnings: KnowledgeWarning[]
  reasoning: ReasoningStep[]
  nextActions: NextAction[]
  metadata: KnowledgeMetadata
}

export interface KnowledgeMachineRecord {
  id: string
  name: string
  manufacturer?: string | null
  model?: string | null
  pressId?: string | null
  metadata?: Record<string, unknown>
}

export interface KnowledgeMaterialRecord {
  id: string
  name: string
  family?: string | null
  densityGPerCm3?: number | null
  recommendedTemperatureC?: number | null
  metadata?: Record<string, unknown>
}

export interface KnowledgeRecipeRecord {
  id: string
  name: string
  recipeFingerprint?: string | null
  description?: string | null
  geometryHash?: string | null
  materialId?: string | null
  pressId?: string | null
  parameters?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface KnowledgeDefectRecord {
  id: string
  name: string
  category?: string | null
  description?: string | null
  metadata?: Record<string, unknown>
}

export interface KnowledgeCorrectionRecord {
  id: string
  caseId?: string | null
  defectId?: string | null
  action: string
  field: string
  before?: number | string | null
  after?: number | string | null
  notes?: string | null
  metadata?: Record<string, unknown>
}

export interface KnowledgeOutcomeRecord {
  id: string
  status: OutcomeStatus
  improvementScore?: number | null
  notes?: string | null
  metadata?: Record<string, unknown>
}

export interface KnowledgeCaseRecord {
  id: string
  caseNumber?: string | null
  createdAtISO: KnowledgeTimestamp
  updatedAtISO?: KnowledgeTimestamp | null
  operatorId?: string | null
  operatorName?: string | null
  machineId?: string | null
  materialId?: string | null
  recipeId?: string | null
  defectId?: string | null
  correctionId?: string | null
  outcomeId?: string | null
  geometryHash?: string | null
  projectedAreaCm2?: number | null
  volumeCm3?: number | null
  thicknessMm?: number | null
  flowLengthMm?: number | null
  cycleTimeMs?: number | null
  algorithmVersion?: string | null
  knowledgeVersion?: string | null
  materialLibraryVersion?: string | null
  pressLibraryVersion?: string | null
  notes?: string | null
  metadata?: Record<string, unknown>
}

export interface KnowledgeExperimentRecord {
  id: string
  caseId: string
  sessionId?: string | null
  attemptNumber: number
  modifiedParameters: Record<string, unknown>
  beforeValues?: Record<string, unknown> | null
  afterValues?: Record<string, unknown> | null
  reason?: string | null
  outcomeStatus: OutcomeStatus
  cycleTimeMs?: number | null
  confidenceBefore?: number | null
  confidenceAfter?: number | null
  operatorId?: string | null
  operatorName?: string | null
  createdAtISO: KnowledgeTimestamp
  metadata?: Record<string, unknown>
}

export interface ExperimentQuery {
  caseId?: string | null
  fromISO?: KnowledgeTimestamp
  toISO?: KnowledgeTimestamp
  operatorId?: string | null
}

export interface KnowledgeCaseQuery {
  recipeFingerprint?: string | null
  pressId?: string | null
  materialId?: string | null
  operatorId?: string | null
  outcomeStatus?: OutcomeStatus | null
  fromISO?: KnowledgeTimestamp
  toISO?: KnowledgeTimestamp
}

export interface SimilarCaseQuery {
  recipeFingerprint?: string | null
  pressId?: string | null
  materialId?: string | null
  defectId?: string | null
  severity?: string | null
}

export interface PolicyRecord {
  id: string
  recipeFingerprint?: string | null
  materialId?: string | null
  pressId?: string | null
  rules: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface LearningRecord {
  id: string
  createdAtISO: KnowledgeTimestamp
  context: KnowledgeContext
  result: KnowledgeResult
  metadata?: Record<string, unknown>
}

export interface StatisticsFilter {
  recipeFingerprint?: string | null
  materialId?: string | null
  pressId?: string | null
  fromISO?: KnowledgeTimestamp
  toISO?: KnowledgeTimestamp
}

export interface KnowledgeStatistics {
  caseCount: number
  recipeCount: number
  machineCount: number
  materialCount: number
  defectCount: number
  correctionCount: number
  outcomeCount: number
  experimentCount: number
  policyCount: number
  averageConfidence: number
  learningRecords: number
  metadata?: Record<string, unknown>
}

export interface KnowledgeRepository {
  saveCase(record: KnowledgeCaseRecord): Promise<void>
  getCaseById(id: string): Promise<KnowledgeCaseRecord | null>
  listCases(query: KnowledgeCaseQuery): Promise<KnowledgeCaseRecord[]>
  saveRecipe(record: KnowledgeRecipeRecord): Promise<void>
  getRecipeById(id: string): Promise<KnowledgeRecipeRecord | null>
  saveMachine(record: KnowledgeMachineRecord): Promise<void>
  getMachineById(id: string): Promise<KnowledgeMachineRecord | null>
  saveMaterial(record: KnowledgeMaterialRecord): Promise<void>
  getMaterialById(id: string): Promise<KnowledgeMaterialRecord | null>
  saveDefect(record: KnowledgeDefectRecord): Promise<void>
  getDefectById(id: string): Promise<KnowledgeDefectRecord | null>
  saveCorrection(record: KnowledgeCorrectionRecord): Promise<void>
  getCorrectionById(id: string): Promise<KnowledgeCorrectionRecord | null>
  saveOutcome(record: KnowledgeOutcomeRecord): Promise<void>
  getOutcomeById(id: string): Promise<KnowledgeOutcomeRecord | null>
  saveExperiment(record: KnowledgeExperimentRecord): Promise<void>
  getExperimentById(id: string): Promise<KnowledgeExperimentRecord | null>
  listExperiments(query: ExperimentQuery): Promise<KnowledgeExperimentRecord[]>
  findSimilarCases(query: SimilarCaseQuery): Promise<SimilarCase[]>
  loadPolicies(filter: Partial<Omit<PolicyRecord, 'rules'>>): Promise<PolicyRecord[]>
  saveLearning(record: LearningRecord): Promise<void>
  getStatistics(filter?: StatisticsFilter): Promise<KnowledgeStatistics>
}
