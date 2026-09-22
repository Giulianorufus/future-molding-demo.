import Database from 'better-sqlite3'
import { knowledgeCaseSchema } from './knowledgeCase.schema'
import { knowledgeOutcomeSchema } from './knowledgeOutcome.schema'
import { knowledgeExperimentSchema } from './knowledgeExperiment.schema'
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

function serializeJson(value: Record<string, unknown> | string[] | null | undefined): string | null {
  return value == null ? null : JSON.stringify(value)
}

function deserializeJson<T>(value: string | null): T | null {
  return value == null ? null : (JSON.parse(value) as T)
}

export class SqliteKnowledgeRepository implements KnowledgeRepository {
  private readonly db: Database

  constructor(databasePath: string) {
    this.db = new Database(databasePath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
    this.initializeSchema()
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS machines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        manufacturer TEXT,
        model TEXT,
        pressId TEXT,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        family TEXT,
        densityGPerCm3 REAL,
        recommendedTemperatureC REAL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        recipeFingerprint TEXT,
        description TEXT,
        geometryHash TEXT,
        materialId TEXT,
        pressId TEXT,
        parameters TEXT,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS defects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS corrections (
        id TEXT PRIMARY KEY,
        caseId TEXT,
        defectId TEXT,
        action TEXT NOT NULL,
        field TEXT NOT NULL,
        beforeValue TEXT,
        afterValue TEXT,
        notes TEXT,
        metadata TEXT,
        FOREIGN KEY(caseId) REFERENCES cases(id) ON DELETE SET NULL,
        FOREIGN KEY(defectId) REFERENCES defects(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS outcomes (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        improvementScore REAL,
        notes TEXT,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS policies (
        id TEXT PRIMARY KEY,
        recipeFingerprint TEXT,
        materialId TEXT,
        pressId TEXT,
        rules TEXT NOT NULL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        caseNumber TEXT,
        createdAtISO TEXT NOT NULL,
        updatedAtISO TEXT,
        operatorId TEXT,
        operatorName TEXT,
        machineId TEXT,
        materialId TEXT,
        recipeId TEXT,
        defectId TEXT,
        correctionId TEXT,
        outcomeId TEXT,
        geometryHash TEXT,
        projectedAreaCm2 REAL,
        volumeCm3 REAL,
        thicknessMm REAL,
        flowLengthMm REAL,
        cycleTimeMs REAL,
        algorithmVersion TEXT,
        knowledgeVersion TEXT,
        materialLibraryVersion TEXT,
        pressLibraryVersion TEXT,
        notes TEXT,
        metadata TEXT,
        FOREIGN KEY(machineId) REFERENCES machines(id) ON DELETE SET NULL,
        FOREIGN KEY(materialId) REFERENCES materials(id) ON DELETE SET NULL,
        FOREIGN KEY(recipeId) REFERENCES recipes(id) ON DELETE SET NULL,
        FOREIGN KEY(defectId) REFERENCES defects(id) ON DELETE SET NULL,
        FOREIGN KEY(correctionId) REFERENCES corrections(id) ON DELETE SET NULL,
        FOREIGN KEY(outcomeId) REFERENCES outcomes(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS experiments (
        id TEXT PRIMARY KEY,
        caseId TEXT NOT NULL,
        attemptNumber INTEGER NOT NULL,
        modifiedParameters TEXT NOT NULL,
        beforeValues TEXT,
        afterValues TEXT,
        reason TEXT,
        outcomeStatus TEXT NOT NULL,
        cycleTimeMs REAL,
        confidenceBefore REAL,
        confidenceAfter REAL,
        operatorId TEXT,
        operatorName TEXT,
        createdAtISO TEXT NOT NULL,
        metadata TEXT,
        FOREIGN KEY(caseId) REFERENCES cases(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS learning_records (
        id TEXT PRIMARY KEY,
        createdAtISO TEXT NOT NULL,
        context TEXT NOT NULL,
        result TEXT NOT NULL,
        metadata TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_cases_recipeFingerprint ON cases(recipeFingerprint);
      CREATE INDEX IF NOT EXISTS idx_cases_pressId ON cases(pressId);
      CREATE INDEX IF NOT EXISTS idx_cases_materialId ON cases(materialId);
      CREATE INDEX IF NOT EXISTS idx_cases_createdAtISO ON cases(createdAtISO);
      CREATE INDEX IF NOT EXISTS idx_cases_updatedAtISO ON cases(updatedAtISO);
      CREATE INDEX IF NOT EXISTS idx_cases_recipeFingerprint_materialId ON cases(recipeFingerprint, materialId);
      CREATE INDEX IF NOT EXISTS idx_experiments_caseId ON experiments(caseId);
      CREATE INDEX IF NOT EXISTS idx_experiments_sessionId ON experiments(sessionId);
      CREATE INDEX IF NOT EXISTS idx_experiments_outcomeStatus ON experiments(outcomeStatus);
      CREATE INDEX IF NOT EXISTS idx_outcomes_status ON outcomes(status);
    `)
  }

  async saveCase(record: KnowledgeCaseRecord): Promise<void> {
    const validRecord = knowledgeCaseSchema.parse(record)
    const stmt = this.db.prepare(`
      INSERT INTO cases (
        id, caseNumber, createdAtISO, updatedAtISO, operatorId, operatorName,
        machineId, materialId, recipeId, defectId, correctionId, outcomeId,
        geometryHash, projectedAreaCm2, volumeCm3, thicknessMm, flowLengthMm,
        cycleTimeMs, algorithmVersion, knowledgeVersion, materialLibraryVersion,
        pressLibraryVersion, notes, metadata
      ) VALUES (
        @id, @caseNumber, @createdAtISO, @updatedAtISO, @operatorId, @operatorName,
        @machineId, @materialId, @recipeId, @defectId, @correctionId, @outcomeId,
        @geometryHash, @projectedAreaCm2, @volumeCm3, @thicknessMm, @flowLengthMm,
        @cycleTimeMs, @algorithmVersion, @knowledgeVersion, @materialLibraryVersion,
        @pressLibraryVersion, @notes, @metadata
      )
      ON CONFLICT(id) DO UPDATE SET
        caseNumber = excluded.caseNumber,
        updatedAtISO = excluded.updatedAtISO,
        operatorId = excluded.operatorId,
        operatorName = excluded.operatorName,
        machineId = excluded.machineId,
        materialId = excluded.materialId,
        recipeId = excluded.recipeId,
        defectId = excluded.defectId,
        correctionId = excluded.correctionId,
        outcomeId = excluded.outcomeId,
        geometryHash = excluded.geometryHash,
        projectedAreaCm2 = excluded.projectedAreaCm2,
        volumeCm3 = excluded.volumeCm3,
        thicknessMm = excluded.thicknessMm,
        flowLengthMm = excluded.flowLengthMm,
        cycleTimeMs = excluded.cycleTimeMs,
        algorithmVersion = excluded.algorithmVersion,
        knowledgeVersion = excluded.knowledgeVersion,
        materialLibraryVersion = excluded.materialLibraryVersion,
        pressLibraryVersion = excluded.pressLibraryVersion,
        notes = excluded.notes,
        metadata = excluded.metadata
    `)

    stmt.run({
      ...validRecord,
      metadata: serializeJson(validRecord.metadata),
    })
  }

  async getCaseById(id: string): Promise<KnowledgeCaseRecord | null> {
    const stmt = this.db.prepare(`SELECT * FROM cases WHERE id = ?`)
    const row = stmt.get(id)
    if (!row) return null

    return {
      ...row,
      metadata: deserializeJson<Record<string, unknown>>(row.metadata),
    }
  }

  async listCases(query: KnowledgeCaseQuery): Promise<KnowledgeCaseRecord[]> {
    const conditions: string[] = []
    const params: Record<string, unknown> = {}

    if (query.recipeFingerprint != null) {
      conditions.push('recipeFingerprint = @recipeFingerprint')
      params.recipeFingerprint = query.recipeFingerprint
    }
    if (query.pressId != null) {
      conditions.push('pressId = @pressId')
      params.pressId = query.pressId
    }
    if (query.materialId != null) {
      conditions.push('materialId = @materialId')
      params.materialId = query.materialId
    }
    if (query.operatorId != null) {
      conditions.push('operatorId = @operatorId')
      params.operatorId = query.operatorId
    }
    if (query.fromISO != null) {
      conditions.push('createdAtISO >= @fromISO')
      params.fromISO = query.fromISO
    }
    if (query.toISO != null) {
      conditions.push('createdAtISO <= @toISO')
      params.toISO = query.toISO
    }

    const sql = `SELECT * FROM cases ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''} ORDER BY createdAtISO DESC`
    const stmt = this.db.prepare(sql)
    const rows = stmt.all(params)

    return rows.map((row: any) => ({
      ...row,
      metadata: deserializeJson<Record<string, unknown>>(row.metadata),
    }))
  }

  async saveRecipe(record: KnowledgeRecipeRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO recipes (
        id, name, recipeFingerprint, description, geometryHash,
        materialId, pressId, parameters, metadata
      ) VALUES (
        @id, @name, @recipeFingerprint, @description, @geometryHash,
        @materialId, @pressId, @parameters, @metadata
      )
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        recipeFingerprint = excluded.recipeFingerprint,
        description = excluded.description,
        geometryHash = excluded.geometryHash,
        materialId = excluded.materialId,
        pressId = excluded.pressId,
        parameters = excluded.parameters,
        metadata = excluded.metadata
    `)

    stmt.run({
      ...record,
      parameters: serializeJson(record.parameters),
      metadata: serializeJson(record.metadata),
    })
  }

  async getRecipeById(id: string): Promise<KnowledgeRecipeRecord | null> {
    const stmt = this.db.prepare(`SELECT * FROM recipes WHERE id = ?`)
    const row = stmt.get(id)
    if (!row) return null

    return {
      ...row,
      parameters: deserializeJson<Record<string, unknown>>(row.parameters),
      metadata: deserializeJson<Record<string, unknown>>(row.metadata),
    }
  }

  async saveMachine(record: KnowledgeMachineRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO machines (id, name, manufacturer, model, pressId, metadata)
      VALUES (@id, @name, @manufacturer, @model, @pressId, @metadata)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        manufacturer = excluded.manufacturer,
        model = excluded.model,
        pressId = excluded.pressId,
        metadata = excluded.metadata
    `)

    stmt.run({
      ...record,
      metadata: serializeJson(record.metadata),
    })
  }

  async getMachineById(id: string): Promise<KnowledgeMachineRecord | null> {
    const stmt = this.db.prepare(`SELECT * FROM machines WHERE id = ?`)
    const row = stmt.get(id)
    if (!row) return null

    return {
      ...row,
      metadata: deserializeJson<Record<string, unknown>>(row.metadata),
    }
  }

  async saveMaterial(record: KnowledgeMaterialRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO materials (id, name, family, densityGPerCm3, recommendedTemperatureC, metadata)
      VALUES (@id, @name, @family, @densityGPerCm3, @recommendedTemperatureC, @metadata)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        family = excluded.family,
        densityGPerCm3 = excluded.densityGPerCm3,
        recommendedTemperatureC = excluded.recommendedTemperatureC,
        metadata = excluded.metadata
    `)

    stmt.run({
      ...record,
      metadata: serializeJson(record.metadata),
    })
  }

  async getMaterialById(id: string): Promise<KnowledgeMaterialRecord | null> {
    const stmt = this.db.prepare(`SELECT * FROM materials WHERE id = ?`)
    const row = stmt.get(id)
    if (!row) return null

    return {
      ...row,
      metadata: deserializeJson<Record<string, unknown>>(row.metadata),
    }
  }

  async saveDefect(record: KnowledgeDefectRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO defects (id, name, category, description, metadata)
      VALUES (@id, @name, @category, @description, @metadata)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        description = excluded.description,
        metadata = excluded.metadata
    `)

    stmt.run({
      ...record,
      metadata: serializeJson(record.metadata),
    })
  }

  async getDefectById(id: string): Promise<KnowledgeDefectRecord | null> {
    const stmt = this.db.prepare(`SELECT * FROM defects WHERE id = ?`)
    const row = stmt.get(id)
    if (!row) return null

    return {
      ...row,
      metadata: deserializeJson<Record<string, unknown>>(row.metadata),
    }
  }

  async saveCorrection(record: KnowledgeCorrectionRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO corrections (
        id, caseId, defectId, action, field, beforeValue, afterValue, notes, metadata
      ) VALUES (
        @id, @caseId, @defectId, @action, @field, @beforeValue, @afterValue, @notes, @metadata
      )
      ON CONFLICT(id) DO UPDATE SET
        caseId = excluded.caseId,
        defectId = excluded.defectId,
        action = excluded.action,
        field = excluded.field,
        beforeValue = excluded.beforeValue,
        afterValue = excluded.afterValue,
        notes = excluded.notes,
        metadata = excluded.metadata
    `)

    stmt.run({
      ...record,
      beforeValue: record.before == null ? null : String(record.before),
      afterValue: record.after == null ? null : String(record.after),
      metadata: serializeJson(record.metadata),
    })
  }

  async getCorrectionById(id: string): Promise<KnowledgeCorrectionRecord | null> {
    const stmt = this.db.prepare(`SELECT * FROM corrections WHERE id = ?`)
    const row = stmt.get(id)
    if (!row) return null

    return {
      ...row,
      before: row.beforeValue,
      after: row.afterValue,
      metadata: deserializeJson<Record<string, unknown>>(row.metadata),
    }
  }

  async saveOutcome(record: KnowledgeOutcomeRecord): Promise<void> {
    const validRecord = knowledgeOutcomeSchema.parse(record)
    const stmt = this.db.prepare(`
      INSERT INTO outcomes (id, status, improvementScore, notes, metadata)
      VALUES (@id, @status, @improvementScore, @notes, @metadata)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        improvementScore = excluded.improvementScore,
        notes = excluded.notes,
        metadata = excluded.metadata
    `)

    stmt.run({
      ...validRecord,
      metadata: serializeJson(validRecord.metadata),
    })
  }

  async getOutcomeById(id: string): Promise<KnowledgeOutcomeRecord | null> {
    const stmt = this.db.prepare(`SELECT * FROM outcomes WHERE id = ?`)
    const row = stmt.get(id)
    if (!row) return null

    return {
      ...row,
      metadata: deserializeJson<Record<string, unknown>>(row.metadata),
    }
  }

  async saveExperiment(record: KnowledgeExperimentRecord): Promise<void> {
    const validRecord = knowledgeExperimentSchema.parse(record)
    const stmt = this.db.prepare(`
      INSERT INTO experiments (
        id, caseId, attemptNumber, modifiedParameters, beforeValues, afterValues,
        reason, outcomeStatus, cycleTimeMs, confidenceBefore, confidenceAfter,
        operatorId, operatorName, createdAtISO, metadata
      ) VALUES (
        @id, @caseId, @attemptNumber, @modifiedParameters, @beforeValues, @afterValues,
        @reason, @outcomeStatus, @cycleTimeMs, @confidenceBefore, @confidenceAfter,
        @operatorId, @operatorName, @createdAtISO, @metadata
      )
      ON CONFLICT(id) DO UPDATE SET
        caseId = excluded.caseId,
        attemptNumber = excluded.attemptNumber,
        modifiedParameters = excluded.modifiedParameters,
        beforeValues = excluded.beforeValues,
        afterValues = excluded.afterValues,
        reason = excluded.reason,
        outcomeStatus = excluded.outcomeStatus,
        cycleTimeMs = excluded.cycleTimeMs,
        confidenceBefore = excluded.confidenceBefore,
        confidenceAfter = excluded.confidenceAfter,
        operatorId = excluded.operatorId,
        operatorName = excluded.operatorName,
        createdAtISO = excluded.createdAtISO,
        metadata = excluded.metadata
    `)

    stmt.run({
      ...validRecord,
      modifiedParameters: serializeJson(validRecord.modifiedParameters),
      beforeValues: serializeJson(validRecord.beforeValues),
      afterValues: serializeJson(validRecord.afterValues),
      metadata: serializeJson(validRecord.metadata),
    })
  }

  async getExperimentById(id: string): Promise<KnowledgeExperimentRecord | null> {
    const stmt = this.db.prepare(`SELECT * FROM experiments WHERE id = ?`)
    const row = stmt.get(id)
    if (!row) return null

    return {
      ...row,
      modifiedParameters: deserializeJson<Record<string, unknown>>(row.modifiedParameters) ?? {},
      beforeValues: deserializeJson<Record<string, unknown>>(row.beforeValues),
      afterValues: deserializeJson<Record<string, unknown>>(row.afterValues),
      metadata: deserializeJson<Record<string, unknown>>(row.metadata),
    }
  }

  async listExperiments(query: ExperimentQuery): Promise<KnowledgeExperimentRecord[]> {
    const conditions: string[] = []
    const params: Record<string, unknown> = {}

    if (query.caseId != null) {
      conditions.push('caseId = @caseId')
      params.caseId = query.caseId
    }
    if (query.operatorId != null) {
      conditions.push('operatorId = @operatorId')
      params.operatorId = query.operatorId
    }
    if (query.fromISO != null) {
      conditions.push('createdAtISO >= @fromISO')
      params.fromISO = query.fromISO
    }
    if (query.toISO != null) {
      conditions.push('createdAtISO <= @toISO')
      params.toISO = query.toISO
    }

    const sql = `SELECT * FROM experiments ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''} ORDER BY createdAtISO DESC`
    const stmt = this.db.prepare(sql)
    const rows = stmt.all(params)

    return rows.map((row: any) => ({
      ...row,
      modifiedParameters: deserializeJson<Record<string, unknown>>(row.modifiedParameters) ?? {},
      beforeValues: deserializeJson<Record<string, unknown>>(row.beforeValues),
      afterValues: deserializeJson<Record<string, unknown>>(row.afterValues),
      metadata: deserializeJson<Record<string, unknown>>(row.metadata),
    }))
  }

  async findSimilarCases(query: SimilarCaseQuery): Promise<SimilarCase[]> {
    const conditions: string[] = []
    const params: Record<string, unknown> = {}

    if (query.recipeFingerprint != null) {
      conditions.push('recipeFingerprint = @recipeFingerprint')
      params.recipeFingerprint = query.recipeFingerprint
    }
    if (query.pressId != null) {
      conditions.push('pressId = @pressId')
      params.pressId = query.pressId
    }
    if (query.materialId != null) {
      conditions.push('materialId = @materialId')
      params.materialId = query.materialId
    }
    if (query.defectId != null) {
      conditions.push('defectId = @defectId')
      params.defectId = query.defectId
    }

    const similarityClauses: string[] = []

    if (query.recipeFingerprint != null) {
      similarityClauses.push('CASE WHEN recipeFingerprint = @recipeFingerprint THEN 1 ELSE 0 END')
    }
    if (query.pressId != null) {
      similarityClauses.push('CASE WHEN pressId = @pressId THEN 1 ELSE 0 END')
    }
    if (query.materialId != null) {
      similarityClauses.push('CASE WHEN materialId = @materialId THEN 1 ELSE 0 END')
    }
    if (query.defectId != null) {
      similarityClauses.push('CASE WHEN defectId = @defectId THEN 1 ELSE 0 END')
    }

    if (similarityClauses.length === 0) {
      similarityClauses.push('0')
    }

    const sql = `
      SELECT id, recipeFingerprint, pressId, materialId,
        (${similarityClauses.join(' + ')}) * 25.0 AS similarityScore,
        notes AS summary, metadata
      FROM cases
      ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
      ORDER BY similarityScore DESC, createdAtISO DESC
      LIMIT 20
    `

    const stmt = this.db.prepare(sql)
    const rows = stmt.all(params)

    return rows.map((row: any) => ({
      id: row.id,
      recipeFingerprint: row.recipeFingerprint,
      pressId: row.pressId,
      materialId: row.materialId,
      similarityScore: row.similarityScore,
      summary: row.summary ?? '',
      metadata: deserializeJson<Record<string, unknown>>(row.metadata),
    }))
  }

  async loadPolicies(filter: Partial<Omit<PolicyRecord, 'rules'>>): Promise<PolicyRecord[]> {
    const conditions: string[] = []
    const params: Record<string, unknown> = {}

    if (filter.recipeFingerprint != null) {
      conditions.push('recipeFingerprint = @recipeFingerprint')
      params.recipeFingerprint = filter.recipeFingerprint
    }
    if (filter.materialId != null) {
      conditions.push('materialId = @materialId')
      params.materialId = filter.materialId
    }
    if (filter.pressId != null) {
      conditions.push('pressId = @pressId')
      params.pressId = filter.pressId
    }

    const sql = `SELECT * FROM policies ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}`
    const stmt = this.db.prepare(sql)
    const rows = stmt.all(params)

    return rows.map((row: any) => ({
      ...row,
      rules: JSON.parse(row.rules),
      metadata: deserializeJson<Record<string, unknown>>(row.metadata),
    }))
  }

  async saveLearning(record: LearningRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO learning_records (id, createdAtISO, context, result, metadata)
      VALUES (@id, @createdAtISO, @context, @result, @metadata)
      ON CONFLICT(id) DO UPDATE SET
        createdAtISO = excluded.createdAtISO,
        context = excluded.context,
        result = excluded.result,
        metadata = excluded.metadata
    `)

    stmt.run({
      ...record,
      context: JSON.stringify(record.context),
      result: JSON.stringify(record.result),
      metadata: serializeJson(record.metadata),
    })
  }

  async getStatistics(filter?: StatisticsFilter): Promise<KnowledgeStatistics> {
    const conditions: string[] = []
    const params: Record<string, unknown> = {}

    if (filter?.recipeFingerprint != null) {
      conditions.push('recipeFingerprint = @recipeFingerprint')
      params.recipeFingerprint = filter.recipeFingerprint
    }
    if (filter?.pressId != null) {
      conditions.push('pressId = @pressId')
      params.pressId = filter.pressId
    }
    if (filter?.materialId != null) {
      conditions.push('materialId = @materialId')
      params.materialId = filter.materialId
    }
    if (filter?.fromISO != null) {
      conditions.push('createdAtISO >= @fromISO')
      params.fromISO = filter.fromISO
    }
    if (filter?.toISO != null) {
      conditions.push('createdAtISO <= @toISO')
      params.toISO = filter.toISO
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const caseCount = this.db.prepare(`SELECT COUNT(*) AS value FROM cases ${where}`).get(params).value as number
    const recipeCount = this.db.prepare('SELECT COUNT(*) AS value FROM recipes').get().value as number
    const machineCount = this.db.prepare('SELECT COUNT(*) AS value FROM machines').get().value as number
    const materialCount = this.db.prepare('SELECT COUNT(*) AS value FROM materials').get().value as number
    const defectCount = this.db.prepare('SELECT COUNT(*) AS value FROM defects').get().value as number
    const correctionCount = this.db.prepare('SELECT COUNT(*) AS value FROM corrections').get().value as number
    const outcomeCount = this.db.prepare('SELECT COUNT(*) AS value FROM outcomes').get().value as number
    const policyCount = this.db.prepare('SELECT COUNT(*) AS value FROM policies').get().value as number
    const experimentCount = this.db.prepare('SELECT COUNT(*) AS value FROM experiments').get().value as number
    const learningRecords = this.db.prepare('SELECT COUNT(*) AS value FROM learning_records').get().value as number
    const averageConfidence = 0

    return {
      caseCount,
      recipeCount,
      machineCount,
      materialCount,
      defectCount,
      correctionCount,
      outcomeCount,
      experimentCount,
      policyCount,
      averageConfidence,
      learningRecords,
      metadata: {
        source: 'sqlite-knowledge-repository',
      },
    }
  }

  close(): void {
    this.db.close()
  }
}
