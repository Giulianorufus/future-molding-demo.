import { z } from 'zod'

const optionalString = z.string().optional().nullable()
const optionalNumber = z.number().optional().nullable()
const optionalRecord = z.record(z.string(), z.unknown()).optional().nullable()
const isoTimestamp = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid ISO timestamp',
})

export const knowledgeExperimentSchema = z.object({
  id: z.string().min(1),
  caseId: z.string().min(1),
  sessionId: optionalString,
  attemptNumber: z.number().int().nonnegative(),
  modifiedParameters: z.record(z.string(), z.unknown()),
  beforeValues: optionalRecord,
  afterValues: optionalRecord,
  reason: optionalString,
  outcomeStatus: z.enum(['SUCCESS', 'PARTIAL_SUCCESS', 'FAILED', 'NOT_TESTED']),
  cycleTimeMs: optionalNumber,
  confidenceBefore: optionalNumber,
  confidenceAfter: optionalNumber,
  operatorId: optionalString,
  operatorName: optionalString,
  createdAtISO: isoTimestamp,
  metadata: optionalRecord,
}).strict()

export type KnowledgeExperimentSchema = z.infer<typeof knowledgeExperimentSchema>
