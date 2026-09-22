import { z } from 'zod'

const optionalString = z.string().optional().nullable()
const optionalNumber = z.number().optional().nullable()
const optionalRecord = z.record(z.string(), z.unknown()).optional().nullable()

export const knowledgeOutcomeSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['SUCCESS', 'PARTIAL_SUCCESS', 'FAILED', 'NOT_TESTED']),
  improvementScore: optionalNumber,
  notes: optionalString,
  metadata: optionalRecord,
}).strict()

export type KnowledgeOutcomeSchema = z.infer<typeof knowledgeOutcomeSchema>
