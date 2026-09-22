import { z } from 'zod'

const optionalRecord = z.record(z.string(), z.unknown()).optional().nullable()

export const knowledgeStatisticsSchema = z.object({
  caseCount: z.number().int().nonnegative(),
  recipeCount: z.number().int().nonnegative(),
  machineCount: z.number().int().nonnegative(),
  materialCount: z.number().int().nonnegative(),
  defectCount: z.number().int().nonnegative(),
  correctionCount: z.number().int().nonnegative(),
  outcomeCount: z.number().int().nonnegative(),
  experimentCount: z.number().int().nonnegative(),
  policyCount: z.number().int().nonnegative(),
  averageConfidence: z.number().nonnegative(),
  learningRecords: z.number().int().nonnegative(),
  metadata: optionalRecord,
}).strict()

export type KnowledgeStatisticsSchema = z.infer<typeof knowledgeStatisticsSchema>
