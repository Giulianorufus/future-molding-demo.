import { useParametriStore } from '../stores/parametriStore'
import { saveKnowledgeCase, saveKnowledgeExperiment, saveKnowledgeOutcome } from './knowledgeService'
import { OutcomeStatus } from '@/engine/knowledge'

export interface KnowledgeRecorderOptions {
  sessionId?: string
  operatorId?: string
  operatorName?: string
}

function generateId(): string {
  return `kn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function extractCaseMetadata(state: any) {
  return {
    id: state.caseId ?? generateId(),
    caseNumber: state.caseNumber ?? null,
    createdAtISO: new Date().toISOString(),
    updatedAtISO: new Date().toISOString(),
    operatorId: state.operatorId ?? null,
    operatorName: state.operatorName ?? null,
    machineId: state.press?.id ?? null,
    materialId: state.material?.id ?? null,
    recipeId: state.recipe?.id ?? null,
    defectId: state.lastDefectFix?.defectId ?? null,
    correctionId: null,
    outcomeId: null,
    geometryHash: state.lastCalcResult?.meta?.geometryHash ?? null,
    projectedAreaCm2: state.lastCalcResult?.meta?.projectedArea_cm2 ?? null,
    volumeCm3: state.lastCalcResult?.meta?.volume_cm3 ?? null,
    thicknessMm: state.lastCalcResult?.meta?.thickness_mm ?? null,
    flowLengthMm: state.lastCalcResult?.meta?.flowLength_mm ?? null,
    cycleTimeMs: state.lastCalcResult?.meta?.cycleTimeMs ?? null,
    algorithmVersion: state.lastCalcResult?.meta?.algorithmVersion ?? null,
    knowledgeVersion: state.lastCalcResult?.meta?.knowledgeVersion ?? null,
    materialLibraryVersion: state.lastCalcResult?.meta?.materialLibraryVersion ?? null,
    pressLibraryVersion: state.lastCalcResult?.meta?.pressLibraryVersion ?? null,
    notes: null,
    metadata: {
      sessionId: state.sessionId ?? null,
      recipeFingerprint: state.lastCalcResult?.meta?.recipeFingerprint ?? null,
      source: 'knowledge-recorder',
    },
  }
}

function buildExperimentPayload(caseId: string, attemptNumber: number, state: any, reason: string) {
  return {
    id: generateId(),
    caseId,
    sessionId: state.sessionId ?? null,
    attemptNumber,
    modifiedParameters: state.lastInput?.parameters ?? state.lastInput ?? {},
    beforeValues: state.lastCalcResult?.meta ?? null,
    afterValues: state.result?.meta ?? null,
    reason,
    outcomeStatus: 'NOT_TESTED' as OutcomeStatus,
    cycleTimeMs: state.result?.cycleTimeMs ?? null,
    confidenceBefore: null,
    confidenceAfter: null,
    operatorId: state.operatorId ?? null,
    operatorName: state.operatorName ?? null,
    createdAtISO: new Date().toISOString(),
    metadata: {
      source: 'knowledge-recorder',
      event: reason,
    },
  }
}

export class KnowledgeRecorder {
  private subscription?: () => void
  private activeCaseId?: string | null
  private attemptNumber = 0
  private sessionId: string
  private lastDefectFixId?: string | null
  private lastRecordedInputHash?: string | null

  constructor(private readonly options: KnowledgeRecorderOptions = {}) {
    this.sessionId = options.sessionId ?? generateId()
  }

  start() {
    if (this.subscription) return
    this.subscription = useParametriStore.subscribe((state) => {
      void this.handleStateChange(state as any)
    })
  }

  stop() {
    if (this.subscription) {
      this.subscription()
      this.subscription = undefined
    }
  }

  async recordManualAttempt(reason: string, modifiedParameters: Record<string, unknown>, afterValues?: Record<string, unknown>) {
    if (!this.activeCaseId) {
      await this.recordInitialCase()
    }
    this.attemptNumber += 1
    const stateAny = useParametriStore.getState() as any
    const payload = {
      id: generateId(),
      caseId: this.activeCaseId as string,
      sessionId: this.sessionId,
      attemptNumber: this.attemptNumber,
      modifiedParameters,
      beforeValues: stateAny.lastCalcResult?.meta ?? null,
      afterValues: afterValues ?? stateAny.result?.meta ?? null,
      reason,
      outcomeStatus: 'NOT_TESTED' as OutcomeStatus,
      cycleTimeMs: stateAny.result?.cycleTimeMs ?? null,
      confidenceBefore: null,
      confidenceAfter: null,
      operatorId: this.options.operatorId ?? null,
      operatorName: this.options.operatorName ?? null,
      createdAtISO: new Date().toISOString(),
      metadata: { source: 'knowledge-recorder', event: reason },
    }
    await saveKnowledgeExperiment(payload)
  }

  async recordOutcome(outcome: {
    status: OutcomeStatus
    improvementScore?: number | null
    notes?: string | null
    metadata?: Record<string, unknown>
  }) {
    if (!this.activeCaseId) {
      await this.recordInitialCase()
    }
    const payload = {
      id: generateId(),
      status: outcome.status,
      improvementScore: outcome.improvementScore ?? null,
      notes: outcome.notes ?? null,
      metadata: {
        ...outcome.metadata,
        source: 'knowledge-recorder',
        sessionId: this.sessionId,
      },
    }
    await saveKnowledgeOutcome(payload)
  }

  private async handleStateChange(state: any) {
    const stateAny = state as any
    if (!stateAny.lastCalcResult) return

    const currentInputHash = JSON.stringify(stateAny.lastInput ?? {})
    const defectFixId = stateAny.lastDefectFix?.defectId ?? null

    if (!this.activeCaseId) {
      await this.recordInitialCase()
    }

    if (defectFixId && defectFixId !== this.lastDefectFixId) {
      this.lastDefectFixId = defectFixId
      this.attemptNumber += 1
      const payload = buildExperimentPayload(this.activeCaseId as string, this.attemptNumber, stateAny, 'defect correction')
      await saveKnowledgeExperiment(payload)
    }

    if (currentInputHash !== this.lastRecordedInputHash) {
      this.lastRecordedInputHash = currentInputHash
      if (stateAny.lastInput && stateAny.lastCalcResult) {
        this.attemptNumber += 1
        const payload = buildExperimentPayload(this.activeCaseId as string, this.attemptNumber, stateAny, 'calculation update')
        await saveKnowledgeExperiment(payload)
      }
    }
  }

  private async recordInitialCase() {
    const state = useParametriStore.getState()
    const stateAny = state as any
    const metadata = {
      sessionId: this.sessionId,
      source: 'knowledge-recorder',
      recipeFingerprint: stateAny.lastCalcResult?.meta?.recipeFingerprint ?? null,
    }
    const payload = {
      ...extractCaseMetadata({
        ...state,
        sessionId: this.sessionId,
      }),
      metadata,
    }
    console.debug('RECORDING CASE', payload)
    await saveKnowledgeCase(payload)
    this.activeCaseId = payload.id
    this.attemptNumber = 1
    return payload.id
  }
}
