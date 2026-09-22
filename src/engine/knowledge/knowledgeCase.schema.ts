import { z } from 'zod'

const optionalString = z.string().optional().nullable()
const optionalNumber = z.number().optional().nullable()
const optionalRecord = z.record(z.string(), z.unknown()).optional().nullable()
const isoTimestamp = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid ISO timestamp',
})

export const knowledgeCaseSchema = z.object({
  id: z.string().min(1),
  caseNumber: optionalString,
  createdAtISO: isoTimestamp,
  updatedAtISO: isoTimestamp.optional().nullable(),
  operatorId: optionalString,
  operatorName: optionalString,
  machineId: optionalString,
  materialId: optionalString,
  recipeId: optionalString,
  defectId: optionalString,
  correctionId: optionalString,
  outcomeId: optionalString,
  geometryHash: optionalString,
  projectedAreaCm2: optionalNumber,
  volumeCm3: optionalNumber,
  thicknessMm: optionalNumber,
  flowLengthMm: optionalNumber,
  cycleTimeMs: optionalNumber,
  algorithmVersion: optionalString,
  knowledgeVersion: optionalString,
  materialLibraryVersion: optionalString,
  pressLibraryVersion: optionalString,
  notes: optionalString,
  metadata: optionalRecord,
}).strict()

export type KnowledgeCaseSchema = z.infer<typeof knowledgeCaseSchema>
